import { TypeString, TypeUuid, TypeIPv4, TypeNumber, TypeNumberUnit, TypeIndexString, IndexStringType, dependentEnumFields } from '@/core/field-types';
import type { ComponentDefinition, ValidationIssue } from '@/registry/types';

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

/**
 * Felder, die JEDE Smartmeter-Variante teilt (Ems-Listen-Item UND
 * Main-Singleton, siehe components/smartmeter-main/spec.ts): Type(const)/
 * Name/HardwareType+HardwareModel. `hardwareMap` erlaubt
 * SmartmeterMain, nur eine Teilmenge der hier verfügbaren Hardware-Typen
 * anzubieten. Guid/Config/CurrentTransformerPrimaryCurrent bewusst NICHT hier
 * drin - deren Reihenfolge/Vorhandensein unterscheidet sich leicht zwischen
 * den beiden Verwendern, siehe jeweils dort.
 */
export function smartmeterCommonFields(typeConst: string, hardwareMap: Record<string, readonly string[]>)
{
  return {
    Type: { const: typeConst, required: true },
    Name: TypeString({ required: true, hint: 'Component name (used in TwinCAT project & log files)' }),
    ...dependentEnumFields(hardwareMap, {
      primaryKey: 'HardwareType',
      primaryHint: 'Manufacturer of Smartmeter',
      secondaryKey: 'HardwareModel',
      secondaryHint: 'Hardware model type of Smartmeter'
    })
  };
}

/** Liest ein Geschwisterfeld relativ zum übergebenen Feld-Pfad (z.B. für
 *  `path` = [...,'CurrentTransformerPrimaryCurrent'] das `HardwareType` am
 *  selben Element) - bewusst hier lokal statt eines allgemeinen App-weiten
 *  Pfad-Utilities importiert, damit diese Spec-Datei keine Abhängigkeit zu
 *  app/store.ts bekommt. */
function siblingValue(cfg: any, path: Array<string | number> | undefined, siblingKey: string): any
{
  if (!path || path.length === 0) { return undefined; }
  const siblingPath = [...path.slice(0, -1), siblingKey];
  let cur: any = cfg;
  for (const key of siblingPath)
  {
    if (cur == null) { return undefined; }
    cur = cur[key as any];
  }
  return cur;
}

/**
 * CurrentTransformerPrimaryCurrent ist ein Beckhoff-spezifischer Parameter
 * (Stromwandler-Kalibrierung für das EL34x3-Terminal) - hängt am HardwareType
 * 'Beckhoff', nicht an "ist SmartmeterMain". Gilt daher potenziell für JEDE
 * Smartmeter-Instanz mit HardwareType Beckhoff (Ems-Liste UND Main-Singleton),
 * deshalb hier eine gemeinsame Feld-Definition statt an SmartmeterMain gebunden
 * (siehe components/smartmeter-main/spec.ts, wo dasselbe Feld wiederverwendet wird).
 */
export const currentTransformerPrimaryCurrentField = TypeNumberUnit({
  required: false,
  hint: 'Nominal transformer primary current for BLOKK/TERRA power Measurement with Beckhoff EL34x3 \n >= 0',
  min: 0,
  unit: 'A',
  availability: {
    sinceVersion: '0.0.7',
    // `path` fehlt beim Schema-Bau (core/schema-builder.ts baut EINE Form für
    // alle Listen-Items) - in dem Fall bewusst konservativ "verfügbar"
    // (unverändert zur bisherigen, nur versionsabhängigen Prüfung), damit sich
    // am Zod-Schema nichts ändert. Die UI (core/form-renderer.tsx) hat immer
    // einen echten Instanz-Pfad und blendet das Feld dort korrekt nur für
    // HardwareType 'Beckhoff' ein.
    when: (cfg, path) => (path ? siblingValue(cfg, path, 'HardwareType') === 'Beckhoff' : true)
  }
});

/**
 * Gilt für jede Smartmeter-Instanz (Ems-Liste UND Main), die
 * currentTransformerPrimaryCurrentField verwendet: bei HardwareType Beckhoff
 * (Modell El34x3) muss ein Stromwandler-Primärstrom > 0A hinterlegt sein.
 */
export function validateCurrentTransformer(instance: any): ValidationIssue[]
{
  const hwType = instance?.HardwareType ?? '';
  const hwModel = instance?.HardwareModel ?? '';
  if (hwType === 'Beckhoff' && hwModel === 'El34x3')
  {
    const current = instance?.CurrentTransformerPrimaryCurrent ?? '';
    if (current === '' || current === '0A' || current === '0.0A')
    {
      return [{ message: 'CurrentTransformerPrimaryCurrent must be > 0A', path: ['CurrentTransformerPrimaryCurrent'] }];
    }
  }
  return [];
}

export const Smartmeter: ComponentDefinition = {
  key: 'Smartmeter',
  category: 'ems-equipment',
  // Lokale Regel: HardwareType/HardwareModel-Abhängigkeit betrifft ausschließlich
  // die Felder dieser Instanz - gehört daher hier hin statt zentral in spec/rules.ts.
  // CurrentTransformerPrimaryCurrent-Prüfung ist mit SmartmeterMain geteilt
  // (siehe validateCurrentTransformer oben).
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

    return validateCurrentTransformer(instance);
  },
  fields: {
    ...smartmeterCommonFields('Smartmeter', smartmeterHardwareToTypes),
    CurrentTransformerPrimaryCurrent: currentTransformerPrimaryCurrentField,
    Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
    // `flatten: true`: keine eigene Karte für Config - liegt flach in der
    // umgebenden Smartmeter-Karte (siehe core/form-renderer.tsx).
    Config: {
      flatten: true,
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
    Name: 'Smartmeter ${n}',
    HardwareType: 'Phoenix',
    HardwareModel: '@firstModelOf(HardwareType)',
    CurrentTransformerPrimaryCurrent: '0A',
    Guid: '@uuid',
    Config: {
      Usecase: [0, 'Undefined'],
      PowerSign: [0, 'Positive'],
      IpAddress: '192.168.100.5',
      Port: 502
    }
  }
};
