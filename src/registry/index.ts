// Zentraler Einstiegspunkt der Component-Registry.
//
// Neue Komponente hinzufügen:
//   1. src/components/<name>/spec.ts anlegen (ComponentDefinition exportieren)
//   2. hier importieren und in `components` sowie in der passenden
//      Kategorie-Liste (emsComponentTypes/mainComponentTypes/...) eintragen
// App.tsx / EmsSection.tsx / MainSection.tsx / SystemSection.tsx müssen dafür
// nicht verändert werden, solange kein grundlegend neues UI-Layout nötig ist.

import { registerComponent, getComponent, listComponents } from './types';
import type { ComponentDefinition, ComponentCategory } from './types';

import { Global } from '@/components/global/spec';
import { System } from '@/components/system/spec';
import { PowerLimitGroup } from '@/components/power-limit-group/spec';
import { EmsConfig } from '@/components/ems-config/spec';
import { Smartmeter } from '@/components/smartmeter-ems/spec';
import { SlaveLocalUM } from '@/components/slave-local-um/spec';
import { SlaveRemoteUM } from '@/components/slave-remote-um/spec';
import { MainType, MainConfig } from '@/components/main-config/spec';
import { SmartmeterMain } from '@/components/smartmeter-main/spec';
import { BatteryInverterInverter, BatteryInverterBattery, BatteryInverterModbus, BatteryInverter } from '@/components/battery-inverter/spec';

export type { ComponentDefinition, ComponentCategory };
export { getComponent, listComponents };

// Literales, weiterhin voll typisiertes Aggregat - identische Nutzung wie
// bisher `components` aus spec/catalog.ts (components.X.fields.Y...).
export const components = {
  Global,
  System,
  EmsConfig,
  PowerLimitGroup,
  Smartmeter,
  SlaveLocalUM,
  SlaveRemoteUM,
  MainType,
  MainConfig,
  SmartmeterMain,
  BatteryInverterInverter,
  BatteryInverterBattery,
  BatteryInverterModbus,
  BatteryInverter
} as const;

// Dynamische Registrierung (für Kategorie-Abfragen / künftigen generischen
// Renderer / Availability-Checks über listComponents()).
[
  Global, System, EmsConfig, PowerLimitGroup, Smartmeter, SlaveLocalUM, SlaveRemoteUM,
  MainConfig, SmartmeterMain, BatteryInverterInverter, BatteryInverterBattery, BatteryInverterModbus, BatteryInverter
].forEach(registerComponent);

// Equipment-/Config-Typlisten je Bereich. Bisher verstreut in catalog.ts +
// builder.ts gepflegt, jetzt an einer Stelle - Kategorie der jeweiligen
// spec.ts (siehe `category`-Feld) sollte hiermit übereinstimmen.
export const emsComponentTypes = ['Smartmeter', 'SlaveLocalUM', 'SlaveRemoteUM'] as const;
export const emsConfigTypes = ['PowerLimitGroup'] as const;
export const mainComponentTypes = ['SmartmeterMain', 'BatteryInverter'] as const;
export const mainConfigTypes = ['PowerLimitGroup'] as const;
