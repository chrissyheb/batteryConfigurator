import { v4 as uuid } from 'uuid';
import { z, ZodIssue } from 'zod';
import { IndexStringType, ui, enums, components, emsComponentTypes, mainComponentTypes } from './catalog';
import { applyCrossRules, applyCardinality } from './rules';
import { TupleToRecord } from '@/utils/helper';

export type EmsHardwareKey = keyof typeof enums.ems.smartmeterHardwareToTypes;
export type MainHardwareKey = keyof typeof enums.main.smartmeterHardwareToTypes;

export const getLibraryVersion = (): readonly string[] =>
{
  return enums.global.libVersion;
};
export const getHardwareVariants = (): readonly string[] =>
{
  return enums.global.hardwareVariant;
};

export type componentType = keyof typeof components;
export type emsComponentType = keyof typeof emsComponentTypes;
export type emsEquipmentLists = TupleToRecord<typeof emsComponentTypes, any[]>;
export type emsEquipmentKeys = keyof emsEquipmentLists;
export type mainComponentType = typeof mainComponentTypes;
export type mainEquipmentLists = TupleToRecord<typeof mainComponentTypes, any[]>;
export type mainEquipmentKeys = keyof mainEquipmentLists;

export const getEmsComponents = (): readonly string[] => 
{ 
  return emsComponentTypes;
};

export const getBatteryBalancingModes = (): IndexStringType[] =>
{
  return enums.system.batteryBalancingModes;
}
export const getExternalControlOperationModes = (): IndexStringType[] =>
{
  return enums.system.externalControlOperationModes;
}

export const getMainComponents = (): readonly string[] => 
{ 
  return mainComponentTypes;
};

export const getEmsSmartmeterHardwares = (): EmsHardwareKey[] =>
{
  return Object.keys(enums.ems.smartmeterHardwareToTypes) as EmsHardwareKey[];
};
export const getEmsSmartmeterModels = (hw: string): string[] =>
{
  const map = enums.ems.smartmeterHardwareToTypes as Record<string, readonly string[]>;
  const list = map[hw];
  if (Array.isArray(list))
  {
    return [ ...list ];
  }
  return [];
};


export const getMainSmartmeterHardwares = (): MainHardwareKey[] =>
{
  return Object.keys(enums.main.smartmeterHardwareToTypes) as MainHardwareKey[];
};
export const getMainSmartmeterModels = (hw: string): string[] =>
{
  const map = enums.main.smartmeterHardwareToTypes as Record<string, readonly string[]>;
  const list = map[hw];
  if (Array.isArray(list))
  {
    return [ ...list ];
  }
  return [];
};


export const getEmsSmartmeterUseCaseTypes = (): readonly string[] =>
{
  return enums.ems.smartmeterUseCaseTypes ?? [];
};


export const getMainTypes = (): readonly string[] =>
{
  return enums.main.types;
};

export const getInverterTypes = (): readonly string[] =>
{
  return enums.batteryInverter.inverterTypes;
};
export const getInverterHardwareTypes = (): readonly string[] =>
{
  return enums.inverterHardwareTypes;
};


export const getBatteryTypes = (): readonly string[] =>
{
  return enums.batteryInverter.batteryTypes;
};
export const getBatteryHardwareTypes = (): readonly string[] =>
{
  return enums.batteryHardwareTypes;
};


export const getModbusTypes = (): readonly string[] =>
{
  return enums.batteryInverter.modbusTypes;
};


export const getUiMeta = () => 
{
  return ui;
};



// Defaults Resolver
type CreateCtx = { n: number };

function isPlainObject(v: unknown): v is Record<string, unknown> { return typeof v==='object' && v!==null && !Array.isArray(v); }

function resolveScalars(key: string, value: unknown, draft: Record<string, unknown>, ctx: CreateCtx, componentKey: componentType): unknown
{
  if (typeof value === 'string')
  {
    if (value === '@uuid') { return uuid(); }
    if (value.includes('${n}')) { return value.replaceAll('${n}', String(ctx.n)); }
    if (value.startsWith('@firstModelOf('))
    {
      const inside = value.slice('@firstModelOf('.length, -1).trim();
      if (componentKey === 'Smartmeter' && inside === 'HardwareType')
      {
        const hw = String(draft['HardwareType'] ?? '');
        const list = (enums.ems.smartmeterHardwareToTypes as Record<string, readonly string[]>)[hw] ?? [];
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
    else { out[k] = resolveScalars(k, v, out, ctx, componentKey); }
  }
  return out;
}

export function createByKey(componentKey: componentType, ctx: CreateCtx): any
{
  const spec = components[componentKey] as any;
  if (!spec?.defaults) { throw new Error(`No defaults for component ${String(componentKey)}`); }
  return deepResolveDefaults(spec.defaults as Record<string, unknown>, ctx, componentKey);
}

export function nextIndexForType(list: any[], type: string): number 
{ 
  return list.length + 1;
  //return list.filter((e) => e?.Type === type).length + 1; 
}



// Zod schema & validate
function fieldSchema(f: any): z.ZodTypeAny
{
  if (f?.const) 
  {
    return z.literal(f.const); 
  }
  if (f?.enum) 
  { 
    const obj = (enums as any)[f.enum];
    return z.enum(obj as [string, ...string[]]); 
  }
  if (f?.enumRef)
  {
    const [domain, key] = f.enumRef as [string, string];
    const obj = (enums as any)[domain][key];
    const flat = Array.isArray(obj) ? obj : Object.keys(obj);
    switch (f?.type)
    {
      case 'indexString':
      {
        const allowed = new Set(flat.map(t => JSON.stringify(t)));
        return z.tuple([z.number(), z.string()])
          .refine((t) => {
            return allowed.has(JSON.stringify(t));
          }, {
            message: 'Ungültige Auswahl (nicht in der Optionsliste)',
          });
      }
      default:
      {
        return z.enum(flat as [string, ...string[]]);
      }
    }
  }
  switch (f?.type)
  {
    case 'uuid':
    {
      return z.string().uuid();
    }

    case 'ipv4':
    {
      const OCTET = String.raw`(?:0|[1-9]\d?|1\d\d|2[0-4]\d|25[0-5])`;
      const IPv4_RE = new RegExp(`^${OCTET}(?:\\.${OCTET}){3}$`);
      return z.string().trim().regex(IPv4_RE, 'Invalid IPv4');
    }

    case 'number':
    {
      // Strings wie "12.3" -> Zahl; entferne .coerce, falls du reine Zahlen erwartest
      let s = z.number().finite();

      if (f?.int) s = s.int();  // ganzzahlig
      if (typeof f?.min === 'number') s = s.min(f.min);
      if (typeof f?.max === 'number') s = s.max(f.max);
      if (typeof f?.multipleOf === 'number') s = s.multipleOf(f.multipleOf);

      return s;
    }

    case 'numberWithUnit':
    {
      // Escape unit for regex (e.g. "%", "m/s", "°C")
      const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const unit = String(f.unit ?? "");
      const u = escapeRe(unit);

      // Number: ±, integer or decimal (with/without leading 0: ".5")
      const NUM = String.raw`[+-]?(?:\d+(?:\.\d+)?|\.\d+)`;

      // Capture-Gruppe für die Zahl, optionaler Space/Tab/NBSP vor der Einheit
      const RE = new RegExp(`^(${NUM})[ \\t\\u00A0]*${u}$`);

      let s = z.string().trim().regex(RE, `Invalid value for unit ${unit}`);

      // Optionale min/max-Validierung am numerischen Wert
      if (typeof f.min === 'number' || typeof f.max === 'number') {
        return s.refine((v) => {
          const m = v.match(RE);
          if (!m) return false;
          const n = parseFloat(m[1]); // numerischer Teil
          if (Number.isNaN(n)) return false;
          if (typeof f.min === 'number' && n < f.min) return false;
          if (typeof f.max === 'number' && n > f.max) return false;
          return true;
        }, 'Wert außerhalb des zulässigen Bereichs');
      }
      return s;
    }

    case 'integer-string':
    {
      let s = z.string().regex(/^\d+$/, 'Integer as String');
      if (typeof f.min === 'number' || typeof f.max === 'number')
      {
        return s.refine((v) =>
        {
          const n = Number(v);
          if (typeof f.min === 'number' && n < f.min)
          {
            return false;
          }
          if (typeof f.max === 'number' && n > f.max)
          {
            return false;
          }
          return true;
        }, 'Wert außerhalb des zulässigen Bereichs');
      }
      return s;
    }

    default:
    {
      return z.string();
    }
  }
}


function groupSchema(g: any, domain?: string): z.ZodTypeAny
{
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [k, spec] of Object.entries<any>(g))
  {
    const s: any = spec;
    if (s.group)
    {
      const inner = groupSchema(s.group);
      shape[k] = s.optional ? inner.optional() : inner;
    }
    else
    {
      let zod = fieldSchema(s);

      if (s.optional)
      {
        zod = zod.optional();
      }

      shape[k] = zod;
    }
  }
  return z.object(shape);
}

const smartmeterZ = groupSchema(components.Smartmeter.fields,'Ems.Smartmeter');
const slaveLocalZ = groupSchema(components.SlaveLocalUM.fields,'Ems.SlaveLocalUM');
const slaveRemoteZ = groupSchema(components.SlaveRemoteUM.fields,'Ems.SlaveRemoteUM');
const smartmeterMainZ = groupSchema(components.SmartmeterMain.fields,'Main.SmartmeterMain');
const batteryInverterZ = groupSchema(components.BatteryInverter.fields,'Main.BatteryInverter');
const systemZ = groupSchema(components.System.fields,'System');
const emsConfigZ = groupSchema(components.EmsConfig.fields,'Ems.Config');
//const mainConfigZ = groupSchema(components.MainConfig.fields,'Ems.Config');

const configZ = z.object({
  Global: z.object({
    Customer: z.string().min(1, 'Customer required'),
    ModularPlc: z.object({
      Version: z.string().min(1, 'Version required'),
      HardwareVariant: z.string().min(1, 'HardwareVariant required')
    })
  }),
  System: systemZ,
  Units: z.object({
    Ems: z.object({
      Equipment: z.object({
        Smartmeter: z.array(smartmeterZ),
        LocalRemoteSystems: z.array(z.union([slaveLocalZ, slaveRemoteZ])).min(1)
      }),
      Config: emsConfigZ,
    }),
    Main: z.object({
      Type: z.enum(enums.main.types),
      Equipment: z.array(z.union([smartmeterMainZ, batteryInverterZ])).min(1)
    })
  })
});

export function validate(cfg: any): { issues: ZodIssue[] }
{
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

export function getInitialConfig(): any
{
  const globalEq:any = createByKey('Global',{n:1});
  const systemEq:any = createByKey('System',{n:1});

//  const emsEq:any[] = []; 
//    emsEq.push(createByKey('Smartmeter',{n:1})); 
//    emsEq.push(createByKey('SlaveLocalUM',{n:1}));
  const mainEq:any[] = []; 
    mainEq.push(createByKey('SmartmeterMain',{n:1}));
    mainEq.push(createByKey('BatteryInverter',{n:1}));
  const emsEqSmartmeter:any[] = [];
    emsEqSmartmeter.push(createByKey('Smartmeter',{n:1}));
  const emsEqSlaveLocalUM:any[] = [];
    emsEqSlaveLocalUM.push(createByKey('SlaveLocalUM',{n:1}));
  const emsEqSlaveRemoteUM:any[] = [];
  const initialConfig = {
    Global: globalEq, 
    System: systemEq,
    Units: { 
      Ems:{ Equipment: { Smartmeter: emsEqSmartmeter, SlaveLocalUM: emsEqSlaveLocalUM, SlaveRemoteUM: emsEqSlaveRemoteUM} }, 
      Main: { Type:'Terra', Equipment: mainEq }
    } 
  };
  return initialConfig;
}
