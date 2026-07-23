import { TypeString, TypeUuid, TypeIPv4, TypeNumber, TypeIndexString } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const Smartmeter: ComponentDefinition = {
  key: 'Smartmeter',
  category: 'ems-equipment',
  fields: {
    Type: { const: 'Smartmeter', required: true },
    Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
    DisplayName: TypeString({ required: true, hint: 'Component name in Log files' }),
    HardwareType: TypeString({ required: true, hint: 'Manufacturer of Smartmeter', enumRef: ['ems', 'smartmeterHardwareToTypes'] }),
    HardwareModel: TypeString({ required: true, hint: 'Hardware model type of Smartmeter' }),
    Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
    Config: {
      group: {
        Usecase: TypeIndexString({ required: true, hint: 'Smartmeter usecase for power control', enumRef: ['ems', 'smartmeterUseCaseTypes'] }),
        PowerSign: TypeIndexString({ required: true, hint: 'Sign of measuered power: Positive (+ consumption / - feed in) or Negative (- consumption / + feed in)', enumRef: ['ems', 'smartmeterPowerSignTypes'] }),
        IpAddress: TypeIPv4({ required: true, hint: 'IP address of Smartmeter' }),
        Port: TypeNumber({ required: true, hint: 'Modbus TCP port for communication with Smartmeter \n default: 502', min: 1, max: 65535, int: true })
      }
    }
  },
  defaults: {
    Type: 'Smartmeter',
    Name: 'Smartmeter${n}',
    DisplayName: 'Smartmeter ${n}',
    HardwareType: 'Phoenix',
    HardwareModel: '@firstModelOf(HardwareType)',
    Guid: '@uuid',
    Config: {
      Usecase: [0, 'Undefined'],
      PowerSign: [0, 'Positive'],
      IpAddress: '192.168.100.5',
      Port: 502
    }
  }
};
