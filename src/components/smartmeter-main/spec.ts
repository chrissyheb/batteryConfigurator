import { TypeString, TypeUuid, TypeNumberUnit, dependentEnumFields } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const smartmeterHardwareToTypes = {
  Virtual: ['Virtual'],
  Beckhoff: ['El34x3']
} as const;

export const SmartmeterMain: ComponentDefinition = {
  key: 'SmartmeterMain',
  category: 'main-equipment',
  // Lokale Regel: betrifft ausschließlich HardwareType/HardwareModel/
  // CurrentTransformerPrimaryCurrent dieser einen Instanz.
  validate: (instance: any) =>
  {
    const hwType = instance?.HardwareType ?? '';
    const hwModel = instance?.HardwareModel ?? '';
    if (hwType === 'Beckhoff' && hwModel === 'El34x3')
    {
      const current = instance?.CurrentTransformerPrimaryCurrent ?? '';
      if (current === '' || current === '0A' || current === '0.0A')
      {
        return [{ message: 'SmartmeterMain CurrentTransformerPrimaryCurrent must be > 0A', path: ['CurrentTransformerPrimaryCurrent'] }];
      }
    }
    return [];
  },
  fields: {
    Type: { const: 'SmartmeterMain', required: true },
    Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
    DisplayName: TypeString({ required: true, hint: 'Component name in Log files' }),
    // HardwareType->HardwareModel-Kopplung wie bei Smartmeter (ems) - siehe
    // core/field-types.ts -> dependentEnumFields.
    ...dependentEnumFields(smartmeterHardwareToTypes, {
      primaryKey: 'HardwareType',
      primaryHint: 'Manufacturer of Smartmeter',
      secondaryKey: 'HardwareModel',
      secondaryHint: 'Hardware model type of Smartmeter'
    }),
    // BEISPIEL für Versionsgate auf Feldebene: an die tatsächliche Versionshistorie
    // anpassen (oder entfernen), sinceVersion ist rein illustrativ.
    // Dynamisches readOnly (nur editierbar bei HardwareModel 'El34x3') war
    // bisher hand-geschrieben in forms/MainSection.tsx - jetzt deklarativ hier.
    CurrentTransformerPrimaryCurrent: TypeNumberUnit({
      required: false,
      hint: 'Nominal transformer primary current for BLOKK/TERRA power Measurement with Beckhoff EL34x3 \n >= 0',
      min: 0,
      unit: 'A',
      availability: { sinceVersion: '0.0.7' },
      readOnlyWhen: (cfg) => (cfg?.Units?.Main?.Equipment?.SmartmeterMain?.HardwareModel ?? 'Virtual') !== 'El34x3'
    }),
    Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' })
  },
  defaults: {
    Type: 'SmartmeterMain',
    Name: 'SmartmeterMain',
    DisplayName: 'SmartmeterMain',
    HardwareType: 'Virtual',
    HardwareModel: 'Virtual',
    CurrentTransformerPrimaryCurrent: '0A',
    Guid: '@uuid'
  }
};
