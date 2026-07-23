import { TypeString } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

// Wählbare PLC-Lib-Versionen (Global.ModularPlc.Version). Steuert über
// core/versioning.ts (sinceVersion/untilVersion), welche Felder/Komponenten
// aktuell verfügbar sind.
export const libVersion = ['3.0.109', '3.0.108', '0.0.7', '0.0.6', '0.0.5'] as const;
export const hardwareVariants = ['Terra', 'BlokkV3'] as const;

export const Global: ComponentDefinition = {
  key: 'Global',
  category: 'global',
  fields: {
    Customer: TypeString({ required: true, hint: 'Customer name' }),
    ModularPlc: {
      group: {
        Version: TypeString({ required: true, hint: 'Library version of the Modular PLC', enumRef: libVersion }),
        HardwareVariant: TypeString({ required: true, hint: 'Hardware variant of customer project', enumRef: hardwareVariants })
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
