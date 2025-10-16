
export type IntegerString = string;
export type UUID = string;
export type IPv4 = string;

export const ui = { typeFirst: true } as const;

export type IndexStringType = [number, string];

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
    Customer: { type: 'string', required: true },
    ModularPlc: {
      group: {
        Version: { type: 'string', enumRef: ['global', 'libVersion'], required: true },
        HardwareVariant: { type: 'string', enumRef: ['global', 'hardwareVariant'], required: true }
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
    SerialNumber: { type: 'string', required: true },
    BatteryBalancing: {
      group: {
        PreemptiveMode: { type: 'indexString', enumRef: ['system', 'batteryBalancingModes'], required: true },
        PreemptiveDaysToEnable: { type: 'number', min: 0, max: 365, int: true, required: true },
        PreemptiveMaxGridChargePower: { type: 'numberWithUnit', unit: 'kW', required: true },
        ForcedDaysToEnable: { type: 'number', min: 0, max: 365, int: true, required: true },
        ForcedMaxGridChargePowerPerInverter: { type: 'numberWithUnit', unit: 'kW', required: true },
      }
    },
    ExternalControl: {
      group: {
        FallbackMode:  { type: 'indexString', enumRef: ['system', 'externalControlOperationModes'], required: true }
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
    GridConnectionPoint: {
      group: {
        PowerGridConsumptionLimit: { type: 'numberWithUnit', unit: 'kW', required: true },
        PowerGridFeedInLimit: { type: 'numberWithUnit', unit: 'kW', required: true },
        PowerGridConsumptionOffset: { type: 'numberWithUnit', unit: 'kW', required: true },
      }
    },
    MasterSlave: {
      group: {
        PowerActiveInstalledTotal: { type: 'numberWithUnit', unit: 'kW', required: true },
        CapacityInstalledTotal: { type: 'numberWithUnit', unit: 'kWh', required: true },
        PowerChargeLimitTotal: { type: 'numberWithUnit', unit: 'kW', required: true },
        PowerDischargeLimitTotal: { type: 'numberWithUnit', unit: 'kW', required: true },
      }
    }
  },
  defaults: {
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
    Type: { const: 'Smartmeter' },
    Name: { type: 'string', required: true },
    DisplayName: { type: 'string', required: true },
    HardwareType: { type: 'string', enumRef: ['ems', 'smartmeterHardwareToTypes'], required: true },
    HardwareModel: { type: 'string', required: true },
    Guid: { type: 'uuid', required: true },
    Config: {
      group: {
        Usecase: { type: 'indexString', enumRef: ['ems','smartmeterUseCaseTypes'], required: true },
        IpAddress: { type: 'ipv4', required: true },
        Port: { type: 'number', min: 1, max: 65535, int: true, required: true }
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
    Type: { const: 'SlaveLocalUM' },
    Name: { type: 'string', required: true },
    DisplayName: { type: 'string', required: true },
    Guid: { type: 'uuid', required: true },
    Config: {
      group: {
        IpAddress: { type: 'ipv4', required: true }
      }
    }
  },
  defaults:{
    Name: 'SlaveLocalUM ${n}',
    DisplayName: 'SlaveLocalUM ${n}',
    Type: 'SlaveLocalUM',
    Guid: '@uuid',
    Config: {
      IpAddress: '192.168.0.10'
    }
  }
};

const cSlaveRemoteUM = {
  fields: {
    Type: { const: 'SlaveRemoteUM' },
    Name: { type: 'string', required: true },
    DisplayName: { type: 'string', required: true },
    Guid: { type: 'uuid', required: true },
    Config: {
      group: {
        IpAddress: { type: 'ipv4', required: true }
      }
    }
  },
  defaults:{
    Name: 'SlaveRemoteUM ${n}',
    DisplayName: 'SlaveRemoteUM ${n}',
    Type: 'SlaveRemoteUM',
    Guid: '@uuid',
    Config: {
      IpAddress: '192.168.0.10'
    }
  }
};

const cMainConfig = {
  fields: {
    IpAddressInternal: { type: 'ipv4', required: true },
    PowerSwitchMainAvailable: { type: 'bool', required: true },
    PowerChargeLimitLocal: { type: 'numberWithUnit', unit: 'kW', min: 0, required: true },
    PowerDischargeLimitLocal: { type: 'numberWithUnit', unit: 'kW', min: 0, required: true },
  },
  defaults: {
    IpAddressInternal: "192.168.137.5",
    PowerSwitchMainAvailable: false,
    PowerChargeLimitLocal: "0kW",
    PowerDischargeLimitLocal: "0kW"
  }
};

const cSmartmeterMain = {
  fields: {
    Type: { const: 'SmartmeterMain' },
    Name: { type: 'string', required: true },
    DisplayName: { type: 'string', required: true },
    HardwareType: { type: 'string', enumRef: ['main', 'smartmeterHardwareToTypes'], required: true },
    HardwareModel: { type: 'string', required: true },
    Guid: { type: 'uuid', required: true }
  },
  defaults:{
    Name: 'SmartmeterMain ${n}',
    DisplayName: 'SmartmeterMain ${n}',
    Type: 'SmartmeterMain',
    HardwareType: 'Virtual',
    HardwareModel: 'Virtual',
    Guid: '@uuid'
  }
};

const cBatteryInverterInverter = {
  fields: {
    group: {
      Type: { type: 'string', enumRef: ['batteryInverter', 'inverterTypes'], required: true },
      Name: { type: 'string', required: true },
      Guid: { type: 'uuid', required: true },
      Config: {
        group: {
          InverterType: { type: 'string', enum: 'inverterHardwareTypes', required: true },
          NominalInverterPower: { type: 'numberWithUnit', unit: 'kW', min: 1, max: 125, required: true }
        }
      }
    }
  },
  defaults:{
    Name:'Inverter ${n}',
    Type:'TerraInverter',
    Guid:'@uuid',
    Config: {
      InverterType:'SofarTerra',
      NominalInverterPower:'125kW'
    }
  }
}

const cBatteryInverterBattery = {
  fields:{
    group: {
      Type: { type: 'string', enumRef: ['batteryInverter', 'batteryTypes'], required: true },
      Name: { type: 'string', required: true },
      Guid: { type: 'uuid', required: true },
      Config: {
        group: {
          BatteryType: { type: 'string', enum: 'batteryHardwareTypes', required: true },
          BatteryCabinetCount: { type: 'number', min: 1, max: 5, int: true, required: true },
          BatteryCabinetModuleCount: { type: 'number', min: 1, max: 25, int: true, required: true }
        }
      }
    }
  },
  defaults: {
    Name:'Battery ${n}',
    Type:'TerraBattery',
    Guid:'@uuid',
    Config: {
      BatteryType:'SofarTerra',
      BatteryCabinetCount:1,
      BatteryCabinetModuleCount:6
    }
  }
};

const cBatteryInverterModbus = {
  fields: {
    optional: true,
    group: {
      Type: { type: 'string', enumRef: ['batteryInverter', 'modbusTypes'], required: true },
      Name: { type: 'string', required: true },
      Guid: { type: 'uuid', required: true }
    }
  },
  defaults: {
    Type:'TerraModbus',
    Name:'Modbus ${n}',
    Guid:'@uuid'
  }
};

export const components = {
  Global: cGlobal,
  System: cSystem,
  EmsConfig: cEmsConfig,
  Smartmeter: cSmartmeter,
  SlaveLocalUM: cSlaveLocalUM,
  SlaveRemoteUM: cSlaveRemoteUM,
  MainType: { type: 'string', enum: ['main', 'types'] },
  MainConfig: cMainConfig,
  SmartmeterMain: cSmartmeterMain,
  BatteryInverterInverter: cBatteryInverterInverter,
  BatteryInverterBattery: cBatteryInverterBattery,
  BatteryInverterModbus: cBatteryInverterModbus,
  BatteryInverter: {
    fields: {
      Type: { const: 'BatteryInverter' },
      Name: { type: 'string', required: true },
      Inverter : cBatteryInverterInverter.fields,
      Battery : cBatteryInverterBattery.fields,
      Modbus : cBatteryInverterModbus.fields
    },
    defaults:{
      Name: 'BatteryInverter ${n}',
      Type:'BatteryInverter',
      Inverter: cBatteryInverterInverter.defaults,
      Battery: cBatteryInverterBattery.defaults,
      Modbus: cBatteryInverterModbus.defaults
    },
  }
} as const;
