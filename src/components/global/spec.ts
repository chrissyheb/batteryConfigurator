import { TypeString } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const Global: ComponentDefinition = {
  key: 'Global',
  category: 'global',
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
      Version: '0.0.8',
      HardwareVariant: 'Terra'
    }
  }
};
