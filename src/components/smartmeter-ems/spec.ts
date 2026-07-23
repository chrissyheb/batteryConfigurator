import { TypeString, TypeUuid, TypeIPv4, TypeNumber, TypeIndexString, IndexStringType } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const smartmeterHardwareToTypes = {
  CarloGavazzi: ['EM24'],
  Phoenix: ['EM375', 'MA370'],
  Janitza: ['UMG 96 PA', 'UMG 96 PQ', 'UMG 96 RM', 'UMG 509 Pro', 'UMG 604 Pro', 'UMG 801'],
  Custom: ['Custom'],
  Beckhoff: ['El34x3'],
  Virtual: ['Virtual']
} as const;

export const smartmeterUseCaseTypes: IndexStringType[] = [[0, 'Undefined'], [2, 'GridConnectionPointControl'], [3, 'PowerLimitationGroupEms1'], [4, 'PowerLimitationGroupEms2'], [5, 'PowerLimitationGroupMain1'], [6, 'PowerLimitationGroupMain2']];
export const smartmeterPowerSignTypes: IndexStringType[] = [[0, 'Positive'], [1, 'Negative']];

export const Smartmeter: ComponentDefinition = {
  key: 'Smartmeter',
  category: 'ems-equipment',
  // Lokale Regel: HardwareType/HardwareModel-Abhängigkeit betrifft ausschließlich
  // die Felder dieser Instanz - gehört daher hier hin statt zentral in spec/rules.ts.
  validate: (instance: any) =>
  {
    const type = instance?.HardwareType;
    const model = instance?.HardwareModel;

    if (!type)
    {
      return [{ message: 'HardwareType required', path: ['HardwareType'] }];
    }

    const allowed = (smartmeterHardwareToTypes as Record<string, readonly string[]>)[type];
    if (!Array.isArray(allowed) || allowed.length === 0)
    {
      return [{ message: 'Invalid HardwareType', path: ['HardwareType'] }];
    }

    if (!model)
    {
      return [{ message: 'HardwareModel required', path: ['HardwareModel'] }];
    }

    if (!allowed.includes(model))
    {
      return [{ message: 'HardwareModel not valid for HardwareType', path: ['HardwareModel'] }];
    }

    return [];
  },
  fields: {
    Type: { const: 'Smartmeter', required: true },
    Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
    DisplayName: TypeString({ required: true, hint: 'Component name in Log files' }),
    HardwareType: TypeString({ required: true, hint: 'Manufacturer of Smartmeter', enumRef: smartmeterHardwareToTypes }),
    HardwareModel: TypeString({ required: true, hint: 'Hardware model type of Smartmeter' }),
    Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
    Config: {
      group: {
        Usecase: TypeIndexString({ required: true, hint: 'Smartmeter usecase for power control', enumRef: smartmeterUseCaseTypes }),
        PowerSign: TypeIndexString({ required: true, hint: 'Sign of measuered power: Positive (+ consumption / - feed in) or Negative (- consumption / + feed in)', enumRef: smartmeterPowerSignTypes }),
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
