
import { z, ZodIssue } from 'zod';
import { ui, enums, components } from './catalog';
import { applyCrossRules, applyCardinality } from './rules';

export type EmsHardwareKey = keyof typeof enums.ems.smartmeterHardwareToTypes;
export type MainHardwareKey = keyof typeof enums.main.smartmeterHardwareToTypes;


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
    return z.enum(flat as [string, ...string[]]);
  }
  switch (f?.type)
  {
    case 'uuid':
    {
      return z.string().uuid();
    }

    case 'ipv4':
    {
      return z.string().regex(/^(?:\d{1,3}\.){3}\d{1,3}$/, 'Invalid IPv4');
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

const configZ = z.object({
  Customer: z.string().min(1, 'Customer required'),
  ModularPlc: z.object({
    Version: z.string().min(1, 'Version required'),
    HardwareVariant: z.string().min(1, 'HardwareVariant required')
  }),
  Units: z.object({
    Ems: z.object({
      Equipment: z.array(z.union([smartmeterZ, slaveLocalZ, slaveRemoteZ])).min(1)
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
