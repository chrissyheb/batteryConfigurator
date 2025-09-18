
import { z } from 'zod'

export const guidZ = z.string().uuid()
const portZ = z.string().regex(/^\d+$/, 'Port muss Integer-String sein').refine(v => {
  const n = Number(v); return n >= 1 && n <= 65535
}, 'Port 1..65535')

export const smartmeterEMSZ = z.object({
  Name: z.string().min(1, 'Name erforderlich'),
  Displayname: z.string().min(1, 'Displayname erforderlich'),
  Type: z.literal('Smartmeter'),
  Hardware: z.enum(['CarloGavazzi','Phoenix','Janitza','Beckhoff','Virtual']),
  Guid: guidZ,
  Config: z.object({
    Usecase: z.enum(['Undefined','GridConnectionPointControl']),
    Port: portZ
  })
})

export const slaveLocalZ = z.object({
  Name: z.string().min(1, 'Name erforderlich'),
  Displayname: z.string().min(1, 'Displayname erforderlich'),
  Type: z.literal('SlaveLocalUM'),
  Guid: guidZ
})

export const slaveRemoteZ = z.object({
  Name: z.string().min(1, 'Name erforderlich'),
  Displayname: z.string().min(1, 'Displayname erforderlich'),
  Type: z.literal('SlaveRemoteUM'),
  Guid: guidZ,
  Ip: z.string().regex(/^(?:\d{1,3}\.){3}\d{1,3}$/, 'Ungültige IPv4')
})

export const smartmeterMainZ = z.object({
  Name: z.string().min(1, 'Name erforderlich'),
  Displayname: z.string().min(1, 'Displayname erforderlich'),
  Type: z.literal('SmartmeterMain'),
  Hardware: z.enum(['Virtual','Beckhoff']),
  Guid: guidZ
})

export const inverterZ = z.object({
  Name: z.string().min(1, 'Name erforderlich'),
  Type: z.enum(['TerraInverter','InverterKaco']),
  Guid: guidZ,
  Config: z.object({
    InverterType: z.enum(['Kaco','SofarTerra']),
    NominalInverterPower: z.string().regex(/^\d+$/, 'Integer als String')
  })
})

export const batteryZ = z.object({
  Name: z.string().min(1, 'Name erforderlich'),
  Type: z.enum(['TerraBattery','BatteryPylontechM1xBms']),
  Guid: guidZ,
  Config: z.object({
    BatteryType: z.enum(['PylontechM1C','SofarTerra']),
    BatteryCabinetCount: z.string().regex(/^\d+$/, 'Integer als String'),
    BatteryCabinetModuleCount: z.string().regex(/^\d+$/, 'Integer als String')
  })
})

export const modbusZ = z.object({
  Name: z.string().min(1, 'Name erforderlich'),
  Type: z.literal('TerraModbus'),
  Guid: guidZ
})

export const batteryInverterZ = z.object({
  Name: z.string().min(1, 'Name erforderlich'),
  Type: z.literal('BatteryInverter'),
  Inverter: inverterZ,
  Battery: batteryZ,
  Modbus: modbusZ.optional()
})

export const configZ = z.object({
  Customer: z.string().min(1, 'Customer erforderlich'),
  ModularPlc: z.object({ Version: z.string().min(1, 'Version erforderlich'), Hardwarevariante: z.string().min(1, 'Hardwarevariante erforderlich') }),
  Units: z.object({
    Ems: z.object({
      Equipment: z.array(z.union([smartmeterEMSZ, slaveLocalZ, slaveRemoteZ])).min(1)
    }),
    Main: z.object({
      Type: z.enum(['Terra','Blokk']),
      Equipment: z.array(z.union([smartmeterMainZ, batteryInverterZ])).min(1)
    })
  })
}).superRefine((cfg, ctx) => {
  const ems = cfg.Units.Ems.Equipment
  const smCount = ems.filter(e => e.Type === 'Smartmeter').length
  const localCount = ems.filter(e => e.Type === 'SlaveLocalUM').length
  const remoteCount = ems.filter(e => e.Type === 'SlaveRemoteUM').length
  if (localCount !== 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'SlaveLocalUM muss genau einmal vorhanden sein', path: ['Units','Ems','Equipment'] })
  if (smCount > 10) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Smartmeter max. 10', path: ['Units','Ems','Equipment'] })
  if (remoteCount > 9) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'SlaveRemoteUM max. 9', path: ['Units','Ems','Equipment'] })

  const main = cfg.Units.Main
  const smMain = main.Equipment.filter(e => e.Type === 'SmartmeterMain')
  if (smMain.length !== 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'SmartmeterMain muss genau einmal vorhanden sein', path: ['Units','Main','Equipment'] })
  const biList = main.Equipment.filter(e => e.Type === 'BatteryInverter') as any[]
  if (biList.length < 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mindestens ein BatteryInverter erforderlich', path: ['Units','Main','Equipment'] })

  const hv = cfg.ModularPlc.Hardwarevariante
  const isTerraHV = /terra/i.test(hv)
  const expectedMainType = isTerraHV ? 'Terra' : 'Blokk'
  if (main.Type !== expectedMainType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Main.Type muss ${expectedMainType} sein (wegen Hardwarevariante=${hv})`, path: ['Units','Main','Type'] })

  biList.forEach((bi, idx) => {
    const inv = bi.Inverter?.Type
    const bat = bi.Battery?.Type
    const hasModbus = !!bi.Modbus

    if (inv === 'TerraInverter') {
      if (bat !== 'TerraBattery') ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bei TerraInverter ist TerraBattery Pflicht', path: ['Units','Main','Equipment', idx, 'Battery','Type'] })
      if (!hasModbus) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bei TerraInverter ist Modbus Pflicht', path: ['Units','Main','Equipment', idx, 'Modbus'] })
    } else {
      if (bat === 'TerraBattery') ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'TerraBattery verboten wenn Inverter ≠ TerraInverter', path: ['Units','Main','Equipment', idx, 'Battery','Type'] })
      if (hasModbus && bi.Modbus?.Type === 'TerraModbus') ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'TerraModbus verboten wenn Inverter ≠ TerraInverter', path: ['Units','Main','Equipment', idx, 'Modbus'] })
    }

    if (isTerraHV) {
      if (inv !== 'TerraInverter') ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'HV=Terra ⇒ Inverter=TerraInverter', path: ['Units','Main','Equipment', idx, 'Inverter','Type'] })
      if (bat !== 'TerraBattery') ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'HV=Terra ⇒ Battery=TerraBattery', path: ['Units','Main','Equipment', idx, 'Battery','Type'] })
      if (!hasModbus) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'HV=Terra ⇒ Modbus erforderlich', path: ['Units','Main','Equipment', idx, 'Modbus'] })
    } else {
      if (inv === 'TerraInverter') ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'HV≠Terra ⇒ kein TerraInverter', path: ['Units','Main','Equipment', idx, 'Inverter','Type'] })
      if (bat === 'TerraBattery') ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'HV≠Terra ⇒ keine TerraBattery', path: ['Units','Main','Equipment', idx, 'Battery','Type'] })
      if (hasModbus) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'HV≠Terra ⇒ kein Modbus', path: ['Units','Main','Equipment', idx, 'Modbus'] })
    }
  })
})
