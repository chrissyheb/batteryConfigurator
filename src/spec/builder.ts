import { v4 as uuid } from 'uuid';
import { z, ZodIssue } from 'zod';
import {
  components,
  emsComponentTypes, emsConfigTypes, mainComponentTypes, mainConfigTypes
} from '@/registry';
import { groupSchema, isZodObject } from '@/core/schema-builder';
import { getVersionContext, type VersionContext } from '@/core/versioning';
import { applyCrossRules, applyCardinality, cardinality } from './rules';
import { getList } from '@/registry/lists';
import { TupleToRecord } from '@/utils/helper';

// Jede Wertliste lebt direkt bei der components/<name>/spec.ts, die sie
// definiert (kein zentrales spec/enums.ts mehr) - Erweiterung/Änderung
// betrifft damit nur noch eine einzige Datei.
import { libVersion, hardwareVariants } from '@/components/global/spec';
import { smartmeterHardwareToTypes as emsSmartmeterHardwareToTypes } from '@/components/smartmeter-ems/spec';
import { mainTypes } from '@/components/main-config/spec';

export type PathType = Array<string | number>;

export const getLibraryVersion = (): readonly string[] =>
{
  return libVersion;
};
export const getHardwareVariants = (): readonly string[] =>
{
  return hardwareVariants;
};

export type componentType = keyof typeof components;
export type emsComponentType = keyof typeof emsComponentTypes;
export type emsEquipmentLists = TupleToRecord<typeof emsComponentTypes, any[]>;
export type emsEquipmentKeys = keyof emsEquipmentLists;
export type emsConfigType = keyof typeof emsConfigTypes;
export type emsConfigLists = TupleToRecord<typeof emsConfigTypes, any[]>;
export type emsConfigKeys = keyof emsConfigLists;
export type mainComponentType = typeof mainComponentTypes;
export type mainEquipmentLists = TupleToRecord<typeof mainComponentTypes, any[]>;
export type mainEquipmentKeys = keyof mainEquipmentLists;
export type mainConfigType = keyof typeof mainConfigTypes;
export type mainConfigLists = TupleToRecord<typeof mainConfigTypes, any[]>;
export type mainConfigKeys = keyof mainConfigLists;

// Defaults Resolver
type CreateCtx = { n: number };

function isPlainObject(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null && !Array.isArray(v); }

function resolveScalars(value: unknown, draft: Record<string, unknown>, ctx: CreateCtx, componentKey: componentType): unknown
{
  if (typeof value === 'string')
  {
    if (value === '@uuid') { return uuid(); }
    if (value.includes('${n0}')) { return value.replaceAll('${n0}', String(ctx.n - 1)); } // start with index 0
    if (value.includes('${n}')) { return value.replaceAll('${n}', String(ctx.n)); } // start with index 1
    if (value.startsWith('@firstModelOf('))
    {
      const inside = value.slice('@firstModelOf('.length, -1).trim();
      if (componentKey === 'Smartmeter' && inside === 'HardwareType')
      {
        const hw = String(draft['HardwareType'] ?? '');
        const list = (emsSmartmeterHardwareToTypes as Record<string, readonly string[]>)[hw] ?? [];
        return Array.isArray(list) && list.length > 0 ? list[0] : '';
      }
    }
    return value;
  }
  return value;
}

function deepResolveDefaults(defs: Record<string, unknown>, ctx: CreateCtx, componentKey: componentType): any
{
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(defs))
  {
    const v = (defs as any)[k];
    if (isPlainObject(v)) { out[k] = deepResolveDefaults(v as Record<string, unknown>, ctx, componentKey); }
    else { out[k] = resolveScalars(v, out, ctx, componentKey); }
  }
  return out;
}

export function createByKey(componentKey: componentType, ctx: CreateCtx): any
{
  const spec = components[componentKey] as any;
  if (!spec?.defaults) { throw new Error(`No defaults for component ${String(componentKey)}`); }
  return deepResolveDefaults(spec.defaults as Record<string, unknown>, ctx, componentKey);
}

// Zod schema & validate
// Das Schema wird pro validate()-Aufruf frisch aus der Registry gebaut, weil
// die Verfügbarkeit einzelner Felder/Komponenten (core/versioning.ts) vom
// aktuell gewählten Global.ModularPlc.Version/HardwareVariant abhängt.
function buildConfigSchema(ctx: VersionContext, cfg: any): z.ZodTypeAny
{
  const smartmeterZ = groupSchema(components.Smartmeter.fields, ctx, cfg);
  const slaveLocalZ = groupSchema(components.SlaveLocalUM.fields, ctx, cfg);
  const slaveRemoteZ = groupSchema(components.SlaveRemoteUM.fields, ctx, cfg);
  const smartmeterMainZ = groupSchema(components.SmartmeterMain.fields, ctx, cfg);
  const batteryInverterZ = groupSchema(components.BatteryInverter.fields, ctx, cfg);
  const systemZ = groupSchema(components.System.fields, ctx, cfg);
  const configPowerLimitZ = groupSchema(components.PowerLimitGroup.fields, ctx, cfg);

  // Max-Werte kommen aus registry/lists.ts (dieselbe Zahl, die auch den
  // Add-Button in <GeneratedList> ausblendet) statt hier ein zweites Mal
  // hart hinterlegt zu sein.
  const emsPowerLimitMax = getList('EmsPowerLimitGroups').max ?? 2;
  const mainPowerLimitMax = getList('MainPowerLimitGroups').max ?? 2;

  const emsConfigTmpZ = groupSchema(components.EmsConfig.fields, ctx, cfg);
  const emsConfigZ = (() => {
    if (isZodObject(emsConfigTmpZ)) {
      return emsConfigTmpZ.extend({
        PowerLimitGroups: z.array(configPowerLimitZ).max(emsPowerLimitMax, `PowerLimitGroup max. ${emsPowerLimitMax}`)
      });
    }
    else {
      return emsConfigTmpZ;
    }
  })();

  const mainConfigTmpZ = groupSchema(components.MainConfig.fields, ctx, cfg);
  const mainConfigZ = (() => {
    if (isZodObject(mainConfigTmpZ)) {
      return mainConfigTmpZ.extend({
        PowerLimitGroups: z.array(configPowerLimitZ).max(mainPowerLimitMax, `PowerLimitGroup max. ${mainPowerLimitMax}`)
      });
    }
    else {
      return mainConfigTmpZ;
    }
  })();

  return z.object({
    Global: z.object({
      Customer: z.string().min(1, 'Customer required'),
      ModularPlc: z.object({
        Version: z.string().min(1, 'Version required'),
        HardwareVariant: z.string().min(1, 'HardwareVariant required')
      }).strict()
    }).strict(),
    System: systemZ,
    Units: z.object({
      Ems: z.object({
        Equipment: z.object({
          Smartmeter: z.array(smartmeterZ),
          LocalRemoteSystems: z.array(z.union([slaveLocalZ, slaveRemoteZ])).min(1),
        }).strict(),
        Config: emsConfigZ
      }).strict(),
      Main: z.object({
        Type: z.enum(mainTypes),
        Equipment: z.object({
          SmartmeterMain: smartmeterMainZ,
          BatteryInverter: z.array(batteryInverterZ).min(cardinality.main.batteryInverterMin, 'BatteryInverter required'),
        }).strict(),
        Config: mainConfigZ,
      }).strict()
    }).strict()
  }).strict();
}

export function validate(cfg: any): { issues: ZodIssue[] }
{
  const ctx = getVersionContext(cfg);
  const configZ = buildConfigSchema(ctx, cfg);
  const parsed = configZ.safeParse(cfg);
  const issues: ZodIssue[] = parsed.success ? [] : parsed.error.issues;

  const add = (i: any): void =>
  {
    issues.push({ code: 'custom', message: i.message, path: i.path } as any);
  };
  applyCardinality(cfg, add);
  applyCrossRules(cfg, add);
  return { issues };
}

/**
 * Minimaler Form-Check für von außen kommende Configs (Import, localStorage) -
 * schützt vor einem Absturz in der Cross-Rule-Validierung (spec/rules.ts),
 * falls z.B. eine fremde/beschädigte Datei importiert oder ein alter
 * localStorage-Stand aus einer inkompatiblen Konfigurator-Version geladen
 * wird (dort fehlt teils der schützende Optional-Chain, siehe applyCrossRules).
 * Prüft bewusst nur grob auf die beiden Root-Container, nicht das volle
 * Schema - strukturell unvollständige, aber grundsätzlich unserer Config
 * ähnelnde Objekte sollen weiterhin als normale Validierungsfehler auftauchen
 * (siehe validate()), nicht als Absturz.
 */
export function isPlausibleConfig(cfg: unknown): boolean
{
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) { return false; }
  const c = cfg as Record<string, unknown>;
  return typeof c.Global === 'object' && c.Global !== null && typeof c.Units === 'object' && c.Units !== null;
}

export function getInitialConfig(): any
{
  const globalEq: any = createByKey('Global', { n: 1 });
  const systemEq: any = createByKey('System', { n: 1 });

  const emsEqSmartmeter: any[] = [];
  emsEqSmartmeter.push(createByKey('Smartmeter', { n: 1 }));
  const emsEqLocalRemoteUnits: any[] = [createByKey('SlaveLocalUM', { n: 1 })];
  const emsConfig: any = createByKey('EmsConfig', { n: 1 });
  const mainEqSmartmeter: any = createByKey('SmartmeterMain', { n: 1 });
  const mainEqBatteryInverter: any[] = [];
  mainEqBatteryInverter.push(createByKey('BatteryInverter', { n: 1 }));
  const mainConfig: any = createByKey('MainConfig', { n: 1 });
  const initialConfig = {
    Global: globalEq,
    System: systemEq,
    Units: {
      Ems: {
        Equipment: {
          Smartmeter: emsEqSmartmeter,
          LocalRemoteSystems: emsEqLocalRemoteUnits
        },
        Config: emsConfig
      },
      Main: {
        // Muss immer Global.ModularPlc.HardwareVariant entsprechen (siehe
        // App.tsx, das dies auch bei jeder späteren Änderung nachführt) -
        // hier direkt abgeleitet statt ein zweites Mal unabhängig hartkodiert.
        Type: globalEq.ModularPlc.HardwareVariant,
        Equipment: {
          SmartmeterMain: mainEqSmartmeter,
          BatteryInverter: mainEqBatteryInverter
        },
        Config: mainConfig
      }
    }
  };
  return initialConfig;
}
