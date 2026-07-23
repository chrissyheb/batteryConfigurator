import { TypeString, TypeUuid, TypeNumberUnit } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const SmartmeterMain: ComponentDefinition = {
  key: 'SmartmeterMain',
  category: 'main-equipment',
  fields: {
    Type: { const: 'SmartmeterMain', required: true },
    Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
    DisplayName: TypeString({ required: true, hint: 'Component name in Log files' }),
    HardwareType: TypeString({ required: true, hint: 'Manufacturer of Smartmeter', enumRef: ['main', 'smartmeterHardwareToTypes'] }),
    HardwareModel: TypeString({ required: true, hint: 'Hardware model type of Smartmeter' }),
    // BEISPIEL für Versionsgate auf Feldebene: an die tatsächliche Versionshistorie
    // anpassen (oder entfernen), sinceVersion ist rein illustrativ.
    CurrentTransformerPrimaryCurrent: TypeNumberUnit({
      required: false,
      hint: 'Nominal transformer primary current for BLOKK/TERRA power Measurement with Beckhoff EL34x3 \n >= 0',
      min: 0,
      unit: 'A',
      availability: { sinceVersion: '0.0.7' }
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
