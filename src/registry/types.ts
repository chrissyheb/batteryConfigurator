// Zentrale Registry für Component-Definitionen.
//
// Jede Geräte-/Config-Komponente (Smartmeter, BatteryInverter, PowerLimitGroup, ...)
// wird einmal als ComponentDefinition beschrieben und hier registriert. Neue
// Komponente hinzufügen = neue Datei unter src/components/<name>/spec.ts +
// Eintrag in src/registry/index.ts. App.tsx/Formulare müssen dafür nicht
// angefasst werden (sofern kein komplett neues UI-Layout nötig ist).

import type { AvailabilitySpec } from '@/core/versioning';

export type ComponentCategory =
  | 'global'
  | 'system'
  | 'ems-equipment'
  | 'ems-config'
  | 'main-equipment'
  | 'main-config';

/** Pfad relativ zur Komponenten-Instanz, z.B. ['HardwareType'] oder ['RippleControl','DiContactType']. */
export type ValidationPath = Array<string | number>;
export type ValidationIssue = { message: string; path: ValidationPath };

export interface ComponentDefinition<TFields = any, TDefaults = any> {
  /** Eindeutiger Schlüssel, entspricht dem bisherigen components.<Key> aus catalog.ts */
  key: string;
  category: ComponentCategory;
  /** Field-Spec-Baum (TypeString/TypeNumber/... bzw. verschachtelte { group: {...} }) */
  fields: TFields;
  /** Default-Werte-Template (kann Platzhalter wie '@uuid', '${n}' enthalten, siehe spec/builder.ts) */
  defaults?: TDefaults;
  /** Optional: die gesamte Komponente ist nur unter bestimmter Version/HardwareVariant wählbar */
  availability?: AvailabilitySpec;
  /**
   * Optional: lokale Validierung, die ausschließlich von den Feldern DIESER
   * Komponenten-Instanz abhängt (z.B. HardwareType/HardwareModel-Konsistenz).
   * Zurückgegebene Pfade sind relativ zur Instanz - der Aufrufer (spec/rules.ts)
   * stellt den vollen Pfad (inkl. Listenindex) voran.
   * Cross-Component- oder listenweite Regeln (Duplikate, Cardinality,
   * Terra/Blokk-Konsistenz über mehrere Komponenten) gehören NICHT hierher,
   * sondern bleiben zentral in spec/rules.ts, da sie keiner einzelnen
   * Komponente eindeutig zuordenbar sind.
   */
  validate?: (instance: any) => ValidationIssue[];
  /**
   * Escape-Hatch für Felder, die sich nicht über die deklarativen Hooks
   * (readOnlyWhen/onChangeEffect/enumFrom, siehe core/field-types.ts) abbilden
   * lassen, weil sie z.B. eine ganze Unterkomponente anlegen/löschen statt nur
   * einen Skalarwert zu schreiben (z.B. der BatteryInverterModbus-Toggle).
   * Wird vom generischen Renderer (core/form-renderer.tsx -> renderComponentFields)
   * NUR für die Top-Level-Keys dieser Komponente konsultiert - bevor der
   * generische Gruppen-/Blatt-Dispatch für diesen Key greift. `ctx` ist
   * strukturell FormRendererCtx (hier als `any` typisiert, um keine Abhängigkeit
   * zu core/form-renderer.tsx einzuführen).
   */
  fieldOverride?: Record<string, (path: Array<string | number>, ctx: any) => any>;
}

const registry = new Map<string, ComponentDefinition>();

export function registerComponent(def: ComponentDefinition): void
{
  registry.set(def.key, def);
}

export function getComponent(key: string): ComponentDefinition
{
  const def = registry.get(key);
  if (!def) { throw new Error(`Unknown component in registry: ${key}`); }
  return def;
}

export function listComponents(category?: ComponentCategory): ComponentDefinition[]
{
  const all = [...registry.values()];
  return category ? all.filter((d) => d.category === category) : all;
}
