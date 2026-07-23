import { TypeBool, TypeNumberUnit } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

// Wird sowohl unter Units.Ems.Config.PowerLimitGroups als auch
// Units.Main.Config.PowerLimitGroups verwendet -> category 'ems-config'
// gewählt, da PowerLimitGroup selbst kein eigenständiges Equipment ist.
export const PowerLimitGroup: ComponentDefinition = {
  key: 'PowerLimitGroup',
  category: 'ems-config',
  fields: {
    Active: TypeBool({ required: false, hint: 'Enable power limit group' }),
    PowerActiveLimit: TypeNumberUnit({ required: false, hint: 'Max active power at the smartmeters of this power limit group \n > 0', min: 0, unit: 'kW' }),
    FallbackPowerLimitCharge: TypeNumberUnit({ required: false, hint: 'Max charge power if not all smartmeters of this power limit group are online \n >= 0', min: 0, unit: 'kW' }),
    FallbackPowerLimitDischarge: TypeNumberUnit({ required: false, hint: 'Max discharge power if not all smartmeters of this power limit group are online \n >= 0', min: 0, unit: 'kW' }),
  },
  defaults: {
    Active: true,
    PowerActiveLimit: '3kW',
    FallbackPowerLimitCharge: '2kW',
    FallbackPowerLimitDischarge: '1kW'
  }
};
