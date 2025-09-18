
import { z, ZodIssue } from 'zod'
import { ui, enums, components } from './catalog'
import { applyCrossRules, applyCardinality } from './rules'

export const getEmsSmartmeterHardwares = () => Object.keys(enums.ems.smartmeterHardwareToTypes)
export const getEmsSmartmeterTypes = (hw: string) => enums.ems.smartmeterHardwareToTypes[hw] ?? []
export const getMainSMHardwares = () => Object.keys(enums.main.smartmeterMainHardwareToTypes)
export const getMainSMTypes = (hw: string) => enums.main.smartmeterMainHardwareToTypes[hw] ?? []
export const getInverterTypes = () => enums.batteryInverter.inverterTypes
export const getBatteryTypes = () => enums.batteryInverter.batteryTypes
export const getModbusTypes = () => enums.batteryInverter.modbusTypes
export const getUiMeta = () => ui

function fieldSchema(f: any): z.ZodTypeAny {
  if (f?.const) return z.literal(f.const)
  if (f?.enum) return z.enum(f.enum as [string, ...string[]])
  if (f?.enumRef) {
    const [domain, key] = f.enumRef as [string, string]
    const obj = (enums as any)[domain][key]
    const flat = Array.isArray(obj) ? obj : Object.keys(obj)
    return z.enum(flat as [string, ...string[]])
  }
  switch (f?.type) {
    case 'uuid': return z.string().uuid()
    case 'ipv4': return z.string().regex(/^(?:\d{1,3}\.){3}\d{1,3}$/, 'Ungültige IPv4')
    case 'integer-string': {
      let s = z.string().regex(/^\d+$/, 'Integer als String')
      if (typeof f.min === 'number' || typeof f.max === 'number') {
        s = s.refine(v => {
          const n = Number(v)
          if (typeof f.min === 'number' && n < f.min) return false
          if (typeof f.max === 'number' && n > f.max) return false
          return true
        }, 'Wert außerhalb des zulässigen Bereichs')
      }
      return s
    }
    default: return z.string()
  }
}

function groupSchema(g: any): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const [k, spec] of Object.entries<any>(g)) {
    if ((spec as any).group) {
      const inner = groupSchema((spec as any).group)
      shape[k] = (spec as any).optional ? inner.optional() : inner
    } else {
      let s = fieldSchema(spec)
      if ((spec as any).optional) s = s.optional()
      shape[k] = s
    }
  }
  return z.object(shape)
}

const smartmeterZ = groupSchema(components.Smartmeter.fields)
const slaveLocalZ = groupSchema(components.SlaveLocalUM.fields)
const slaveRemoteZ = groupSchema(components.SlaveRemoteUM.fields)
const smartmeterMainZ = groupSchema(components.SmartmeterMain.fields)
const batteryInverterZ = groupSchema(components.BatteryInverter.fields)

const configZ = z.object({
  Customer: z.string().min(1, 'Customer erforderlich'),
  ModularPlc: z.object({
    Version: z.string().min(1, 'Version erforderlich'),
    Hardwarevariante: z.string().min(1, 'Hardwarevariante erforderlich'),
  }),
  Units: z.object({
    Ems: z.object({ Equipment: z.array(z.union([smartmeterZ, slaveLocalZ, slaveRemoteZ])).min(1) }),
    Main: z.object({ Type: z.enum(['Terra','Blokk']), Equipment: z.array(z.union([smartmeterMainZ, batteryInverterZ])).min(1) })
  })
})

export function validate(cfg: any): { issues: ZodIssue[] } {
  const r = configZ.safeParse(cfg)
  const issues: ZodIssue[] = r.success ? [] : r.error.issues
  const push = (i: any) => issues.push({ code: 'custom', message: i.message, path: i.path } as any)
  applyCardinality(cfg, push)
  applyCrossRules(cfg, push)
  return { issues }
}
