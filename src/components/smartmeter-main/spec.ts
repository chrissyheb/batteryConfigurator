import { TypeUuid } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';
import {
  smartmeterHardwareToTypes as emsSmartmeterHardwareToTypes,
  smartmeterCommonFields,
  currentTransformerPrimaryCurrentField,
  validateCurrentTransformer
} from '@/components/smartmeter-ems/spec';

// SmartmeterMain kann nur eine Teilmenge der Ems-Smartmeter-Hardware nutzen
// (kein Modbus-Netzwerkgerät, sondern die eingebaute PLC-Messung) - als
// abgeleitete Teilmenge der Ems-Map (statt eigenständig dupliziert), damit
// beide zwangsläufig synchron bleiben, falls sich z.B. die Beckhoff-Modelle
// dort mal ändern.
const mainHardwareKeys = ['Virtual', 'Beckhoff'] as const;
export const smartmeterHardwareToTypes = Object.fromEntries(
  mainHardwareKeys.map((k) => [k, emsSmartmeterHardwareToTypes[k]])
) as Pick<typeof emsSmartmeterHardwareToTypes, typeof mainHardwareKeys[number]>;

export const SmartmeterMain: ComponentDefinition = {
  key: 'SmartmeterMain',
  category: 'main-equipment',
  // CurrentTransformerPrimaryCurrent ist kein SmartmeterMain-spezifisches Feld
  // (hängt an HardwareType Beckhoff, siehe components/smartmeter-ems/spec.ts),
  // deshalb hier dieselbe geteilte Prüfung wie bei Smartmeter (ems).
  validate: validateCurrentTransformer,
  fields: {
    ...smartmeterCommonFields('SmartmeterMain', smartmeterHardwareToTypes),
    CurrentTransformerPrimaryCurrent: currentTransformerPrimaryCurrentField,
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
