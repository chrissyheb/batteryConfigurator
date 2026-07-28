import { TypeString, TypeNumber, TypeNumberUnit, TypeBool, TypeIndexString, TypeIPv4, IndexStringType, EnumOption } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const mainTypes = ['Terra', 'Blokk'] as const;

// Terra/Blokk-abhängige Werteliste (siehe components/battery-inverter/spec.ts für
// dasselbe Muster): "Undefined" bleibt bewusst ohne availability - das ist kein
// Hardware-Variant-Mismatch, sondern "noch nicht konfiguriert" (siehe validate
// unten), unabhängig vom gewählten HardwareVariant.
export const controlCabinetTypes: EnumOption<IndexStringType>[] = [
  [0, 'Undefined'],
  { value: [10, 'TerraEmsBoxV1'], availability: { hardwareVariants: ['Terra'] } },
  { value: [11, 'TerraEmsBoxV1.5'], availability: { hardwareVariants: ['Terra'] } },
  { value: [12, 'TerraEmsBoxV2'], availability: { hardwareVariants: ['Terra'] } },
  { value: [20, 'TerraHub'], availability: { hardwareVariants: ['Terra'] } },
  { value: [50, 'BlokkNNV3'], availability: { hardwareVariants: ['Blokk'] } }
];

// Bisher `components.MainType` in catalog.ts: kein eigenständiges Equipment,
// sondern ein einzelnes, automatisch erkanntes Feld. Wird hier als loser
// Field-Spec exportiert (kein ComponentDefinition, da keine fields/defaults-Gruppe).
export const MainType = TypeString({ required: true, hint: 'Main Unit type \n - automatically detected -', enumRef: mainTypes });

export const MainConfig: ComponentDefinition = {
  key: 'MainConfig',
  category: 'main-config',
  // Lokale Regel: "noch nicht konfiguriert" ist unabhängig vom Hardware-Variant-
  // Abgleich (der läuft generisch/zentral in spec/rules.ts über die Availability
  // der einzelnen controlCabinetTypes-Werte).
  validate: (instance: any) =>
  {
    const cabinetType: IndexStringType = instance?.MainControlCabinetType ?? [0, 'Undefined'];
    if (cabinetType[0] === 0)
    {
      return [{ message: 'MainControlCabinetType not configured', path: ['MainControlCabinetType'] }];
    }
    return [];
  },
  // Reihenfolge entspricht bewusst der UI-Reihenfolge (siehe forms/MainSection.tsx,
  // seit Phase 5 per renderFieldTree direkt aus dieser Reihenfolge generiert):
  // editierbare Felder zuerst, die beiden automatisch berechneten Zähler zuletzt.
  fields: {
    IpAddressInternal: TypeIPv4({ required: true, hint: 'Internal IP address of the main unit' }),
    MainControlCabinetType: TypeIndexString({ required: true, hint: 'Main control cabinet type', enumRef: controlCabinetTypes }),
    PowerSwitchMainAvailable: TypeBool({ required: true, hint: 'Is a power switch installed within the local system?' }),
    SafetyRelayAvailable: TypeBool({ required: true, hint: 'Is a safety relay installed within the local system?' }),
    PowerChargeLimitLocal: TypeNumberUnit({ required: true, hint: 'Max charge power (or installed active power) of local system (Main Unit) \n >= 0', min: 0, unit: 'kW' }),
    PowerDischargeLimitLocal: TypeNumberUnit({ required: true, hint: 'Max discharge power (or installed active power) of local system (Main Unit) \n >= 0', min: 0, unit: 'kW' }),
    InverterCount: TypeNumber({ required: true, hint: 'Number of installed inverters  \n - automatically calculated -', min: 0, max: 25, int: true, readOnly: true }),
    BatteryCount: TypeNumber({ required: true, hint: 'Number of installed battery systems \n - automatically calculated -', min: 0, max: 25, int: true, readOnly: true }),
  },
  defaults: {
    IpAddressInternal: '192.168.137.5',
    MainControlCabinetType: [0, 'Undefined'],
    PowerSwitchMainAvailable: false,
    SafetyRelayAvailable: false,
    PowerChargeLimitLocal: '0kW',
    PowerDischargeLimitLocal: '0kW',
    InverterCount: 1,
    BatteryCount: 1,
    PowerLimitGroups: [],
  }
};
