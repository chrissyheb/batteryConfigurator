
export type IntegerString = string;
export type UUID = string;
export type IPv4 = string;

export const ui = { typeFirst: true } as const;

export const enums = {
  global: {
    libVersion: ['0.0.3', '0.0.2', '0.0.1'],
    hardwareVariant: ['Terra', 'BlokkV3']
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

export const components = {
  Global: {
    fields: {
      Customer: { type: 'string', required: true },
      ModularPlc: {
        group: {
          Version: { enumRef: ['global', 'libVersion'], required: true },
          HardwareVariant: { enumRef: ['global', 'hardwareVariant'], required: true }
        }
      }
    },
    defaults:{
      Customer: '',
      ModularPlc: { 
        Version:'0.0.3',
        HardwareVariant:'BlokkV3' 
      }
    }
  },
  Smartmeter: {
    fields: {
      Type: { const: 'Smartmeter' },
      Name: { type: 'string', required: true },
      DisplayName: { type: 'string', required: true },
      HardwareType: { enumRef: ['ems', 'smartmeterHardwareToTypes'], required: true },
      HardwareModel: { type: 'string', required: true },
      Guid: { type: 'uuid', required: true },
      Config: {
        group: {
          Usecase: { enumRef: ['ems','smartmeterUseCaseTypes'], required: true },
          Port: { type: 'integer-string', min: 1, max: 65535, required: true }
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
        Port:'502' 
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
  MainType: { enum: ['main', 'types'] },
  SmartmeterMain: {
    fields: {
      Type: { const: 'SmartmeterMain' },
      Name: { type: 'string', required: true },
      DisplayName: { type: 'string', required: true },
      HardwareType: { enumRef: ['main', 'smartmeterHardwareToTypes'], required: true },
      HardwareModel: { type: 'string', required: true },
      Guid: { type: 'uuid', required: true }
    },
    defaults:{
      Name: 'SmartmeterMain ${n}',
      DisplayName: 'SmartmeterMain ${n}',
      Type: 'SmartmeterMain',
      Hardware: 'Virtual',
      Guid: '@uuid'
    }
  },
  BatteryInverter: {
    fields: {
      Type: { const: 'BatteryInverter' },
      Name: { type: 'string', required: true },
      Inverter: {
        group: {
          Type: { enumRef: ['batteryInverter', 'inverterTypes'], required: true },
          Name: { type: 'string', required: true },
          Guid: { type: 'uuid', required: true },
          Config: {
            group: {
              InverterType: { enum: 'inverterHardwareTypes', required: true },
              NominalInverterPower: { type: 'integer-string', min: 1, max: 125000, required: true }
            }
          }
        }
      },
      Battery: {
        group: {
          Type: { enumRef: ['batteryInverter', 'batteryTypes'], required: true },
          Name: { type: 'string', required: true },
          Guid: { type: 'uuid', required: true },
          Config: {
            group: {
              BatteryType: { enum: 'batteryHardwareTypes', required: true },
              BatteryCabinetCount: { type: 'integer-string', min: 1, max: 5, required: true },
              BatteryCabinetModuleCount: { type: 'integer-string', min: 1, max: 25, required: true }
            }
          }
        }
      },
      Modbus: {
        optional: true,
        group: {
          Type: { enumRef: ['batteryInverter', 'modbusTypes'], required: true },
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
          NominalInverterPower:'125000'
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
