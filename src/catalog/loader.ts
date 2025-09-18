
// Central loader so options are defined only once.
import data from '@/catalog/catalog.json'

type Catalog = typeof data
export const catalog: Catalog = data

export const EMS_SM_HARDWARES = Object.keys(data.ems.smartmeterHardwareToTypes)
export const EMS_SM_TYPES = (hw: string) => data.ems.smartmeterHardwareToTypes[hw] ?? []

export const MAIN_SM_HARDWARES = Object.keys(data.main.smartmeterMainHardwareToTypes)
export const MAIN_SM_TYPES = (hw: string) => data.main.smartmeterMainHardwareToTypes[hw] ?? []

export const INVERTER_TYPES = data.batteryInverter.inverterTypes
export const BATTERY_TYPES = data.batteryInverter.batteryTypes
export const MODBUS_TYPES = data.batteryInverter.modbusTypes
