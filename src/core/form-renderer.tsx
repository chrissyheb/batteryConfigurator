// Generischer Form-Renderer: rendert einen Component-Spec-Feldbaum (siehe
// core/field-types.ts / registry/types.ts) automatisch als JSX, statt dass
// jedes Feld einzeln von Hand in einer forms/*.tsx-Datei verdrahtet wird.
//
// Läuft nach demselben Muster wie core/schema-builder.ts (das denselben Baum
// bereits rekursiv für Zod-Schemas abläuft): pro Knoten wird geprüft, ob es
// ein "group"-Knoten (-> verschachtelte Collapsible, oder "geflacht" ohne
// eigene Karte - siehe `flatten` unten), ein Blatt-Feld (TypeString/TypeNumber/
// TypeBool/TypeIndexString/TypeIPv4/TypeUuid) oder ein TypeArray (festes/
// variables Array eines Grundtyps, z.B. MaxPowerRate) ist, und Availability
// (core/versioning.ts) wird pro Knoten ausgewertet, um nicht verfügbare
// Felder/Gruppen einfach nicht zu rendern.
//
// Listen-/Override-Metadatenschicht (siehe registry/lists.ts):
//  - Cross-Field-Seiteneffekte (HardwareType -> HardwareModel-Vorbelegung),
//    dynamisches readOnly (CurrentTransformerPrimaryCurrent) und dynamische
//    Enum-Optionen (HardwareModel abhängig vom gewählten HardwareType) werden
//    über deklarative Hooks direkt am Feld gelöst (readOnlyWhen/onChangeEffect/
//    enumFrom, siehe core/field-types.ts) - dafür bleibt der generische
//    Renderer zuständig, kein Form-Override nötig.
//  - Für den selteneren Fall, dass ein Feld keinen Skalarwert schreibt, sondern
//    z.B. eine ganze Unterkomponente anlegt/löscht (BatteryInverterModbus-
//    Toggle), gibt es den Escape-Hatch `ComponentDefinition.fieldOverride`
//    (siehe registry/types.ts), konsultiert von `renderComponentFields` NUR
//    für die Top-Level-Keys der jeweiligen Komponente.
//  - Equipment-/Config-LISTEN (Smartmeter[], BatteryInverter[], ...) werden
//    über `<GeneratedList listKey="..."/>` gerendert (Add/Remove-Mechanik,
//    Cardinality, Titel: siehe registry/lists.ts).

import React, { useEffect } from 'react';
import { Collapsible } from '@/ui/Cards';
import { TextField, NumberField, CheckField, SelectField, GuidField } from '@/ui/Fields';
import { indexStringToString, stringToIndexString } from '@/utils/helper';
import { getVersionContext, isAvailable } from '@/core/versioning';
import { availableEnumValues, type IndexStringType } from '@/core/field-types';
import { createByKey, type PathType, type componentType } from '@/spec/builder';
import type { ComponentDefinition } from '@/registry/types';
import { getList, resolveListItemOption } from '@/registry/lists';

export type FormRendererCtx = {
  cfg: any;
  getOrCfg: (p: PathType, fb: any) => any;
  setInCfg: (p: PathType, v: any) => void;
  delFromCfg: (p: PathType) => void;
  errorPrefixSet: Set<string>;
  /**
   * Referenz auf renderFieldTree selbst - wird an fieldOverride-Funktionen
   * (siehe registry/types.ts) durchgereicht, damit z.B.
   * components/battery-inverter/spec.tsx den generischen Renderer für die
   * "normalen" Felder innerhalb eines Overrides weiterverwenden kann, OHNE
   * dass die jeweilige spec.tsx core/form-renderer.tsx importieren müsste
   * (vermeidet einen Zyklus registry -> component spec -> form-renderer).
   */
  renderFieldTree: (basePath: PathType, fields: Record<string, any>, ctx: FormRendererCtx) => React.ReactNode;
};

/** Ein "group"-Knoten im Feldbaum: { group: {...}, title?, defaultOpen?, optional?, flatten? }.
 *  `title` ist optional - ohne Angabe wird der Property-Name als Titel verwendet.
 *  `flatten: true` rendert die Gruppe OHNE eigene Collapsible-Karte, die Felder
 *  liegen dann flach in der umgebenden Karte (z.B. eine "Config"-Untergruppe,
 *  die in der bestehenden UI nie eine eigene Karte hatte - siehe die
 *  jeweilige component-spec-Datei). */
function isGroupNode(node: any): node is { group: Record<string, any>; title?: string; defaultOpen?: boolean; optional?: boolean; flatten?: boolean; availability?: any } {
  return !!node && typeof node === 'object' && 'group' in node && node.group && typeof node.group === 'object';
}

function renderLeaf(path: PathType, f: any, ctx: FormRendererCtx): React.ReactNode {
  // Fixe Literalwerte (z.B. `Type: { const: 'BatteryInverter' }`) sind keine
  // vom Nutzer editierbaren Felder - nichts rendern.
  if (f?.const !== undefined) { return null; }

  const versionCtx = getVersionContext(ctx.cfg);
  if (!isAvailable(f?.availability, versionCtx, ctx.cfg, path)) { return null; }

  const key = path.join('.');

  // Deklarative Cross-Field-Hooks (siehe core/field-types.ts): dynamisches
  // readOnly und ein Seiteneffekt NACH dem eigentlichen setInCfg - gelten
  // einheitlich für alle Feldtypen unterhalb (Array-Items lösen das über ihren
  // eigenen `item`-Feldtyp, s.u.).
  const dynamicReadOnly: boolean | undefined = f?.readOnlyWhen ? f.readOnlyWhen(ctx.cfg) : undefined;
  const onChange = f?.onChangeEffect
    ? (v: any) => { ctx.setInCfg(path, v); f.onChangeEffect(v, ctx, path); }
    : undefined;

  if (f?.type === 'array') {
    // Generisches Array eines einzelnen Grundtyps (siehe core/field-types.ts
    // -> TypeArray). Länge kommt vorrangig aus `length` (fest, z.B. MaxPowerRate
    // mit 4 Elementen); ohne `length` richtet sie sich nach dem tatsächlich
    // gespeicherten Array (kein Add/Remove hier - das ist die separate
    // Listen-Metadatenschicht für Equipment-Arrays, siehe registry/lists.ts).
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
    return <CheckField key={key} path={path} defLink={f} readOnly={dynamicReadOnly} onChange={onChange} />;
  }

  if (f?.type === 'uuid') {
    return <GuidField key={key} path={path} defLink={f} readOnly={dynamicReadOnly} onChange={onChange} />;
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
        readOnly={dynamicReadOnly}
        onChange={(v: string) => {
          const parsed = stringToIndexString(v);
          ctx.setInCfg(path, parsed);
          f.onChangeEffect?.(parsed, ctx, path);
        }}
      />
    );
  }

  if (f?.enum || f?.enumRef || f?.enumFrom) {
    // string[]/EnumOption<string>[] direkt, `enumFrom` dynamisch (abhängig von
    // einem Geschwisterfeld, z.B. HardwareModel<-HardwareType), oder eine
    // Hardware->Modelle-Map (Record) - dort sind die Top-Level-Keys die
    // erlaubten Werte (siehe core/schema-builder.ts).
    const raw = f.enumFrom ? f.enumFrom(ctx, path) : (f.enum ?? f.enumRef);
    const options: string[] = Array.isArray(raw) ? availableEnumValues<string>(raw, versionCtx, ctx.cfg) : Object.keys(raw);
    return <SelectField key={key} path={path} defLink={f} options={options} readOnly={dynamicReadOnly} onChange={onChange} />;
  }

  // TypeNumber hat type:'number'; TypeNumberUnit trägt type:'numberWithUnit' + ein
  // `unit`-Property (siehe core/field-types.ts) - NumberField entscheidet
  // selbst anhand von `unit`, ob es einen String mit Einheit parst.
  if (f?.type === 'number' || typeof f?.unit === 'string') {
    return <NumberField key={key} path={path} defLink={f} readOnly={dynamicReadOnly} onChange={onChange} />;
  }

  // Default: TypeString (ohne enum) und TypeIPv4 - beide als einfaches Textfeld.
  return <TextField key={key} path={path} defLink={f} readOnly={dynamicReadOnly} onChange={onChange} />;
}

/** Rendert einen einzelnen Knoten (Gruppe -> eigene Collapsible-Karte oder
 *  geflacht, siehe isGroupNode; sonst Blatt-Feld). Exportiert, damit
 *  forms/*.tsx einzelne Gruppen (z.B. ein "Config - X"-Unterkarte) gezielt
 *  generisch rendern kann, ohne gleich die gesamte Komponente über
 *  GeneratedForm/GeneratedList abzudecken (z.B. wenn eine Section mehrere
 *  Komponenten/Listen zu einem Layout kombiniert - siehe EmsSection/MainSection). */
export function renderFieldNode(path: PathType, node: any, ctx: FormRendererCtx): React.ReactNode {
  return renderNode(path, node, ctx);
}

function renderNode(path: PathType, node: any, ctx: FormRendererCtx): React.ReactNode {
  if (isGroupNode(node)) {
    const versionCtx = getVersionContext(ctx.cfg);
    if (!isAvailable(node.availability, versionCtx, ctx.cfg, path)) { return null; }

    if (node.flatten) {
      return <React.Fragment key={path.join('.')}>{renderFieldTree(path, node.group, ctx)}</React.Fragment>;
    }

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

/** Wie renderFieldTree, aber komponenten-bewusst: konsultiert
 *  `def.fieldOverride` (siehe registry/types.ts) für die Top-Level-Keys DIESER
 *  Komponente, bevor der generische Gruppen-/Blatt-Dispatch für den jeweiligen
 *  Key greift. Für tiefer verschachtelte Felder (z.B. innerhalb einer
 *  Unterkomponente wie BatteryInverterInverter) gilt weiterhin nur die
 *  generische renderFieldTree-Logik - fieldOverride ist bewusst auf die
 *  direkten Felder der jeweils "eigenen" ComponentDefinition begrenzt. */
export function renderComponentFields(def: ComponentDefinition, path: PathType, ctx: FormRendererCtx): React.ReactNode {
  return Object.entries(def.fields).map(([key, node]) => {
    const fieldPath = [...path, key];
    const override = def.fieldOverride?.[key];
    if (override) { return <React.Fragment key={fieldPath.join('.')}>{override(fieldPath, ctx)}</React.Fragment>; }
    return renderNode(fieldPath, node, ctx);
  });
}

export type GeneratedFormProps = FormRendererCtx & {
  def: ComponentDefinition;
  path: PathType;
  title?: string;
  defaultOpen?: boolean;
};

/** Rendert eine ganze Komponente (siehe registry/index.ts -> components.X) als
 *  Karte mit rekursiv generierten Feldern/Untergruppen (inkl. fieldOverride,
 *  siehe renderComponentFields). Für Komponenten, die Teil einer Liste sind
 *  (Smartmeter[], BatteryInverter[], ...), siehe stattdessen GeneratedList. */
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
      {renderComponentFields(def, path, ctx)}
    </Collapsible>
  );
}

export type GeneratedListProps = FormRendererCtx & {
  /** Schlüssel einer in registry/lists.ts registrierten ListDefinition. */
  listKey: string;
  title: string;
  className?: string;
  /** Zusätzlicher Inhalt direkt unterhalb des Listen-Headers, oberhalb der
   *  Items (z.B. der SmartmeterCount/SystemsInParallelCount-Zähler). */
  extra?: React.ReactNode;
};

/** Rendert eine ganze Equipment-/Config-Liste (siehe registry/lists.ts):
 *  Add-Button (ausgeblendet, sobald `max` erreicht ist), pro Item eine eigene
 *  Karte mit Titel (via ListItemOption.title) und Delete-Button (respektiert
 *  ListItemOption.deletable), Felder über renderComponentFields (inkl.
 *  fieldOverride der jeweiligen Item-Komponente). Deckt sowohl homogene
 *  Listen (Smartmeter[], BatteryInverter[], PowerLimitGroup[]) als auch
 *  polymorphe Listen ab (LocalRemoteSystems: SlaveLocalUM/SlaveRemoteUM,
 *  unterschieden über das `Type`-Feld jeder Instanz). */
export function GeneratedList(props: GeneratedListProps): React.ReactElement {
  const { listKey, title, className, extra, ...ctx } = props;
  const def = getList(listKey);
  const items: any[] = ctx.getOrCfg(def.path, []) ?? [];

  // Führt die konfigurierten `countFields` (siehe registry/lists.ts) automatisch
  // auf die aktuelle Listenlänge nach - ersetzt die vormals pro Liste
  // hand-geschriebenen useEffects in forms/EmsSection.tsx bzw. forms/MainSection.tsx.
  useEffect(() => {
    def.countFields?.forEach((fieldPath) => {
      if (ctx.getOrCfg(fieldPath, undefined) !== items.length) {
        ctx.setInCfg(fieldPath, items.length);
      }
    });
  }, [items.length]);

  // Führt `indexField` (siehe registry/lists.ts) auf die tatsächliche Position
  // jeder Instanz innerhalb der Liste nach - u.a. nötig, weil ein Löschen in
  // der Mitte der Liste die Position aller nachfolgenden Instanzen verschiebt,
  // ihr gespeicherter Indexwert aber sonst auf dem Anlage-Default stehen bliebe.
  useEffect(() => {
    if (!def.indexField) { return; }
    items.forEach((_item, i) => {
      const fieldPath = [...def.path, i, def.indexField as string];
      if (ctx.getOrCfg(fieldPath, undefined) !== i) {
        ctx.setInCfg(fieldPath, i);
      }
    });
  }, [items.length, def.indexField]);

  const relevantCount = items.filter((it) => it?.Type === def.addComponentKey).length;
  const atMax = typeof def.max === 'number' && relevantCount >= def.max;

  const addItem = (): void => {
    if (!def.addComponentKey || atMax) { return; }
    const idxNew = items.length;
    const item = createByKey(def.addComponentKey as componentType, { n: idxNew + 1 });
    ctx.setInCfg([...def.path, idxNew], item);
  };

  return (
    <Collapsible
      title={title}
      className={className ?? 'card stack'}
      actionType={def.addComponentKey && !atMax ? 'add' : undefined}
      onAction={addItem}
      path={def.path}
      errorPrefixSet={ctx.errorPrefixSet}
    >
      {extra}
      {items.map((instance, i) => {
        const option = resolveListItemOption(def, instance?.Type);
        if (!option) { return null; }
        const itemPath = [...def.path, i];
        const sameTypeCount = items.filter((it) => it?.Type === option.component.key).length;
        const deletable = typeof option.deletable === 'function' ? option.deletable(sameTypeCount) : (option.deletable ?? true);
        return (
          <Collapsible
            key={i}
            title={option.title(instance, i)}
            className="card"
            actionType={deletable ? 'delete' : undefined}
            onAction={() => ctx.delFromCfg(itemPath)}
            path={itemPath}
            errorPrefixSet={ctx.errorPrefixSet}
          >
            {renderComponentFields(option.component, itemPath, ctx)}
          </Collapsible>
        );
      })}
    </Collapsible>
  );
}
