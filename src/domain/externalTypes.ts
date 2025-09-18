
export type TEquipmentCommon = { Name: string; Displayname?: string; Type: string; Guid?: string }
export type TSmartmeterEMS = TEquipmentCommon & { Type: 'Smartmeter'; Hardware: 'CarloGavazzi' | 'Phoenix' | 'Janitza' | 'Beckhoff' | 'Virtual'; Config: { Usecase: 'GridConnectionPointControl' | 'Undefined'; Port: string } }
export type TSlaveLocalUM = TEquipmentCommon & { Type: 'SlaveLocalUM' }
export type TSlaveRemoteUM = TEquipmentCommon & { Type: 'SlaveRemoteUM'; Ip: string }
export type TSmartmeterMain = TEquipmentCommon & { Type: 'SmartmeterMain'; Hardware: 'Virtual' | 'Beckhoff' }
export type TInverter = { Name: string; Type: 'TerraInverter' | 'InverterKaco'; Guid: string; Config: { InverterType: 'SofarTerra' | 'Kaco'; NominalInverterPower: string } }
export type TBattery = { Name: string; Type: 'TerraBattery' | 'BatteryPylontechM1xBms'; Guid: string; Config: { BatteryType: 'SofarTerra' | 'PylontechM1C'; BatteryCabinetCount: string; BatteryCabinetModuleCount: string } }
export type TModbus = { Name: string; Type: 'TerraModbus'; Guid: string }
export type TBatteryInverter = { Name: string; Type: 'BatteryInverter'; Inverter: TInverter; Battery: TBattery; Modbus?: TModbus }
export type TEmsUnit = { Equipment: (TSmartmeterEMS | TSlaveLocalUM | TSlaveRemoteUM)[] }
export type TMainUnit = { Type: 'Terra' | 'Blokk'; Equipment: (TSmartmeterMain | TBatteryInverter)[] }
export type TConfig = { Customer: string; ModularPlc: { Version: string; Hardwarevariante: string }; Units: { Ems: TEmsUnit; Main: TMainUnit } }
