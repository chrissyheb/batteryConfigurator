// Zentrale Deklaration aller Equipment-/Config-LISTEN (Arrays aus vollständigen
// Komponenten-Instanzen mit Add/Remove-UI, z.B. Smartmeter[], BatteryInverter[]).
//
// Unterscheidet sich bewusst von TypeArray (core/field-types.ts), das für
// Arrays reiner Skalarwerte OHNE Add/Remove gedacht ist (z.B.
// RippleControl.MaxPowerRate) - hier geht es um Listen ganzer, eigenständiger
// Komponenten-Instanzen (siehe registry/types.ts -> ComponentDefinition).
//
// Neue Liste hinzufügen/ändern = i.d.R. nur ein Eintrag hier (Pfad, erlaubte
// Item-Komponente(n), Cardinality, Titel-Funktion) - core/form-renderer.tsx's
// <GeneratedList listKey="..."/> übernimmt Add/Remove-Mechanik, Titel und
// Feldrendering (inkl. fieldOverride der jeweiligen Item-Komponente)
// automatisch, ohne dass forms/EmsSection.tsx bzw. MainSection.tsx dafür noch
// Listen-spezifischen Code enthalten müssen.

import { cardinality } from '@/spec/rules';
import { components } from '@/registry';
import type { ComponentDefinition } from './types';

export type ListItemOption = {
  component: ComponentDefinition;
  /** Ob ein Item dieses Typs gelöscht werden darf. Bekommt die aktuelle Anzahl
   *  an Items DIESES Typs innerhalb der Liste übergeben (bei Polymorphie also
   *  nicht zwingend die Gesamtlänge der Liste). Ohne Angabe: immer löschbar. */
  deletable?: boolean | ((count: number) => boolean);
  /** Kartentitel für ein Item dieses Typs - hat Zugriff auf die Instanz selbst
   *  sowie ihren Index innerhalb der Gesamtliste. */
  title: (instance: any, index: number) => string;
};

export type ListDefinition = {
  key: string;
  path: Array<string | number>;
  /** Meist ein Eintrag (homogene Liste); mehrere bei Polymorphie (z.B.
   *  LocalRemoteSystems: SlaveLocalUM + SlaveRemoteUM, unterschieden über das
   *  `Type`-Feld jeder Instanz - siehe components/&lt;name&gt;/spec.ts). */
  items: ListItemOption[];
  /** Welche Komponente der "+"-Button anlegt (bei Polymorphie: der einzige
   *  tatsächlich per UI hinzufügbare Typ - andere Typen entstehen nur über die
   *  initiale Konfiguration, siehe spec/builder.ts -> getInitialConfig). */
  addComponentKey?: string;
  /** Obergrenze für die Anzahl an Items vom Typ `addComponentKey` (nicht
   *  zwingend die Gesamtlänge der Liste bei Polymorphie) - blendet den
   *  Add-Button aus, sobald erreicht. Ohne Angabe: kein Limit in der UI (die
   *  zentrale Validierung in spec/rules.ts greift trotzdem weiterhin). Wird
   *  außerdem von spec/builder.ts (buildConfigSchema) als Zod-Array-Max
   *  wiederverwendet, damit UI-Sperre und Schema-Validierung nie auseinanderlaufen. */
  max?: number;
  /** Absolute Config-Pfade, die automatisch auf die aktuelle Listenlänge
   *  nachgeführt werden (z.B. Units.Ems.Config.SmartmeterCount) - ersetzt die
   *  bisher pro Liste hand-geschriebenen useEffects in forms/EmsSection.tsx
   *  bzw. forms/MainSection.tsx. Mehrere Pfade möglich, falls dieselbe Länge
   *  in mehrere Config-Felder gespiegelt wird (BatteryCount UND InverterCount
   *  spiegeln beide Units.Main.Equipment.BatteryInverter.length). */
  countFields?: Array<Array<string | number>>;
  /** Feldname innerhalb jeder Instanz dieser Liste, der automatisch auf die
   *  aktuelle Position der Instanz innerhalb der Liste nachgeführt wird (z.B.
   *  BatteryInverter[].Index) - ersetzt eine rein UI-seitige Anzeige-Übersteuerung
   *  (fieldOverride), bei der der Listenindex nie tatsächlich in die Config
   *  geschrieben wurde. */
  indexField?: string;
};

const registry = new Map<string, ListDefinition>();

export function registerList(def: ListDefinition): void
{
  registry.set(def.key, def);
}

export function getList(key: string): ListDefinition
{
  const def = registry.get(key);
  if (!def) { throw new Error(`Unknown list in registry: ${key}`); }
  return def;
}

/** Ermittelt die passende ListItemOption für eine konkrete Instanz (anhand
 *  ihres `Type`-Felds, das bei allen Komponenten dem componentKey entspricht).
 *  Bei homogenen Listen (nur eine Option) wird diese als Fallback verwendet,
 *  auch wenn `Type` unerwartet abweicht. */
export function resolveListItemOption(def: ListDefinition, instanceType: string | undefined): ListItemOption | undefined
{
  return def.items.find((o) => o.component.key === instanceType) ?? (def.items.length === 1 ? def.items[0] : undefined);
}

registerList({
  key: 'EmsSmartmeter',
  path: ['Units', 'Ems', 'Equipment', 'Smartmeter'],
  items: [{
    component: components.Smartmeter,
    title: (i) => `${i?.Type ?? 'Unkown Smartmeter'} (${i?.Name ?? ''})`
  }],
  addComponentKey: 'Smartmeter',
  max: cardinality.ems.smartmeterMax,
  countFields: [['Units', 'Ems', 'Config', 'SmartmeterCount']]
});

registerList({
  key: 'EmsLocalRemoteSystems',
  path: ['Units', 'Ems', 'Equipment', 'LocalRemoteSystems'],
  items: [
    {
      component: components.SlaveLocalUM,
      deletable: false,
      title: (i) => `Local System (${i?.Name ?? ''})`
    },
    {
      component: components.SlaveRemoteUM,
      deletable: true,
      title: (i) => `Remote System (${i?.Name ?? ''})`
    }
  ],
  addComponentKey: 'SlaveRemoteUM',
  // Bezieht sich (wie die bisherige Regel in spec/rules.ts) auf die Anzahl der
  // SlaveRemoteUM-Instanzen, nicht auf die Gesamtlänge der Liste (die zusätzlich
  // immer genau ein SlaveLocalUM enthält).
  max: cardinality.ems.slaveRemoteMax,
  countFields: [['Units', 'Ems', 'Config', 'SystemsInParallelCount']]
});

/** PowerLimitGroups gibt es identisch (nur Pfad/Titel-Beschriftung
 *  unterschiedlich) sowohl unter Ems als auch unter Main - deshalb als kleine
 *  Factory statt zweimal fast identischem Listen-Objekt. */
function powerLimitGroupList(key: string, path: Array<string | number>, label: string): ListDefinition
{
  return {
    key,
    path,
    items: [{ component: components.PowerLimitGroup, title: (_i, idx) => `Power Limitation Group ${label} ${idx + 1}` }],
    addComponentKey: 'PowerLimitGroup',
    // Wird von spec/builder.ts (buildConfigSchema) als Zod-Array-Max
    // wiederverwendet (siehe getList(...).max dort) statt dort erneut die 2 zu hinterlegen.
    max: 2
  };
}

registerList(powerLimitGroupList('EmsPowerLimitGroups', ['Units', 'Ems', 'Config', 'PowerLimitGroups'], 'Ems'));
registerList(powerLimitGroupList('MainPowerLimitGroups', ['Units', 'Main', 'Config', 'PowerLimitGroups'], 'Main'));

registerList({
  key: 'MainBatteryInverter',
  path: ['Units', 'Main', 'Equipment', 'BatteryInverter'],
  items: [{
    component: components.BatteryInverter,
    deletable: (count) => count > cardinality.main.batteryInverterMin,
    title: (i) => `${i?.Type ?? 'Unkown Smartmeter Type'} (${i?.Name ?? ''})`
  }],
  addComponentKey: 'BatteryInverter',
  // BatteryCount und InverterCount spiegeln in diesem Config-Format beide
  // dieselbe Listenlänge (kein Fehler, siehe forms/MainSection.tsx vor dieser
  // Generalisierung - dort wurden beide bereits identisch aus derselben Länge
  // gesetzt).
  countFields: [['Units', 'Main', 'Config', 'BatteryCount'], ['Units', 'Main', 'Config', 'InverterCount']],
  indexField: 'Index'
});
