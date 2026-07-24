// Generische Feldtyp-Bausteine für Component-Specs.
// (Bisher Teil von src/spec/catalog.ts – hier bewusst ohne Kenntnis
// konkreter Geräte/Enums.)
//
// enumRef/enum referenzieren erlaubte Werte DIREKT (Array bzw. Record), nicht
// mehr per String-Lookup in einer zentralen enums.ts - jede Wertliste lebt
// direkt bei der components/<name>/spec.ts, die sie definiert.

import { isAvailable, type AvailabilitySpec, type VersionContext } from './versioning';

export type IntegerString = string;
export type UUID = string;
export type IPv4 = string;

export const ui = { typeFirst: true } as const;

export type IndexStringType = [number, string];

/**
 * Ein Enum-Wert einer Options-Liste (z.B. inverterTypes, controlCabinetTypes):
 * entweder direkt der erlaubte Wert, oder - wenn er nur unter bestimmter
 * Version/HardwareVariant gültig ist - als { value, availability } annotiert.
 * Bestehende reine string[]/IndexStringType[]-Listen bleiben dadurch unverändert
 * gültig (jedes T ist auch ein EnumOption<T>) - keine Migration nötig, solange
 * eine Liste keine versions-/varianten-abhängigen Werte enthält.
 */
export type EnumOption<T> = T | { value: T; availability?: AvailabilitySpec };

function isRichEnumOption(o: any): o is { value: any; availability?: AvailabilitySpec }
{
  return o !== null && typeof o === 'object' && !Array.isArray(o) && 'value' in o;
}

export function enumOptionValue<T>(o: EnumOption<T>): T
{
  return isRichEnumOption(o) ? (o.value as T) : (o as T);
}

export function enumOptionAvailability<T>(o: EnumOption<T>): AvailabilitySpec | undefined
{
  return isRichEnumOption(o) ? o.availability : undefined;
}

/** Liefert aus einer Enum-Options-Liste nur die im aktuellen VersionContext
 *  verfügbaren Werte, flach (ohne Wrapper) - gedacht für UI-Dropdowns. */
export function availableEnumValues<T>(options: readonly EnumOption<T>[], ctx: VersionContext, cfg?: any): T[]
{
  return options.filter((o) => isAvailable(enumOptionAvailability(o), ctx, cfg)).map((o) => enumOptionValue(o));
}

/** Sucht die Availability-Angabe für einen konkreten (bereits gewählten) Wert
 *  innerhalb einer Enum-Options-Liste - für Cross-Rules (siehe spec/rules.ts). */
export function findEnumOptionAvailability<T>(options: readonly EnumOption<T>[], value: T): AvailabilitySpec | undefined
{
  const target = JSON.stringify(value);
  const found = options.find((o) => JSON.stringify(enumOptionValue(o)) === target);
  return found ? enumOptionAvailability(found) : undefined;
}

/** Erlaubte Werte für TypeString.enumRef: entweder eine flache Liste (optional mit
 *  versions-/varianten-abhängigen Einträgen), oder eine "Hardware -> Modelle"-Map
 *  (z.B. smartmeterHardwareToTypes), deren Top-Level-Keys die eigentlichen
 *  erlaubten Werte des Feldes sind. */
export type StringEnumRef = readonly EnumOption<string>[] | Record<string, readonly string[]>;

/**
 * Minimaler, strukturell kompatibler Ausschnitt von core/form-renderer.tsx's
 * FormRendererCtx - bewusst hier lokal definiert (statt importiert), damit
 * field-types.ts (Basis für alle Component-Specs) keine Abhängigkeit zum
 * Renderer bekommt. Der echte FormRendererCtx erfüllt diese Form immer.
 */
export type FieldCtx = {
  cfg: any;
  getOrCfg: (path: Array<string | number>, fallback: any) => any;
  setInCfg: (path: Array<string | number>, value: any) => void;
};

type BaseType<T extends 'number' | 'string' | 'bool' | 'indexString' | 'ipv4' | 'uuid' | 'array'> = {
  type: T;
  required: boolean;
  hint: string;
  readOnly?: boolean;
  /** Optionale Verfügbarkeits-Bedingung (Version/HardwareVariant/Custom). Ohne Angabe: immer verfügbar. */
  availability?: AvailabilitySpec;
  /** Dynamisches readOnly abhängig vom restlichen Config-Objekt (z.B.
   *  CurrentTransformerPrimaryCurrent nur editierbar bei bestimmtem HardwareModel).
   *  Analog zu AvailabilitySpec.when (core/versioning.ts), aber unabhängig von
   *  Verfügbarkeit - das Feld bleibt sichtbar, wird aber schreibgeschützt. */
  readOnlyWhen?: (cfg: any) => boolean;
  /** Seiteneffekt nach einer Werteänderung dieses Feldes (z.B. HardwareType->
   *  HardwareModel-Vorbelegung). Der generische Renderer (core/form-renderer.tsx)
   *  ruft zuerst den normalen setInCfg(path, value) wie gewohnt auf und
   *  anschließend diesen Hook - `path` ist der volle Pfad DIESES Feldes, sodass
   *  Geschwisterfelder z.B. über [...path.slice(0,-1), 'AndererName'] adressiert
   *  werden können. */
  onChangeEffect?: (value: any, ctx: FieldCtx, path: Array<string | number>) => void;
};

export type TypeNumberDef = BaseType<'number'> & {
  unit?: string, // unit for number
  min?: number, // min limit of value
  max?: number, // max limit of value
  int?: boolean // is value a integer ??
};
export function TypeNumber(
  opts: Omit<TypeNumberDef, 'type'> & { type?: never }
): TypeNumberDef {
  return { type: 'number', ...opts };
};

export type TypeStringDef = BaseType<'string'> & {
  enumRef?: StringEnumRef,
  enum?: readonly EnumOption<string>[],
  /** Dynamische Werteliste abhängig vom restlichen Config-Objekt (z.B.
   *  HardwareModel-Optionen abhängig vom gewählten HardwareType desselben
   *  Elements) - Alternative zum statischen `enum`/`enumRef` für Fälle, in
   *  denen die erlaubten Werte nicht allein aus dem Feld selbst ableitbar sind. */
  enumFrom?: (ctx: FieldCtx, path: Array<string | number>) => readonly EnumOption<string>[],
  plcVariableName?: boolean
};
export function TypeString(
  opts: Omit<TypeStringDef, 'type'> & { type?: never }
): TypeStringDef {
  return { type: 'string', ...opts };
};

/**
 * Baut ein Paar zusammengehöriger String-Felder aus einer "Key -> Werte[]"-Map
 * (z.B. HardwareType -> HardwareModel[]), OHNE dass onChangeEffect/enumFrom pro
 * Vorkommen erneut von Hand geschrieben werden müssen (bisher identisch
 * dupliziert zwischen components/smartmeter-ems/spec.ts und
 * components/smartmeter-main/spec.ts):
 *  - `primaryKey` bietet die Map-Keys als Optionen an und belegt beim Ändern
 *    automatisch `secondaryKey` mit dem ersten passenden Wert vor (onChangeEffect).
 *  - `secondaryKey` bietet dynamisch nur die zum aktuell gewählten
 *    `primaryKey`-Wert passenden Werte an (enumFrom).
 * Gibt ein Objekt mit beiden Feldern zurück (Keys = primaryKey/secondaryKey),
 * gedacht zum direkten Hineinspreaden in einen Feldbaum:
 *   fields: { ..., ...dependentEnumFields(map, {...}), ... }
 */
export function dependentEnumFields(
  map: Record<string, readonly string[]>,
  opts: { primaryKey: string; primaryHint: string; secondaryKey: string; secondaryHint: string }
): Record<string, TypeStringDef>
{
  const { primaryKey, primaryHint, secondaryKey, secondaryHint } = opts;
  return {
    [primaryKey]: TypeString({
      required: true,
      hint: primaryHint,
      enumRef: map,
      onChangeEffect: (value, ctx, path) =>
      {
        const options = map[value as string] ?? [];
        ctx.setInCfg([...path.slice(0, -1), secondaryKey], options[0] ?? '');
      }
    }),
    [secondaryKey]: TypeString({
      required: true,
      hint: secondaryHint,
      enumFrom: (ctx, path) =>
      {
        const primaryValue = ctx.getOrCfg([...path.slice(0, -1), primaryKey], '');
        return map[primaryValue as string] ?? [];
      }
    })
  };
};

export type TypeNumberUnitDef = BaseType<'string'> & {
  unit?: string, // unit for number
  min?: number, // min limit of value
  max?: number, // max limit of value
  int?: boolean // is value a integer ??
};
export function TypeNumberUnit(
  opts: Omit<TypeNumberUnitDef, 'type'> & { type?: never }
): TypeNumberUnitDef {
  return { type: 'string', ...opts };
};

export type TypeBoolDef = BaseType<'bool'>;
export function TypeBool(
  opts: Omit<TypeBoolDef, 'type'> & { type?: never }
): TypeBoolDef {
  return { type: 'bool', ...opts };
};

export type TypeIndexStringDef = BaseType<'indexString'> & {
  enumRef?: readonly EnumOption<IndexStringType>[]
};
export function TypeIndexString(
  opts: Omit<TypeIndexStringDef, 'type'> & { type?: never }
): TypeIndexStringDef {
  return { type: 'indexString', ...opts };
};

export type TypeIPv4Def = BaseType<'ipv4'>;
export function TypeIPv4(
  opts: Omit<TypeIPv4Def, 'type'> & { type?: never }
): TypeIPv4Def {
  return { type: 'ipv4', ...opts };
};

export type TypeUuidDef = BaseType<'uuid'>;
export function TypeUuid(
  opts: Omit<TypeUuidDef, 'type'> & { type?: never }
): TypeUuidDef {
  return { type: 'uuid', ...opts };
};

/** Erlaubte Item-Typen für TypeArray - jeder "einfache" Grundtyp außer Array
 *  selbst (kein Array aus Arrays). */
export type ArrayItemDef = TypeNumberDef | TypeStringDef | TypeNumberUnitDef | TypeBoolDef | TypeIndexStringDef | TypeIPv4Def | TypeUuidDef;

/**
 * Generisches Array eines einzelnen Grundtyps (siehe ArrayItemDef) - z.B. eine
 * feste Liste von Zahlen (RippleControl.MaxPowerRate). Anders als die
 * Equipment-Listen (Smartmeter[], BatteryInverter[], siehe registry/) ist das
 * hier ein Array aus reinen Skalarwerten OHNE Add/Remove-UI, meist mit fester
 * Länge (`length`) - kein Ersatz für die Listen-Metadatenschicht, sondern ein
 * eigenständiger, einfacherer Feldtyp für "N Werte desselben Grundtyps
 * zusammengehörig speichern/anzeigen".
 *
 * Wird sowohl im Schema (core/schema-builder.ts, `z.array(itemSchema)`) als
 * auch beim generischen Rendern (core/form-renderer.tsx) einheitlich über
 * `item` aufgelöst - der Item-Typ entscheidet, welche Validierung bzw. welche
 * UI-Feld-Komponente pro Element verwendet wird.
 */
export type TypeArrayDef = BaseType<'array'> & {
  item: ArrayItemDef;
  /** Feste Länge (z.B. 4 für MaxPowerRate0..3). Vorrangig vor min/maxLength. */
  length?: number;
  /** Nur relevant ohne `length`: variable Länge - aktuell ohne Add/Remove-UI,
   *  Länge richtet sich dann nach dem tatsächlich gespeicherten Array. */
  minLength?: number;
  maxLength?: number;
  /** Optionale Anzeige-Beschriftung für die kompakte Zeilendarstellung
   *  (z.B. "MaxPowerRates"), sonst wird der Feldname verwendet. */
  label?: string;
};
export function TypeArray(
  opts: Omit<TypeArrayDef, 'type'> & { type?: never }
): TypeArrayDef {
  return { type: 'array', ...opts };
};

export type NumberParameters = { type: string, min: number, max: number, int: boolean, required: boolean };
