import { TypeString, TypeNumber, TypeNumberUnit, TypeBool, TypeIndexString, TypeIPv4 } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

// Bisher `components.MainType` in catalog.ts: kein eigenständiges Equipment,
// sondern ein einzelnes, automatisch erkanntes Feld. Wird hier als loser
// Field-Spec exportiert (kein ComponentDefinition, da keine fields/defaults-Gruppe).
export const MainType = TypeString({ required: true, hint: 'Main Unit type \n - automatically detected -', enumRef: ['main', 'types'] });

export const MainConfig: ComponentDefinition = {
  key: 'MainConfig',
  category: 'main-config',
  fields: {
    InverterCount: TypeNumber({ required: true, hint: 'Number of installed inverters  \n - automatically calculated -', min: 0, max: 25, int: true, readOnly: true }),
    BatteryCount: TypeNumber({ required: true, hint: 'Number of installed battery systems \n - automatically calculated -', min: 0, max: 25, int: true, readOnly: true }),
    IpAddressInternal: TypeIPv4({ required: true, hint: 'Internal IP address of the main unit' }),
    MainControlCabinetType: TypeIndexString({ required: true, hint: 'Main control cabinet type', enumRef: ['main', 'controlCabinetTypes'] }),
    PowerSwitchMainAvailable: TypeBool({ required: true, hint: 'Is a power switch installed within the local system?' }),
    SafetyRelayAvailable: TypeBool({ required: true, hint: 'Is a safety relay installed within the local system?' }),
    PowerChargeLimitLocal: TypeNumberUnit({ required: true, hint: 'Max charge power (or installed active power) of local system (Main Unit) \n >= 0', min: 0, unit: 'kW' }),
    PowerDischargeLimitLocal: TypeNumberUnit({ required: true, hint: 'Max discharge power (or installed active power) of local system (Main Unit) \n >= 0', min: 0, unit: 'kW' }),
  },
  defaults: {
    InverterCount: 1,
    BatteryCount: 1,
    IpAddressInternal: '192.168.137.5',
    MainControlCabinetType: [0, 'Undefined'],
    PowerSwitchMainAvailable: false,
    SafetyRelayAvailable: false,
    PowerChargeLimitLocal: '0kW',
    PowerDischargeLimitLocal: '0kW',
    PowerLimitGroups: [],
  }
};
