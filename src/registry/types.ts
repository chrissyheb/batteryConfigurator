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
