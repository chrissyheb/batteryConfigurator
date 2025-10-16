import { v4 as uuid } from 'uuid';
import { z, ZodIssue, ZodObject } from 'zod';
import { IndexStringType, ui, enums, components, emsComponentTypes, mainComponentTypes } from './catalog';
import { applyCrossRules, applyCardinality } from './rules';
import { TupleToRecord } from '@/utils/helper';
import { ZodIPv4 } from 'zod/v4';

export type EmsHardwareKey = keyof typeof enums.ems.smartmeterHardwareToTypes;
export type MainHardwareKey = keyof typeof enums.main.smartmeterHardwareToTypes;

export type PathType = Array<string|number>;

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


export const getEmsSmartmeterUseCaseTypes =(): IndexStringType[] =>
{
  return enums.ems.smartmeterUseCaseTypes;
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
            message: 'Invalid selection',
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

    case 'bool':
    {
      return z.boolean();
    }

    case 'ipv4':
    {
      const Octet = String.raw`(?:0|[1-9]\d?|1\d\d|2[0-4]\d|25[0-5])`;
      const OctetNoZero = String.raw`(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-5])`;
      const IPv4_RE = new RegExp(`^${OctetNoZero}(?:\\.${Octet}){2}\\.${OctetNoZero}$`);
      //return z.string().ip();
      return z.string().trim().regex(IPv4_RE, 'Invalid IPv4');
    }

    case 'number':
    {
      // Strings wie "12.3" -> Zahl; entferne .coerce, falls du reine Zahlen erwartest
      let s = z.number().finite();

      if (f?.int) s = s.int();  // ganzzahlig
      if (typeof f?.min === 'number') s = s.min(f.min);
      if (typeof f?.max === 'number') s = s.max(f.max);
      if (typeof f?.int === 'boolean' && f.int === true) { s = s.int(); }

      return s;
    }

    case 'numberWithUnit':
    {
      // input should be "12.3 m/s", "12.3m/s", "1m/s"
      // Escape unit for regex (e.g. "%", "m/s", "°C")
      const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const unit = String(f.unit ?? "");
      const u = escapeRe(unit);

      // Number: ±, integer or decimal (with/without leading 0: ".5")
      const NUM = String.raw`[+-]?(?:\d+(?:\.\d+)?|\.\d+)`;

      // Capture-Gruppe für die Zahl, optionaler Space/Tab/NBSP vor der Einheit
      const REwantedUnit = new RegExp(`^(${NUM})[ \\t\\u00A0]*${u}$`);
      const REfoundUnit = new RegExp(`^(${NUM})[ \\t\\u00A0]*(.*)$`);

      // prüfen, ob die Zahl mit der gewünschten Einheit endet
      const toNumber = z.string().trim().transform((s, ctx) => {
        const good = s.match(REwantedUnit);
        if (good) { return Number(good[1]); }

        const bad = s.match(REfoundUnit);
        const foundUnit = bad ? bad[2] : '';
        ctx.addIssue({
          code: 'custom',
          message: 
            foundUnit
              ? `Wrong unit: found ${foundUnit} - expected ${unit}`
              : `No unit - expected ${unit}`
        });
        return z.NEVER;
      })

      let num = z.number().finite();
      if (typeof f?.min === 'number') { num = num.min(f.min); }
      if (typeof f?.max === 'number') { num = num.max(f.max); }
      if (typeof f?.int === 'boolean' && f.int === true) { num = num.int(); }
      
      // 3) Einmalig pipen: String -> number
      return toNumber.pipe(num);
    }

    default:
    {
      return z.string().min(1);
    }
  }
}


function groupSchema(g: any): z.ZodTypeAny
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
  return z.object(shape).strict();
}


const smartmeterZ = groupSchema(components.Smartmeter.fields);
const slaveLocalZ = groupSchema(components.SlaveLocalUM.fields);
const slaveRemoteZ = groupSchema(components.SlaveRemoteUM.fields);
const smartmeterMainZ = groupSchema(components.SmartmeterMain.fields);
const batteryInverterZ = groupSchema(components.BatteryInverter.fields);
const systemZ = groupSchema(components.System.fields);
const emsConfigZ = groupSchema(components.EmsConfig.fields);
const mainConfigZ = groupSchema(components.MainConfig.fields,);


const configZ = z.object({
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
        SlaveLocalUM: z.array(slaveLocalZ).min(1, 'SlaveLocalUM required'),
        SlaveRemoteUM: z.array(slaveRemoteZ),
        //LocalRemoteUnits: z.array(z.union([slaveLocalZ, slaveRemoteZ]))
      }).strict(),
      Config: emsConfigZ,
    }).strict(),
    Main: z.object({
      Type: z.enum(enums.main.types),
      Equipment: z.object({
        SmartmeterMain: smartmeterMainZ,
        BatteryInverter: z.array(batteryInverterZ).min(1, 'BatteryInverter required'),
      }).strict(),
      //Equipment: z.array(z.union([smartmeterMainZ, batteryInverterZ])).min(1),
      Config: mainConfigZ,
    }).strict()
  }).strict()
}).strict();

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
  const emsEqSmartmeter:any[] = [];
    emsEqSmartmeter.push(createByKey('Smartmeter',{n:1}));
  const emsEqSlaveLocalUM:any[] = [];
    emsEqSlaveLocalUM.push(createByKey('SlaveLocalUM',{n:1}));
  const emsEqSlaveRemoteUM:any[] = [];
  const emsConfig:any = createByKey('EmsConfig',{n:1});
  const mainEqSmartmeter:any = createByKey('SmartmeterMain',{n:1});
  const mainEqBatteryInverter:any[] = [];
    mainEqBatteryInverter.push(createByKey('BatteryInverter',{n:1}));
  const mainConfig:any = createByKey('MainConfig',{n:1});
  const initialConfig = {
    Global: globalEq, 
    System: systemEq,
    Units: { 
      Ems:{ 
        Equipment: { 
          Smartmeter: emsEqSmartmeter,
          SlaveLocalUM: emsEqSlaveLocalUM,
          SlaveRemoteUM: emsEqSlaveRemoteUM
        },
        Config: emsConfig
      }, 
      Main: { 
        Type:'Terra',
        Equipment: {
          SmartmeterMain: mainEqSmartmeter,
          BatteryInverter: mainEqBatteryInverter
        },
        Config: mainConfig
      }
    } 
  };
  console.log(initialConfig);
  return initialConfig;
}
