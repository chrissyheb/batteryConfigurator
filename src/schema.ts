import { z } from 'zod'

// ---------- helpers ----------
const uuid = z.string().uuid()
const intPos = z.union([z.number().int(), z.string().regex(/^\d+$/)])
  .transform(v => typeof v === 'number' ? v : parseInt(v, 10))
  .refine(v => v >= 0, { message: 'must be >= 0' })

const numPos = z.union([z.number(), z.string().regex(/^\d+(?:[.,]\d+)?$/)])
  .transform(v => typeof v === 'number' ? v : Number(String(v).replace(',', '.')))
  .refine(v => v >= 0, { message: 'must be >= 0' })

// ---------- enums ----------
const ModbusType = z.enum(['TerraModbus'])
const InverterType = z.enum(['TerraInverter', 'InverterKaco'])
const BatteryType = z.enum(['TerraBattery', 'BatteryPylontechM1xBms'])
const InverterVendor = z.enum(['SofarTerra', 'Kaco'])
const BatteryVendor = z.enum(['SofarTerra', 'PylontechM1C'])
const SmartmeterUsecase = z.enum(['GridConnectionPointControl'])
const SmartmeterMainVariant = z.enum(['SmartmeterVirtual', 'EL3443'])

const PlcVersions = z.enum(['0.0.1', '0.0.2', '0.0.3'])
const PlcHardware = z.enum(['BlokkV3', 'Terra'])

// ---------- Smartmeter Hardware (fixe Listen) ----------
const SmartmeterHardware = z.discriminatedUnion('Manufacturer', [
  z.object({ Manufacturer: z.literal('CarloGavazzi'), Type: z.literal('EM24') }),
  z.object({ Manufacturer: z.literal('Phoenix'),       Type: z.literal('EM375') }),
  z.object({ Manufacturer: z.literal('Janitza'),       Type: z.enum(['UMG 96 PA', 'UMG 96 RM', 'UMG 509 Pro']) }),
  z.object({ Manufacturer: z.literal('Beckhoff'),      Type: z.literal('El34x3') }),
])

// ---------- common blocks ----------
const hardwareSchema = z.object({ Manufacturer: z.string().min(1), Type: z.string().min(1) })

const baseEquipment = z.object({
  Name: z.string().min(1),
  Displayname: z.string().min(1).optional(),
  Type: z.string().min(1),
  Hardware: hardwareSchema.optional(),
  Guid: uuid,
})

// ---------- equipment variants ----------
const smartmeterEquipment = baseEquipment.extend({
  Type: z.literal('Smartmeter'),
  Hardware: SmartmeterHardware,
  Config: z.object({
    Usecase: SmartmeterUsecase,
    Port: intPos.refine(p => p > 0 && p <= 65535, { message: 'invalid TCP port' }),
  }),
})

const smartmeterMainEquipment = baseEquipment.extend({
  Type: z.literal('SmartmeterMain'),
  Config: z.object({
    Variant: SmartmeterMainVariant.default('SmartmeterVirtual'),
  }).optional(),
})

const slaveLocalUMEquipment = baseEquipment.extend({
  Type: z.literal('SlaveLocalUM'),
  Config: z.undefined().optional(),
})

const modbusSchema = z.object({
  Name: z.string().min(1),
  Type: ModbusType,
  Guid: uuid,
})

const inverterSchema = z.object({
  Name: z.string().min(1),
  Type: InverterType,
  Guid: uuid,
  Config: z.object({
    InverterType: InverterVendor,
    NominalInverterPower: numPos.refine(w => w > 0 && w <= 125_000, {
      message: 'NominalInverterPower out of expected range',
    }),
  }),
})

const batterySchema = z.object({
  Name: z.string().min(1),
  Type: BatteryType,
  Guid: uuid,
  Config: z.object({
    BatteryType: BatteryVendor,
    BatteryCabinetCount: intPos.refine(n => n >= 1 && n <= 4,  { message: '1..4' }),
    BatteryCabinetModuleCount: intPos.refine(n => n >= 1 && n <= 24, { message: '1..24' }),
  }),
})

const batteryInverterEquipment = baseEquipment.extend({
  Type: z.literal('BatteryInverter'),
  Modbus: z.union([modbusSchema, z.undefined()]).optional(),
  Inverter: inverterSchema,
  Battery: batterySchema,
})

// ---------- union ----------
const equipmentSchemaBase = z.discriminatedUnion('Type', [
  smartmeterEquipment,
  smartmeterMainEquipment,
  slaveLocalUMEquipment,
  batteryInverterEquipment,
])

// ---------- Terra-Regeln (fachlich) ----------
export const equipmentSchema = equipmentSchemaBase.superRefine((val, ctx) => {
  if (val.Type !== 'BatteryInverter') return
  const invType = val.Inverter?.Type
  const batType = val.Battery?.Type
  const hasModbus = !!val.Modbus

  if (invType === 'TerraInverter') {
    if (!val.Battery || batType !== 'TerraBattery') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['Battery','Type'], message: 'TerraInverter erfordert Battery=TerraBattery' })
    }
    if (!hasModbus) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['Modbus'], message: 'TerraInverter erfordert Modbus=TerraModbus' })
    } else if (val.Modbus?.Type !== 'TerraModbus') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['Modbus','Type'], message: 'Modbus.Type muss TerraModbus sein' })
    }
  } else if (invType) {
    if (!val.Battery) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['Battery'], message: 'Bei Nicht-Terra Inverter ist eine Battery erforderlich' })
    }
    if (batType === 'TerraBattery') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['Battery','Type'], message: 'TerraBattery ist bei Nicht-Terra Inverter nicht erlaubt' })
    }
    if (val.Modbus?.Type === 'TerraModbus') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['Modbus','Type'], message: 'TerraModbus ist bei Nicht-Terra Inverter nicht erlaubt' })
    }
  }
})

// ---------- Units / Root ----------
const unitSchema = z.object({
  Type: z.string().min(1).optional(),
  Equipment: z.array(equipmentSchema).min(0),
})

const unitsSchema = z.record(unitSchema)

const modularPlcSchema = z.object({
  Version: PlcVersions.default('0.0.3'),
  Hardwarevariante: PlcHardware.default('Terra'),
})

export const configSchema = z.object({
  Customer: z.string().min(1),
  ModularPlc: modularPlcSchema,
  Units: unitsSchema,
})

export type Config = z.infer<typeof configSchema>
export type Unit = z.infer<typeof unitSchema>
export type Equipment = z.infer<typeof equipmentSchema>
export function parseConfig(json: unknown): Config { return configSchema.parse(json) }
