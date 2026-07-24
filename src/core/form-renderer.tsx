// Generischer Form-Renderer: rendert einen Component-Spec-Feldbaum (siehe
// core/field-types.ts / registry/types.ts) automatisch als JSX, statt dass
// jedes Feld einzeln von Hand in einer forms/*.tsx-Datei verdrahtet wird.
//
// Läuft nach demselben Muster wie core/schema-builder.ts (das denselben Baum
// bereits rekursiv für Zod-Schemas abläuft): pro Knoten wird geprüft, ob es
// ein "group"-Knoten (-> verschachtelte Collapsible), ein Blatt-Feld
// (TypeString/TypeNumber/TypeBool/TypeIndexString/TypeIPv4/TypeUuid) oder ein
// TypeArray (festes/variables Array eines Grundtyps, z.B. MaxPowerRate) ist,
// und Availability (core/versioning.ts) wird pro Knoten ausgewertet, um nicht
// verfügbare Felder/Gruppen einfach nicht zu rendern.
//
// Aktueller Umfang (Phase 5, erster Schritt - siehe SystemSection.tsx):
// deckt einfache, listenfreie Komponenten ab (Blatt-Felder + verschachtelte
// Gruppen). NICHT abgedeckt sind bewusst:
//  - Equipment-/Config-Listen (Smartmeter[], BatteryInverter[], ...) - dafür
//    fehlen noch Cardinality-/Titel-Template-/Polymorphie-Metadaten in der
//    Registry (siehe components/*/spec.ts der jeweiligen Listen-Einträge).
//  - Cross-Field-Seiteneffekte beim Ändern eines Werts (z.B. HardwareType ->
//    HardwareModel-Vorbelegung, Modbus-Toggle) - dafür bräuchte es ein
//    Form-Override je Komponente; generischer Renderer bleibt bewusst "dumm".
// Für Komponenten mit solchen Sonderfällen (Ems/Main) bleiben vorerst die
// handgeschriebenen forms/EmsSection.tsx/MainSection.tsx bestehen.

import React from 'react';
import { Collapsible } from '@/ui/Cards';
import { TextField, NumberField, CheckField, SelectField, GuidField } from '@/ui/Fields';
import { indexStringToString, stringToIndexString } from '@/utils/helper';
import { getVersionContext, isAvailable } from '@/core/versioning';
import { availableEnumValues, type IndexStringType } from '@/core/field-types';
import type { PathType } from '@/spec/builder';
import type { ComponentDefinition } from '@/registry/types';

export type FormRendererCtx = {
  cfg: any;
  getOrCfg: (p: PathType, fb: any) => any;
  setInCfg: (p: PathType, v: any) => void;
  errorPrefixSet: Set<string>;
};

/** Ein "group"-Knoten im Feldbaum: { group: {...}, title?, defaultOpen?, optional? }.
 *  `title` ist optional - ohne Angabe wird der Property-Name als Titel verwendet. */
function isGroupNode(node: any): node is { group: Record<string, any>; title?: string; defaultOpen?: boolean; optional?: boolean; availability?: any } {
  return !!node && typeof node === 'object' && 'group' in node && node.group && typeof node.group === 'object';
}

function renderLeaf(path: PathType, f: any, ctx: FormRendererCtx): React.ReactNode {
  // Fixe Literalwerte (z.B. `Type: { const: 'BatteryInverter' }`) sind keine
  // vom Nutzer editierbaren Felder - nichts rendern.
  if (f?.const !== undefined) { return null; }

  const versionCtx = getVersionContext(ctx.cfg);
  if (!isAvailable(f?.availability, versionCtx, ctx.cfg)) { return null; }

  const key = path.join('.');

  if (f?.type === 'array') {
    // Generisches Array eines einzelnen Grundtyps (siehe core/field-types.ts
    // -> TypeArray). Länge kommt vorrangig aus `length` (fest, z.B. MaxPowerRate
    // mit 4 Elementen); ohne `length` richtet sie sich nach dem tatsächlich
    // gespeicherten Array (kein Add/Remove hier - das ist die separate
    // Listen-Metadatenschicht für Equipment-Arrays, nicht dieser Feldtyp).
    const item = f.item;
    const stored = ctx.getOrCfg(path, []);
    const length = typeof f.length === 'number' ? f.length : (Array.isArray(stored) ? stored.length : 0);
    const indices = Array.from({ length }, (_, i) => i);

    // Kompakte Ein-Zeilen-Darstellung existiert bisher nur für Zahlen (über das
    // bereits vorhandene NumberField-`items`-Feature, siehe ui/Fields.tsx).
    // Für andere Item-Typen gibt es noch keine kompakte Variante - generischer,
    // korrekter Fallback ist dann eine Reihe einzelner Felder untereinander
    // (jedes über denselben renderLeaf-Pfad wie jedes andere Feld).
    if (item?.type === 'number' || typeof item?.unit === 'string') {
      return (
        <NumberField
          key={key}
          label={f.label ?? String(path[path.length - 1])}
          items={indices.map((i) => ({ path: [...path, i], defLink: item }))}
        />
      );
    }

    return (
      <React.Fragment key={key}>
        {indices.map((i) => renderLeaf([...path, i], item, ctx))}
      </React.Fragment>
    );
  }

  if (f?.type === 'bool') {
    return <CheckField key={key} path={path} defLink={f} />;
  }

  if (f?.type === 'uuid') {
    return <GuidField key={key} path={path} defLink={f} />;
  }

  if (f?.type === 'indexString') {
    // IndexString-Werte sind Tupel [number,string] - SelectField arbeitet mit
    // einfachen Strings, daher hier dieselbe Konvertierung wie bisher an
    // jeder einzelnen Stelle in forms/*.tsx (indexStringToString/stringToIndexString).
    const rawOptions = availableEnumValues<IndexStringType>(f.enumRef ?? [], versionCtx, ctx.cfg);
    const fallback = rawOptions[0] ?? [0, ''];
    const current = ctx.getOrCfg(path, fallback);
    return (
      <SelectField
        key={key}
        path={path}
        defLink={f}
        options={indexStringToString(rawOptions)}
        value={indexStringToString([current])[0]}
        onChange={(v: string) => { ctx.setInCfg(path, stringToIndexString(v)); }}
      />
    );
  }

  if (f?.enum || f?.enumRef) {
    // string[]/EnumOption<string>[] direkt, oder Hardware->Modelle-Map (Record) -
    // dort sind die Top-Level-Keys die erlaubten Werte (siehe core/schema-builder.ts).
    const raw = f.enum ?? f.enumRef;
    const options: string[] = Array.isArray(raw) ? availableEnumValues<string>(raw, versionCtx, ctx.cfg) : Object.keys(raw);
    return <SelectField key={key} path={path} defLink={f} options={options} />;
  }

  // TypeNumber hat type:'number'; TypeNumberUnit trägt type:'string' + ein
  // `unit`-Property (siehe core/field-types.ts) - NumberField entscheidet
  // selbst anhand von `unit`, ob es einen String mit Einheit parst.
  if (f?.type === 'number' || typeof f?.unit === 'string') {
    return <NumberField key={key} path={path} defLink={f} />;
  }

  // Default: TypeString (ohne enum) und TypeIPv4 - beide als einfaches Textfeld.
  return <TextField key={key} path={path} defLink={f} />;
}

/** Rendert einen einzelnen Knoten (Gruppe -> eigene Collapsible-Karte, oder
 *  Blatt-Feld). Exportiert, damit forms/*.tsx einzelne Gruppen (z.B. ein
 *  "Config - X"-Unterkarte) gezielt generisch rendern kann, ohne gleich die
 *  gesamte Komponente über GeneratedForm abzudecken (z.B. wenn eine Section
 *  mehrere Komponenten/Listen zu einem Layout kombiniert - siehe EmsSection/
 *  MainSection). */
export function renderFieldNode(path: PathType, node: any, ctx: FormRendererCtx): React.ReactNode {
  return renderNode(path, node, ctx);
}

function renderNode(path: PathType, node: any, ctx: FormRendererCtx): React.ReactNode {
  if (isGroupNode(node)) {
    const versionCtx = getVersionContext(ctx.cfg);
    if (!isAvailable(node.availability, versionCtx, ctx.cfg)) { return null; }

    return (
      <Collapsible
        key={path.join('.')}
        title={node.title ?? String(path[path.length - 1])}
        defaultOpen={node.defaultOpen}
        className="card"
        path={path}
        errorPrefixSet={ctx.errorPrefixSet}
      >
        {renderFieldTree(path, node.group, ctx)}
      </Collapsible>
    );
  }
  return renderLeaf(path, node, ctx);
}

export function renderFieldTree(basePath: PathType, fields: Record<string, any>, ctx: FormRendererCtx): React.ReactNode {
  return Object.entries(fields).map(([key, node]) => renderNode([...basePath, key], node, ctx));
}

export type GeneratedFormProps = FormRendererCtx & {
  def: ComponentDefinition;
  path: PathType;
  title?: string;
  defaultOpen?: boolean;
};

/** Rendert eine ganze Komponente (siehe registry/index.ts -> components.X) als
 *  Karte mit rekursiv generierten Feldern/Untergruppen. Für Komponenten mit
 *  Listen oder Cross-Field-Seiteneffekten (noch) nicht geeignet - siehe
 *  Kommentar am Dateianfang. */
export function GeneratedForm(props: GeneratedFormProps): React.ReactElement {
  const { def, path, title, defaultOpen, ...ctx } = props;
  return (
    <Collapsible
      title={title ?? def.key}
      defaultOpen={defaultOpen}
      className="card stack"
      path={path}
      errorPrefixSet={ctx.errorPrefixSet}
    >
      {renderFieldTree(path, def.fields, ctx)}
    </Collapsible>
  );
}
