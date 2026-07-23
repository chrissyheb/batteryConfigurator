import { TypeString, TypeNumber, TypeNumberUnit, TypeBool, TypeIndexString, TypeIPv4, IndexStringType } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const mainTypes = ['Terra', 'Blokk'] as const;
export const controlCabinetTypes: IndexStringType[] = [[0, 'Undefined'], [10, 'TerraEmsBoxV1'], [11, 'TerraEmsBoxV1.5'], [12, 'TerraEmsBoxV2'], [20, 'TerraHub'], [50, 'BlokkNNV3']];

// Bisher `components.MainType` in catalog.ts: kein eigenständiges Equipment,
// sondern ein einzelnes, automatisch erkanntes Feld. Wird hier als loser
// Field-Spec exportiert (kein ComponentDefinition, da keine fields/defaults-Gruppe).
export const MainType = TypeString({ required: true, hint: 'Main Unit type \n - automatically detected -', enumRef: mainTypes });

export const MainConfig: ComponentDefinition = {
  key: 'MainConfig',
  category: 'main-config',
  fields: {
    InverterCount: TypeNumber({ required: true, hint: 'Number of installed inverters  \n - automatically calculated -', min: 0, max: 25, int: true, readOnly: true }),
    BatteryCount: TypeNumber({ required: true, hint: 'Number of installed battery systems \n - automatically calculated -', min: 0, max: 25, int: true, readOnly: true }),
    IpAddressInternal: TypeIPv4({ required: true, hint: 'Internal IP address of the main unit' }),
    MainControlCabinetType: TypeIndexString({ required: true, hint: 'Main control cabinet type', enumRef: controlCabinetTypes }),
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
