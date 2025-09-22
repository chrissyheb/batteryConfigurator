
export type IntegerString = string;
export type UUID = string;
export type IPv4 = string;

export const ui = { typeFirst: true } as const;

export const enums = {
  ems: {
    smartmeterHardwareToTypes: {
      CarloGavazzi: ['EM24'],
      Phoenix: ['EM375'],
      Janitza: ['UMG 96 PA', 'UMG 96 RM', 'UMG 509 Pro'],
      Beckhoff: ['El34x3'],
      Virtual: ['Virtual']
    },
    smartmeterUseCaseTypes: ['Undefined', 'GridConnectionPointControl']
  },
  main: {
    smartmeterHardwareToTypes: {
      Virtual: ['Virtual'],
      Beckhoff: ['El34x3']
    }
  },
  batteryInverter: {
    inverterTypes: ['TerraInverter', 'InverterKaco'],
    batteryTypes: ['TerraBattery', 'BatteryPylontechM1xBms'],
    modbusTypes: ['TerraModbus']
  },
  inverterHardwareTypes: ['SofarTerra', 'Kaco'],
  batteryHardwareTypes: ['SofarTerra', 'PylontechM1C']
} as const;

export const components = {
  Smartmeter: {
    fields: {
      Name: { type: 'string', required: true },
      Displayname: { type: 'string', required: true },
      Type: { const: 'Smartmeter' },
      HardwareType: { enumRef: ['ems', 'smartmeterHardwareToTypes'], required: true },
      HardwareModel: { type: 'string', required: true },
      Guid: { type: 'uuid', required: true },
      Config: {
        group: {
          Usecase: { enumRef: ['ems','smartmeterUseCaseTypes'], required: true },
          Port: { type: 'integer-string', min: 1, max: 65535, required: true }
        }
      }
    }
  },
  SlaveLocalUM: {
    fields: {
      Name: { type: 'string', required: true },
      Displayname: { type: 'string', required: true },
      Type: { const: 'SlaveLocalUM' },
      Guid: { type: 'uuid', required: true }
    }
  },
  SlaveRemoteUM: {
    fields: {
      Name: { type: 'string', required: true },
      Displayname: { type: 'string', required: true },
      Type: { const: 'SlaveRemoteUM' },
      Guid: { type: 'uuid', required: true },
      Ip: { type: 'ipv4', required: true }
    }
  },
  SmartmeterMain: {
    fields: {
      Name: { type: 'string', required: true },
      Displayname: { type: 'string', required: true },
      Type: { const: 'SmartmeterMain' },
      HardwareType: { enumRef: ['main', 'smartmeterHardwareToTypes'], required: true },
      HardwareModel: { type: 'string', required: true },
      Guid: { type: 'uuid', required: true }
    }
  },
  BatteryInverter: {
    fields: {
      Name: { type: 'string', required: true },
      Type: { const: 'BatteryInverter' },
      Inverter: {
        group: {
          Name: { type: 'string', required: true },
          Type: { enumRef: ['batteryInverter', 'inverterTypes'], required: true },
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
          Name: { type: 'string', required: true },
          Type: { enumRef: ['batteryInverter', 'batteryTypes'], required: true },
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
          Name: { type: 'string', required: true },
          Type: { enumRef: ['batteryInverter', 'modbusTypes'], required: true },
          Guid: { type: 'uuid', required: true }
        }
      }
    }
  }
} as const;
