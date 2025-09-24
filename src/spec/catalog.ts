
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
    smartmeterUseCaseTypes: ['GridConnectionPointControl']
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

export const components = {
  Global: {
    fields: {
      Customer: { type: 'string', required: true },
      ModularPlc: {
        group: {
          Version: { type: 'string', enumRef: ['global', 'libVersion'], required: true },
          HardwareVariant: { type: 'string', enumRef: ['global', 'hardwareVariant'], required: true }
        }
      }
    },
    defaults:{
      Customer: '',
      ModularPlc: { 
        Version:'0.0.3',
        HardwareVariant:'Terra' 
      }
    }
  },
  System: {
    fields: {
      SerialNumber: { type: 'string', required: true },
      BatteryBalancing: {
        group: {
          PreemptiveMode: { type: 'indexString', enumRef: ['system', 'batteryBalancingModes'], required: true },
          PreemptiveDaysToEnable: { type: 'number', min: 0, max: 365, required: true },
          PreemptiveMaxGridChargePower: { type: 'numberWithUnit', unit: 'kW', required: true },
          ForcedDaysToEnable: { type: 'number', min: 0, max: 365, required: true },
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
        PreemptiveMode: [ 0, "BlokkBatteryBalancingMode.None"],
        PreemptiveDaysToEnable: 60,
        PreemptiveMaxGridChargePower: "30kW",
        ForcedDaysToEnable: 90,
        ForcedMaxGridChargePowerPerInverter: "5kW"
      },
      ExternalControl: {
        FallbackMode: [ 0, "ExternalControlOperationMode.Standard"]
      }
    }
  },
  EmsConfig: {
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
  },
  Smartmeter: {
    fields: {
      Type: { const: 'Smartmeter' },
      Name: { type: 'string', required: true },
      DisplayName: { type: 'string', required: true },
      HardwareType: { type: 'string', enumRef: ['ems', 'smartmeterHardwareToTypes'], required: true },
      HardwareModel: { type: 'string', required: true },
      Guid: { type: 'uuid', required: true },
      Config: {
        group: {
          Usecase: { type: 'string', enumRef: ['ems','smartmeterUseCaseTypes'], required: true },
          Port: { type: 'number', min: 1, max: 65535, required: true }
        }
      }
    },
    defaults:{
      Name: 'Smartmeter ${n}', 
      DisplayName: 'Smartmeter ${n}',
      Type:'Smartmeter',
      HardwareType:'Phoenix',
      HardwareModel:'@firstModelOf(HardwareType)',
      Guid:'@uuid',
      Config:{ 
        Usecase:'GridConnectionPointControl',
        Port:502
      }
    }
  },
  SlaveLocalUM: {
    fields: {
      Type: { const: 'SlaveLocalUM' },
      Name: { type: 'string', required: true },
      DisplayName: { type: 'string', required: true },
      Guid: { type: 'uuid', required: true }
    },
    defaults:{
      Name: 'SlaveLocalUM ${n}',
      DisplayName: 'SlaveLocalUM ${n}',
      Type: 'SlaveLocalUM',
      Guid: '@uuid'
    }
  },
  SlaveRemoteUM: {
    fields: {
      Type: { const: 'SlaveRemoteUM' },
      Name: { type: 'string', required: true },
      DisplayName: { type: 'string', required: true },
      Guid: { type: 'uuid', required: true },
      Ip: { type: 'ipv4', required: true }
    },
    defaults:{
      Name: 'SlaveRemoteUM ${n}',
      DisplayName: 'SlaveRemoteUM ${n}',
      Type: 'SlaveRemoteUM',
      Guid: '@uuid',
      Ip: '192.168.0.10'
    }
  },
  MainType: { type: 'string', enum: ['main', 'types'] },
  MainConfig: {
    fields: {
      IpAddressInternal: { type: 'ipv4', required: true },
      PowerSwitchMainAvailable: { type: 'bool', required: true },
      PowerChargeLimitLocal: { type: 'numberWithUnit', unit: 'kW', required: true },
      PowerDischargeLimitLocal: { type: 'numberWithUnit', unit: 'kW', required: true },
    },
    defaults: {
      IpAddressInternal: "192.168.137.5",
      PowerSwitchMainAvailable: false,
      PowerChargeLimitLocal: "0kW",
      PowerDischargeLimitLocal: "0kW"
    }
  },
  SmartmeterMain: {
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
  },
  BatteryInverter: {
    fields: {
      Type: { const: 'BatteryInverter' },
      Name: { type: 'string', required: true },
      Inverter: {
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
      Battery: {
        group: {
          Type: { type: 'string', enumRef: ['batteryInverter', 'batteryTypes'], required: true },
          Name: { type: 'string', required: true },
          Guid: { type: 'uuid', required: true },
          Config: {
            group: {
              BatteryType: { type: 'string', enum: 'batteryHardwareTypes', required: true },
              BatteryCabinetCount: { type: 'number', min: 1, max: 5, required: true },
              BatteryCabinetModuleCount: { type: 'number', min: 1, max: 25, required: true }
            }
          }
        }
      },
      Modbus: {
        optional: true,
        group: {
          Type: { type: 'string', enumRef: ['batteryInverter', 'modbusTypes'], required: true },
          Name: { type: 'string', required: true },
          Guid: { type: 'uuid', required: true }
        }
      }
    },
    defaults:{
      Name: 'BatteryInverter ${n}',
      Type:'BatteryInverter',
      Inverter: {
        Name:'Inverter ${n}',
        Type:'TerraInverter',
        Guid:'@uuid',
        Config: {
          InverterType:'SofarTerra',
          NominalInverterPower:'125'
        }
      },
      Battery: {
        Name:'Battery ${n}',
        Type:'TerraBattery',
        Guid:'@uuid',
        Config: {
          BatteryType:'SofarTerra',
          BatteryCabinetCount:'1',
          BatteryCabinetModuleCount:'6'
        }
      },
      Modbus: {
        Name:'Modbus ${n}',
        Type:'TerraModbus',
        Guid:'@uuid'
      }
    }
  }
} as const;
