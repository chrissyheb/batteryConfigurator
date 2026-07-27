import React from 'react';
import { TypeString, TypeUuid, TypeIPv4, TypeNumber, TypeNumberUnit, EnumOption } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';
import { Collapsible } from '@/ui/Cards';
import { SelectField, NumberField } from '@/ui/Fields';
import { getVersionContext, isAvailable } from '@/core/versioning';
import { createByKey } from '@/spec/builder';

// Terra/Blokk-abhängige Wertelisten: jeder Wert ist nur für die angegebene(n)
// HardwareVariant(en) (siehe components/global/spec.ts -> hardwareVariants)
// gültig. spec/rules.ts prüft das zentral gegen den aktuellen VersionContext
// (siehe core/versioning.ts), statt hier Terra/Blokk hart zu verdrahten.
export const inverterTypes: EnumOption<string>[] = [
  { value: 'InverterTerra', availability: { hardwareVariants: ['Terra'] } },
  { value: 'InverterKaco', availability: { hardwareVariants: ['BlokkV3'] } }
];
export const batteryTypes: EnumOption<string>[] = [
  { value: 'BatteryTerra', availability: { hardwareVariants: ['Terra'] } },
  { value: 'BatteryPylontechM1xBms', availability: { hardwareVariants: ['BlokkV3'] } }
];
export const modbusTypes = ['(not available)', 'BatteryInverterModbus'] as const;
export const inverterHardwareTypes: EnumOption<string>[] = [
  { value: 'SofarTerra', availability: { hardwareVariants: ['Terra'] } },
  { value: 'Kaco', availability: { hardwareVariants: ['BlokkV3'] } }
];
export const batteryHardwareTypes: EnumOption<string>[] = [
  { value: 'SofarTerra', availability: { hardwareVariants: ['Terra'] } },
  { value: 'PylontechM1C', availability: { hardwareVariants: ['BlokkV3'] } }
];

export const BatteryInverterInverter: ComponentDefinition = {
  key: 'BatteryInverterInverter',
  category: 'main-equipment',
  fields: {
    group: {
      Type: TypeString({ required: true, hint: 'Inverter component type in TwinCAT project', enumRef: inverterTypes }),
      Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
      DisplayName: TypeString({ required: true, hint: 'Component name for TwinCAT log files' }),
      Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
      Config: {
        flatten: true,
        group: {
          InverterType: TypeString({ required: true, hint: 'Inverter hardware type', enum: inverterHardwareTypes }),
          NominalInverterPower: TypeNumberUnit({ required: true, hint: 'Nominal active power of installed Inverter', unit: 'kW', min: 1, max: 125 }),
          IpAddress: TypeIPv4({ required: true, hint: 'IP Address of Inverter' }),
          Port: TypeNumber({ required: true, hint: 'Modbus TCP port for communication with Inverter \n default: 502', min: 1, max: 65535, int: true })
        }
      }
    }
  },
  defaults: {
    Type: 'InverterTerra',
    Name: 'Inverter${n0}',
    DisplayName: 'Inverter ${n0}',
    Guid: '@uuid',
    Config: {
      InverterType: 'SofarTerra',
      NominalInverterPower: '125kW',
      IpAddress: '192.168.137.40',
      Port: 502
    }
  }
};

export const BatteryInverterBattery: ComponentDefinition = {
  key: 'BatteryInverterBattery',
  category: 'main-equipment',
  fields: {
    group: {
      Type: TypeString({ required: true, hint: 'Battery component type in TwinCAT project', enumRef: batteryTypes }),
      Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
      DisplayName: TypeString({ required: true, hint: 'Component name for TwinCAT log files' }),
      Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
      Config: {
        flatten: true,
        group: {
          BatteryType: TypeString({ required: true, hint: 'Battery hardware type', enum: batteryHardwareTypes }),
          BatteryCabinetCount: TypeNumber({ required: true, hint: 'Number of installed Battery cabinets \n [1..5]', min: 1, max: 5, int: true }),
          BatteryCabinetModuleCount: TypeNumber({ required: true, hint: 'Number of Battery modules within each installed cabinet \n [1..25]', min: 1, max: 25, int: true }),
          IpAddress: TypeIPv4({ required: true, hint: 'IP Address of Battery' }),
          Port: TypeNumber({ required: true, hint: 'Modbus TCP port for communication with Battery \n default: 502', min: 1, max: 65535, int: true })
        }
      }
    }
  },
  defaults: {
    Type: 'BatteryTerra',
    Name: 'Battery${n0}',
    DisplayName: 'Battery ${n0}',
    Guid: '@uuid',
    Config: {
      BatteryType: 'SofarTerra',
      BatteryCabinetCount: 1,
      BatteryCabinetModuleCount: 6,
      IpAddress: '192.168.137.40',
      Port: 502
    }
  }
};

// BEISPIEL für ein komponentenweites Verfügbarkeitsgate: Modbus ist laut
// bestehender Cross-Rule (spec/rules.ts) nur für HardwareVariant "Terra"
// relevant/erlaubt. Das ist jetzt hier an der Komponente selbst deklariert
// statt nur implizit in einer Regel verstreut zu sein.
export const BatteryInverterModbus: ComponentDefinition = {
  key: 'BatteryInverterModbus',
  category: 'main-equipment',
  availability: { hardwareVariants: ['Terra'] },
  fields: {
    optional: true,
    group: {
      Type: TypeString({ required: true, hint: 'Modbus component type in TwinCAT project', enumRef: modbusTypes }),
      Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
      DisplayName: TypeString({ required: true, hint: 'Component name for TwinCAT log files' }),
      Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
      Config: {
        flatten: true,
        group: {
          IpAddress: TypeIPv4({ required: true, hint: 'IP Address of Modbus component' }),
          Port: TypeNumber({ required: true, hint: 'Modbus TCP port for communication with Component \n default: 502', min: 1, max: 65535, int: true })
        }
      }
    }
  },
  defaults: {
    Type: 'BatteryInverterModbus',
    Name: 'Modbus${n0}',
    DisplayName: 'Modbus ${n0}',
    Guid: '@uuid',
    Config: {
      IpAddress: '192.168.137.40',
      Port: 502
    }
  }
};

// Eigene Konstante (statt inline im fields-Baum), damit fieldOverride.Index
// (s.u.) unten denselben Feld-Spec (hint/min/max/readOnly) als defLink
// wiederverwenden kann, ohne auf `BatteryInverter.fields.Index` verweisen zu
// müssen (das Objekt existiert zu dem Zeitpunkt noch nicht - Selbstbezug).
const batteryInverterIndexField = TypeNumber({ required: true, hint: 'Index of BatteryInverter component \n - automatically calculated -', min: 0, max: 14, int: true, readOnly: true });

export const BatteryInverter: ComponentDefinition = {
  key: 'BatteryInverter',
  category: 'main-equipment',
  fields: {
    Type: { const: 'BatteryInverter', required: true },
    Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
    Index: batteryInverterIndexField,
    Inverter: BatteryInverterInverter.fields,
    Battery: BatteryInverterBattery.fields,
    Modbus: BatteryInverterModbus.fields
  },
  defaults: {
    Type: 'BatteryInverter',
    Index: 0,
    Name: 'BatteryInverter${n0}',
    Inverter: BatteryInverterInverter.defaults,
    Battery: BatteryInverterBattery.defaults,
    Modbus: BatteryInverterModbus.defaults
  },
  // Modbus kann nicht über die deklarativen Feld-Hooks (readOnlyWhen/
  // onChangeEffect/enumFrom) abgebildet werden: das "Feld" legt/löscht eine
  // ganze Unterkomponente (Seiteneffekt über einen einzelnen Skalarwert
  // hinaus) und sein angezeigter "Wert" ist synthetisch (existiert die
  // Unterkomponente nicht, gibt es auch kein Modbus.Type zum Auslesen).
  // Deshalb der Escape-Hatch fieldOverride (siehe registry/types.ts) -
  // `ctx.renderFieldTree` wird injiziert statt core/form-renderer.tsx direkt zu
  // importieren (vermeidet einen Zyklus registry -> component spec -> form-renderer).
  fieldOverride: {
    // Index ist an den Listenindex gekoppelt (nicht an den gespeicherten Wert,
    // der bei jedem neuen Item mit 0 startet) - deshalb weiterhin eine
    // explizite `value`-Übersteuerung, jetzt als fieldOverride statt
    // hand-geschrieben in forms/MainSection.tsx. `path` ist
    // [...itemPath,'Index'] - der Listenindex steht daher an
    // `path[path.length-2]`.
    Index: (path, ctx) => React.createElement(NumberField, {
      path,
      defLink: batteryInverterIndexField,
      value: path[path.length - 2] as number
    }),
    Modbus: (path, ctx) =>
    {
      const idx = path[path.length - 2];
      const hasModbus = !!ctx.getOrCfg(path, undefined);
      const versionCtx = getVersionContext(ctx.cfg);
      if (!isAvailable(BatteryInverterModbus.availability, versionCtx, ctx.cfg, path)) { return null; }

      const { Type: _modbusType, Config: modbusConfig, ...modbusRest } = BatteryInverterModbus.fields.group;

      return React.createElement(Collapsible, {
        title: 'Modbus',
        className: 'card',
        path,
        errorPrefixSet: ctx.errorPrefixSet,
        children: [
          React.createElement(SelectField, {
            key: 'Type',
            path: [...path, 'Type'],
            defLink: BatteryInverterModbus.fields.group.Type,
            options: modbusTypes,
            onChange: (v: string) =>
            {
              if (v === modbusTypes[0]) { ctx.delFromCfg(path); }
              else { ctx.setInCfg(path, createByKey('BatteryInverterModbus', { n: idx as number })); }
            }
          }),
          hasModbus
            ? React.createElement(
                React.Fragment,
                { key: 'fields' },
                ctx.renderFieldTree(path, modbusRest, ctx),
                ctx.renderFieldTree([...path, 'Config'], modbusConfig.group, ctx)
              )
            : null
        ]
      });
    }
  }
};
