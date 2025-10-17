
export type IntegerString = string;
export type UUID = string;
export type IPv4 = string;

export const ui = { typeFirst: true } as const;

export type IndexStringType = [number, string];

type BaseType<T extends 'number' | 'string' | 'bool' | 'indexString' | 'ipv4' | 'uuid'> = {
  type: T;
  required: boolean;
  hint: string;
  readOnly?: boolean;
};

export type TypeNumberDef = BaseType<'number'>  & { 
  unit?: string, // unit for number
  min?: number, // min limit of value
  max?: number, // max limit of value
  int?: boolean // is value a integer ??
};
export function TypeNumber(
  opts: Omit<TypeNumberDef, 'type'> & {type?: never}
): TypeNumberDef {
  return { type: 'number', ...opts };
};

export type TypeStringDef = BaseType<'string'>  & { 
  enumRef?: [string, string],
  enum?: string,
  plcVariableName?: boolean
};
export function TypeString(
  opts: Omit<TypeStringDef, 'type'> & {type?: never}
): TypeStringDef {
  return { type: 'string', ...opts };
};

export type TypeNumberUnitDef = BaseType<'string'>  & { 
  unit?: string, // unit for number
  min?: number, // min limit of value
  max?: number, // max limit of value
  int?: boolean // is value a integer ??
};
export function TypeNumberUnit(
  opts: Omit<TypeNumberUnitDef, 'type'> & {type?: never}
): TypeNumberUnitDef {
  return { type: 'string', ...opts };
};

export type TypeBoolDef = BaseType<'bool'>;
export function TypeBool(
  opts: Omit<TypeBoolDef, 'type'> & {type?: never}
): TypeBoolDef {
  return { type: 'bool', ...opts };
};

export type TypeIndexStringDef = BaseType<'indexString'>  & { 
  enumRef?: [string, string]
};
export function TypeIndexString(
  opts: Omit<TypeIndexStringDef, 'type'> & {type?: never}
): TypeIndexStringDef {
  return { type: 'indexString', ...opts };
};

export type TypeIPv4Def = BaseType<'ipv4'>;
export function TypeIPv4(
  opts: Omit<TypeIPv4Def, 'type'> & {type?: never}
): TypeIPv4Def {
  return { type: 'ipv4', ...opts };
};

export type TypeUuidDef = BaseType<'uuid'>;
export function TypeUuid(
  opts: Omit<TypeUuidDef, 'type'> & {type?: never}
): TypeUuidDef {
  return { type: 'uuid', ...opts };
};

export type NumberParameters = { type:string , min:number, max:number, int:boolean, required:boolean };

export const enums = {
  global: {
    libVersion: ['0.0.3', '0.0.2', '0.0.1'],
    hardwareVariant: ['Terra', 'BlokkV3']
  },
  system: {
    batteryBalancingModes: [[0, 'None'], [1, 'TotalDisabledConsumptionOptimizationDischarging'], [2, 'TotalChargeFromGrid'], [10, 'RoundRobinCrossCharge'], [11, 'RoundRobinChargeFromGrid']] as IndexStringType[],
    externalControlOperationModes: [[0, 'Standard'], [1, 'OffsetOnStandard'], [2, 'InverterSetpoint'], [3, 'GridSetpoint'], [4, 'GridSetpointReplaceConsumptionOptimization'], [5, 'InverterSetpointReplaceConsumptionOptimization'], [6, 'GRIIDReplaceConsumptionOptimization'], [7, 'FrequencyContainmentReserve'], [99, 'StandBy'], [100, 'Maintenance']] as IndexStringType[]
  },
  ems: {
    smartmeterHardwareToTypes: {
      CarloGavazzi: ['EM24'],
      Phoenix: ['EM375'],
      Janitza: ['UMG 96 PA', 'UMG 96 RM', 'UMG 509 Pro'],
      Beckhoff: ['El34x3'],
      Virtual: ['Virtual']
    },
    smartmeterUseCaseTypes: [[0,'Undefined'], [2,'GridConnectionPointControl']] as IndexStringType[]
  },
  main: {
    smartmeterHardwareToTypes: {
      Virtual: ['Virtual'],
      Beckhoff: ['El34x3']
    },
    types: ['Terra', 'Blokk']
  },
  batteryInverter: {
    inverterTypes: ['TerraInverter', 'InverterKaco'],
    batteryTypes: ['TerraBattery', 'BatteryPylontechM1xBms'],
    modbusTypes: ['(not available)','TerraModbus']
  },
  inverterHardwareTypes: ['SofarTerra', 'Kaco'],
  batteryHardwareTypes: ['SofarTerra', 'PylontechM1C']
} as const;

export const emsComponentTypes = ['Smartmeter', 'SlaveLocalUM', 'SlaveRemoteUM'] as const;

export const mainComponentTypes = ['SmartmeterMain', 'BatteryInverter'] as const;

const cGlobal = {
  fields: {
    Customer: TypeString({ required: true, hint: 'Customer name' }),
    ModularPlc: {
      group: {
        Version: TypeString({ required: true, hint: 'Library version of the Modular PLC', enumRef: ['global', 'libVersion'] }),
        HardwareVariant: TypeString({ required: true, hint: 'Hardware variant of customer project', enumRef: ['global', 'hardwareVariant'] })
      }
    }
  },
  defaults: {
    Customer: '',
    ModularPlc: { 
      Version:'0.0.3',
      HardwareVariant:'Terra' 
    }
  }
}

const cSystem = {
  fields: {
    SerialNumber: TypeString({ required: true, plcVariableName: true, hint: 'Serial number of the BESS system \n TEMSM-001 \n TE0000000047 \n BK0000000246' }),
    BatteryBalancing: {
      group: {
        PreemptiveMode: TypeIndexString({ required: true, hint: 'Balancing mode used for preemptive balancing', enumRef: ['system', 'batteryBalancingModes'] }),
        PreemptiveDaysToEnable: TypeNumber({ required: true, hint: 'Preemptive balancing starts number of days after last successful balancing process.\n >= 0 \n 0: preemptive balancing disabled ', min: 0, max: 365, int: true }),
        PreemptiveMaxGridChargePower: TypeNumberUnit({ required: true, hint: 'Max power sum used for charging from grid during preemptive balancing \n >= 0', min: 0, unit: 'kW' }),
        ForcedDaysToEnable: TypeNumber({ required: true, hint: 'Balancing is forced number of days after last successful balancing process. \n >= 0', min: 0, max: 365, int: true }),
        ForcedMaxGridChargePowerPerInverter: TypeNumberUnit({ required: true, hint: 'Max power per inverter used for charging from grid during forced balancing \n >= 0 \n 0: forced balancing disabled', min: 0, unit: 'kW' }),
      }
    },
    ExternalControl: {
      group: {
        FallbackMode:  TypeIndexString({ required: true, hint: 'Fallback operation mode if connection to external control unit (BEAAM, Master-BESS, external EMS) is lost', enumRef: ['system', 'externalControlOperationModes'] })
      }
    }
  },
  defaults: {
    SerialNumber: 'TE0000000000',
    BatteryBalancing: {
      PreemptiveMode: [ 0, "None"],
      PreemptiveDaysToEnable: 60,
      PreemptiveMaxGridChargePower: "30kW",
      ForcedDaysToEnable: 90,
      ForcedMaxGridChargePowerPerInverter: "5kW"
    },
    ExternalControl: {
      FallbackMode: [ 0, "Standard"]
    }
  }
};

const cEmsConfig = {
  fields: {
    SmartmeterCount: TypeNumber({ required: true, hint: 'Number of used Smartmeters \n - automatically calculated -', min: 0, int: true, readOnly: true }),
    SystemsInParallelCount: TypeNumber({ required: true, hint: 'Number of parallel systems within Main/Support combination \n - automatically calculated -', min: 1, int: true, readOnly: true }),
    GridConnectionPoint: {
      group: {
        PowerGridConsumptionLimit: TypeNumberUnit({ required: true, hint: 'Max. permitted consumption power from grid \n if no limit set to max. fuse power \n >= 0', min: 0, unit: 'kW' }),
        PowerGridFeedInLimit: TypeNumberUnit({ required: true, hint: 'Max. permitted feed in power from grid \n if no limit set to max. fuse power \n >= 0', min: 0, unit: 'kW' }),
        PowerGridConsumptionOffset: TypeNumberUnit({ required: true, hint: 'Control offset for grid connection point', unit: 'kW' }),
      }
    },
    MasterSlave: {
      group: {
        PowerActiveInstalledTotal: TypeNumberUnit({ required: true, hint: 'Sum of installed inverter active power (total Main/Support combination) \n > 0', min: 0, unit: 'kW' }),
        CapacityInstalledTotal: TypeNumberUnit({ required: true, hint: 'Sum of installed battery capacity (total Main/Support combination) \n > 0', min: 0, unit: 'kWh' }),
        PowerChargeLimitTotal: TypeNumberUnit({ required: true, hint: 'Max charge power (or installed active power) of total Main/Support combination \n >= 0', min: 0, unit: 'kW' }),
        PowerDischargeLimitTotal: TypeNumberUnit({ required: true, hint: 'Max discharge power (or installed active power) of total Main/Support combination \n >= 0', min: 0, unit: 'kW' }),
      }
    }
  },
  defaults: {
    SmartmeterCount : 1,
    SystemsInParallelCount : 1,
    GridConnectionPoint: {
      PowerGridConsumptionLimit: "0kW",
      PowerGridFeedInLimit: "0kW",
      PowerGridConsumptionOffset: "0kW"
    },
    MasterSlave: {
      PowerActiveInstalledTotal: "0kW",
      CapacityInstalledTotal: "0kWh",
      PowerChargeLimitTotal: "0kW",
      PowerDischargeLimitTotal: "0kW"
    }
  }
};

const cSmartmeter = {
  fields: {
    Type: { const: 'Smartmeter', required: true },
    Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
    DisplayName: TypeString({ required: true, hint: 'Component name in Log files' }),
    HardwareType: TypeString({ required: true, hint: 'Manufacturer of Smartmeter', enumRef: ['ems', 'smartmeterHardwareToTypes'] }),
    HardwareModel: TypeString({ required: true, hint: 'Hardware model type of Smartmeter' }),
    Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
    Config: {
      group: {
        Usecase: TypeIndexString({ required: true, hint: 'Smartmeter usecase for power control', enumRef: ['ems','smartmeterUseCaseTypes'] }),
        IpAddress: TypeIPv4({ required: true, hint: 'IP address of Smartmeter' }),
        Port: TypeNumber({ required: true, hint: 'Modbus TCP port for communication with Smartmeter \n default: 502', min: 1, max: 65535, int: true })
      }
    }
  },
  defaults:{
    Type:'Smartmeter',
    Name: 'Smartmeter${n}', 
    DisplayName: 'Smartmeter ${n}',
    HardwareType:'Phoenix',
    HardwareModel:'@firstModelOf(HardwareType)',
    Guid:'@uuid',
    Config:{ 
      Usecase: [ 0, "Undefined"],
      IpAddress: '192.168.100.5',
      Port:502
    }
  }
};

const cSlaveLocalUM = {
  fields: {
    Type: { const: 'SlaveLocalUM', required: true },
    Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
    DisplayName: TypeString({ required: true, hint: 'Component name in Log files' }),
    Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
    Config: {
      group: {
        IpAddress: TypeIPv4({ required: true, hint: 'IP Address of local system' })
      }
    }
  },
  defaults:{
    Type: 'SlaveLocalUM',
    Name: 'LocalMainUnit',
    DisplayName: 'Local Main Unit',
    Guid: '@uuid',
    Config: {
      IpAddress: '192.168.100.10'
    }
  }
};

const cSlaveRemoteUM = {
  fields: {
    Type: { const: 'SlaveRemoteUM', required: true },
    Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
    DisplayName: TypeString({ required: true, hint: 'Component name in Log files' }),
    Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
    Config: {
      group: {
        IpAddress: TypeIPv4({ required: true, hint: 'IP Address of remote system' })
      }
    }
  },
  defaults:{
    Type: 'SlaveRemoteUM',
    Name: 'RemoteMainUnit${n0}',
    DisplayName: 'Remote Main Unit ${n0}',
    Guid: '@uuid',
    Config: {
      IpAddress: '192.168.100.10'
    }
  }
};

const cMainConfig = {
  fields: {
    InverterCount: TypeNumber({ required: true, hint: 'Number of installed inverters  \n - automatically calculated -', min: 0, max: 25, int: true, readOnly: true }),
    BatteryCount: TypeNumber({ required: true, hint: 'Number of installed battery systems \n - automatically calculated -', min: 0, max: 25, int: true, readOnly: true }),
    IpAddressInternal: TypeIPv4({ required: true, hint: 'Internal IP address of the main unit' }),
    PowerSwitchMainAvailable: TypeBool({ required: true, hint: 'Is a power switch installed within the local system?' }),
    SafetyRelayAvailable: TypeBool({ required: true, hint: 'Is a safety relay installed within the local system?' }),
    PowerChargeLimitLocal: TypeNumberUnit({ required: true, hint: 'Max charge power (or installed active power) of local system (Main Unit) \n >= 0', min: 0, unit: 'kW' }),
    PowerDischargeLimitLocal: TypeNumberUnit({ required: true, hint: 'Max discharge power (or installed active power) of local system (Main Unit) \n >= 0', min: 0, unit: 'kW' }),
  },
  defaults: {
    InverterCount: 1,
    BatteryCount: 1,
    IpAddressInternal: "192.168.137.5",
    PowerSwitchMainAvailable: false,
    SafetyRelayAvailable: false,
    PowerChargeLimitLocal: "0kW",
    PowerDischargeLimitLocal: "0kW"
  }
};

const cSmartmeterMain = {
  fields: {
    Type: { const: 'SmartmeterMain', required: true },
    Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
    DisplayName: TypeString({ required: true, hint: 'Component name in Log files' }),
    HardwareType: TypeString({ required: true, hint: 'Manufacturer of Smartmeter', enumRef: ['main', 'smartmeterHardwareToTypes'] }),
    HardwareModel: TypeString({ required: true, hint: 'Hardware model type of Smartmeter' }),
    Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' })
  },
  defaults:{
    Type: 'SmartmeterMain',
    Name: 'SmartmeterMain',
    DisplayName: 'SmartmeterMain',
    HardwareType: 'Virtual',
    HardwareModel: 'Virtual',
    Guid: '@uuid'
  }
};

const cBatteryInverterInverter = {
  fields: {
    group: {
      Type: TypeString({ required: true, hint: 'Inverter component type in TwinCAT project', enumRef: ['batteryInverter', 'inverterTypes'] }),
      Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
      Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
      Config: {
        group: {
          InverterType: TypeString({ required: true, hint: 'Inverter hardware type', enum: 'inverterHardwareTypes' }),
          NominalInverterPower: TypeNumberUnit({ required: true, hint: 'Nominal active power of installed Inverter', unit: 'kW', min: 1, max: 125 }),
          IpAddress: TypeIPv4({ required: true, hint: 'IP Address of Inverter' }),
          Port: TypeNumber({ required: true, hint: 'Modbus TCP port for communication with Inverter \n default: 502', min: 1, max: 65535, int: true })
        }
      }
    }
  },
  defaults:{
    Type:'TerraInverter',
    Name:'Inverter${n0}',
    Guid:'@uuid',
    Config: {
      InverterType:'SofarTerra',
      NominalInverterPower:'125kW',
      IpAddress: '192.168.137.40',
      Port:502
    }
  }
}

const cBatteryInverterBattery = {
  fields:{
    group: {
      Type: TypeString({ required: true, hint: 'Battery component type in TwinCAT project', enumRef: ['batteryInverter', 'batteryTypes'] }),
      Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
      Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
      Config: {
        group: {
          BatteryType: TypeString({ required: true, hint: 'Battery hardware type', enum: 'batteryHardwareTypes' }),
          BatteryCabinetCount: TypeNumber({ required: true, hint: 'Number of installed Battery cabinets \n [1..5]', min: 1, max: 5, int: true }),
          BatteryCabinetModuleCount: TypeNumber({ required: true, hint: 'Number of Battery modules within each installed cabinet \n [1..25]', min: 1, max: 25, int: true }),
          IpAddress: TypeIPv4({ required: true, hint: 'IP Address of Battery' }),
          Port: TypeNumber({ required: true, hint: 'Modbus TCP port for communication with Battery \n default: 502', min: 1, max: 65535, int: true })
        }
      }
    }
  },
  defaults: {
    Type:'TerraBattery',
    Name:'Battery${n0}',
    Guid:'@uuid',
    Config: {
      BatteryType:'SofarTerra',
      BatteryCabinetCount:1,
      BatteryCabinetModuleCount:6,
      IpAddress: '192.168.137.40',
      Port:502
    }
  }
};

const cBatteryInverterModbus = {
  fields: {
    optional: true,
    group: {
      Type: TypeString({ required: true, hint: 'Modbus component type in TwinCAT project', enumRef: ['batteryInverter', 'modbusTypes'] }),
      Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
      Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
      Config: {
        group: {
          IpAddress: TypeIPv4({ required: true, hint: 'IP Address of Modbus component' }),
          Port: TypeNumber({ required: true, hint: 'Modbus TCP port for communication with Component \n default: 502', min: 1, max: 65535, int: true })
        }
      }
    }
  },
  defaults: {
    Type:'TerraModbus',
    Name:'Modbus${n0}',
    Guid:'@uuid',
    Config: {
      IpAddress: '192.168.137.40',
      Port:502
    }
  }
};

export const components = {
  Global: cGlobal,
  System: cSystem,
  EmsConfig: cEmsConfig,
  Smartmeter: cSmartmeter,
  SlaveLocalUM: cSlaveLocalUM,
  SlaveRemoteUM: cSlaveRemoteUM,
  MainType: TypeString({ required: true, hint: 'Main Unit type \n - automatically detected -', enumRef: ['main', 'types'] }),
  MainConfig: cMainConfig,
  SmartmeterMain: cSmartmeterMain,
  BatteryInverterInverter: cBatteryInverterInverter,
  BatteryInverterBattery: cBatteryInverterBattery,
  BatteryInverterModbus: cBatteryInverterModbus,
  BatteryInverter: {
    fields: {
      Type: { const: 'BatteryInverter', required: true },
      Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
      Index: TypeNumber({ required: true, hint: 'Index of BatteryInverter component \n - automatically calculated -', min: 0, max: 14, int: true, readOnly: true }),
      Inverter : cBatteryInverterInverter.fields,
      Battery : cBatteryInverterBattery.fields,
      Modbus : cBatteryInverterModbus.fields
    },
    defaults:{
      Type: 'BatteryInverter',
      Index: 0,
      Name: 'BatteryInverter${n0}',
      Inverter: cBatteryInverterInverter.defaults,
      Battery: cBatteryInverterBattery.defaults,
      Modbus: cBatteryInverterModbus.defaults
    },
  }
} as const;
