// Generische Feldtyp-Bausteine für Component-Specs.
// (Bisher Teil von src/spec/catalog.ts – hier bewusst ohne Kenntnis
// konkreter Geräte/Enums.)
//
// enumRef/enum referenzieren erlaubte Werte DIREKT (Array bzw. Record), nicht
// mehr per String-Lookup in einer zentralen enums.ts - jede Wertliste lebt
// direkt bei der components/<name>/spec.ts, die sie definiert.

import type { AvailabilitySpec } from './versioning';

export type IntegerString = string;
export type UUID = string;
export type IPv4 = string;

export const ui = { typeFirst: true } as const;

export type IndexStringType = [number, string];

/** Erlaubte Werte für TypeString.enumRef: entweder eine flache Liste, oder eine
 *  "Hardware -> Modelle"-Map (z.B. smartmeterHardwareToTypes), deren Top-Level-Keys
 *  die eigentlichen erlaubten Werte des Feldes sind. */
export type StringEnumRef = readonly string[] | Record<string, readonly string[]>;

type BaseType<T extends 'number' | 'string' | 'bool' | 'indexString' | 'ipv4' | 'uuid'> = {
  type: T;
  required: boolean;
  hint: string;
  readOnly?: boolean;
  /** Optionale Verfügbarkeits-Bedingung (Version/HardwareVariant/Custom). Ohne Angabe: immer verfügbar. */
  availability?: AvailabilitySpec;
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
  enum?: readonly string[],
  plcVariableName?: boolean
};
export function TypeString(
  opts: Omit<TypeStringDef, 'type'> & { type?: never }
): TypeStringDef {
  return { type: 'string', ...opts };
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
  enumRef?: readonly IndexStringType[]
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

export type NumberParameters = { type: string, min: number, max: number, int: boolean, required: boolean };
