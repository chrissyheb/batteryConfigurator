
import { PathType } from '@/spec/builder';
import { components } from '@/registry';
import { getVersionContext, isAvailable, type VersionContext } from '@/core/versioning';
import { findEnumOptionAvailability, type EnumOption, type IndexStringType } from '@/core/field-types';
import { inverterTypes, inverterHardwareTypes, batteryTypes, batteryHardwareTypes } from '@/components/battery-inverter/spec';
import { controlCabinetTypes } from '@/components/main-config/spec';

/**
 * Prüft, ob `value` laut seiner Availability-Angabe in `list` (siehe
 * components/battery-inverter/spec.ts bzw. components/main-config/spec.ts)
 * für den aktuellen VersionContext zulässig ist. Ersetzt die vormals hier
 * hart verdrahteten Terra/Blokk-if/else-Vergleiche durch einen einzigen,
 * generischen Check pro Wert - funktioniert für beliebige HardwareVariants,
 * nicht nur für die binäre Terra/Blokk-Unterscheidung.
 */
function checkHardwareVariantValue<T>(list: readonly EnumOption<T>[], value: T, path: PathType, label: string, add: (i: Issue) => void, versionCtx: VersionContext, config: any): void
{
  const avail = findEnumOptionAvailability(list, value);
  if (avail && !isAvailable(avail, versionCtx, config))
  {
    const displayValue = Array.isArray(value) ? (value as any)[1] : value;
    add({ message: `${label} '${displayValue}' requires HardwareVariant ${JSON.stringify(avail.hardwareVariants ?? [])} (current: '${versionCtx.hardwareVariant}')`, path });
  }
}

export const cardinality = {
  ems: { smartmeterMax: 10, slaveRemoteMax: 9 },
  main: { batteryInverterMin: 1 }
} as const;

export type Issue = { message: string; path: PathType; };

export type CrossErrorMarker = [number, string, boolean];

export function applyCrossRules(config: any, add: (i: Issue) => void): void
{
  // Validate Smartmeter HardwareType/HardwareModel dependency
  const emsEq = config?.Units?.Ems?.Equipment?.Smartmeter ?? [];
  emsEq.forEach((e: any, idx: number) =>
  {
    if (e?.Type !== 'Smartmeter')
    {
      return;
    }

    const localIssues = components.Smartmeter.validate?.(e) ?? [];
    localIssues.forEach((li) => add({ message: li.message, path: ['Units', 'Ems', 'Equipment', 'Smartmeter', idx, ...li.path] }));
  });


  // Slave IP check
  const emsSlaves = config?.Units?.Ems?.Equipment?.LocalRemoteSystems ?? [];
  const countSystemIPs = new Map<string, number>();
  if (emsSlaves.length > 0) {
    config.Units.Ems.Equipment.LocalRemoteSystems.map((v: any) => {
      if (v.Config?.IpAddress) { countSystemIPs.set(v.Config.IpAddress, (countSystemIPs.get(v.Config.IpAddress) || 0) + 1); }
    });
    emsSlaves.map((e: any, idx: number) =>
    {
      const ip = e?.Config?.IpAddress ?? '';
      if ((countSystemIPs.get(ip) || 0) > 1)
      {
        add({ message: 'Slave IP Address duplicate', path: ['Units', 'Ems', 'Equipment', 'LocalRemoteSystems', idx, 'Config', 'IpAddress'] });
      }
    });
  }

  // Main smartmeter Transformer current for Beckhoff smartmeters
  const smMain = config?.Units?.Main?.Equipment?.SmartmeterMain ?? {};
  const smMainIssues = components.SmartmeterMain.validate?.(smMain) ?? [];
  smMainIssues.forEach((li) => add({ message: li.message, path: ['Units', 'Main', 'Equipment', 'SmartmeterMain', ...li.path] }));

  // Main/HV cross rules
  const main = config?.Units?.Main;
  if (!main) { return; }

  const versionCtx = getVersionContext(config);

  // "Noch nicht konfiguriert" ist eine lokale Regel der Komponente selbst
  // (siehe components/main-config/spec.ts), unabhängig vom HardwareVariant.
  const mainConfig = config?.Units?.Main?.Config ?? {};
  const mainConfigIssues = components.MainConfig.validate?.(mainConfig) ?? [];
  mainConfigIssues.forEach((li) => add({ message: li.message, path: ['Units', 'Main', 'Config', ...li.path] }));

  // Ist der gewählte MainControlCabinetType für den aktuellen HardwareVariant zulässig?
  const MainControlCabinetType: IndexStringType = mainConfig?.MainControlCabinetType ?? [0, 'Undefined'];
  checkHardwareVariantValue(controlCabinetTypes, MainControlCabinetType, ['Units', 'Main', 'Config', 'MainControlCabinetType'], 'MainControlCabinetType', add, versionCtx, config);

  const eqBI = main.Equipment.BatteryInverter || [];
  const biList = eqBI.filter((e: any) => { return e?.Type === 'BatteryInverter'; });
  const countBatteryInverterIPs = new Map<string, number>();
  const countModbusIPs = new Map<string, number>();
  const countNames = new Map<string, number>();

  // Modbus ist nur verfügbar, wenn die Komponente selbst (siehe
  // components/battery-inverter/spec.ts -> BatteryInverterModbus.availability)
  // für den aktuellen VersionContext freigeschaltet ist.
  const modbusAvailable = isAvailable(components.BatteryInverterModbus.availability, versionCtx, config);

  biList.forEach((bi: any, idx: number) =>
  {
    const inv = bi?.Inverter?.Type;
    const invType = bi?.Inverter?.Config?.InverterType;
    const bat = bi?.Battery?.Type;
    const batType = bi?.Battery?.Config?.BatteryType;
    const hasModbus = !!bi?.Modbus;

    const batInvName: string | undefined = bi?.Name ?? undefined;
    const invName: string | undefined = bi?.Inverter?.Name ?? undefined;
    const batName: string | undefined = bi?.Battery?.Name ?? undefined;
    const modName: string | undefined = bi?.Modbus?.Name ?? undefined;

    const invIp: string | undefined = bi?.Inverter?.Config?.IpAddress ?? undefined;
    const batIp: string | undefined = bi?.Battery?.Config?.IpAddress ?? undefined;
    const modIp: string | undefined = bi?.Modbus?.Config?.IpAddress ?? undefined;

    if (batInvName) { countNames.set(batInvName, (countNames.get(batInvName) || 0) + 1); }
    if (batName) { countNames.set(batName, (countNames.get(batName) || 0) + 1); }
    if (invName) { countNames.set(invName, (countNames.get(invName) || 0) + 1); }

    // Ist Inverter-/Battery-Typ (jeweils Komponenten-Typ und Hardware-Typ) für
    // den aktuellen HardwareVariant zulässig? Ersetzt die vormals hier vier Mal
    // duplizierte Terra/Blokk-if/else-Prüfung durch einen generischen Check pro Wert.
    checkHardwareVariantValue(inverterTypes, inv, ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Inverter', 'Type'], 'Inverter Type', add, versionCtx, config);
    checkHardwareVariantValue(inverterHardwareTypes, invType, ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Inverter', 'Config', 'InverterType'], 'Inverter hardware type', add, versionCtx, config);
    checkHardwareVariantValue(batteryTypes, bat, ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Battery', 'Type'], 'Battery Type', add, versionCtx, config);
    checkHardwareVariantValue(batteryHardwareTypes, batType, ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Battery', 'Config', 'BatteryType'], 'Battery hardware type', add, versionCtx, config);

    // Modbus-Vorhandensein und IP-Abgleich richten sich danach, ob die Modbus-
    // Komponente selbst für den aktuellen HardwareVariant verfügbar ist (siehe
    // components/battery-inverter/spec.ts -> BatteryInverterModbus.availability),
    // nicht mehr nach einem separat hier verdrahteten Terra-Vergleich.
    if (modbusAvailable)
    {
      if (!hasModbus)
      {
        add({ message: 'Modbus component required for current HardwareVariant', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Modbus', 'Type'] });
      }

      if (modIp !== invIp)
      {
        add({ message: 'Modbus IP must match Inverter IP', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Inverter', 'Config', 'IpAddress'] });
      }
      if (modIp !== batIp)
      {
        add({ message: 'Modbus IP must match Battery IP', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Battery', 'Config', 'IpAddress'] });
      }
      if (modIp) { countModbusIPs.set(modIp, (countModbusIPs.get(modIp) || 0) + 1); }
      if (modName) { countNames.set(modName, (countNames.get(modName) || 0) + 1); }
    }
    else
    {
      if (hasModbus)
      {
        add({ message: 'Modbus not allowed for current HardwareVariant', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Modbus', 'Type'] });
      }

      if (invIp) { countBatteryInverterIPs.set(invIp, (countBatteryInverterIPs.get(invIp) || 0) + 1); }
      if (batIp) { countBatteryInverterIPs.set(batIp, (countBatteryInverterIPs.get(batIp) || 0) + 1); }
    }
  });

  config.Units?.Main?.Equipment?.BatteryInverter?.map((v: any, idx: number) =>
  {
    if ((countNames.get(v.Name ?? '') ?? 0) > 1) {
      add({ message: 'Component name duplicate', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Name'] });
    }
    if ((countNames.get(v.Battery?.Name ?? '') ?? 0) > 1) {
      add({ message: 'Component name duplicate', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Battery', 'Name'] });
    }
    if ((countNames.get(v.Inverter?.Name ?? '') ?? 0) > 1) {
      add({ message: 'Component name duplicate', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Inverter', 'Name'] });
    }
    if (modbusAvailable) {
      if ((countModbusIPs.get(v.Modbus?.Config?.IpAddress ?? '') ?? 0) > 1) {
        add({ message: 'Modbus IP Address duplicate', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Modbus', 'Config', 'IpAddress'] });
      }
      if ((countNames.get(v.Modbus?.Name ?? '') ?? 0) > 1) {
        add({ message: 'Component name duplicate', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Modbus', 'Name'] });
      }
    }
    else
    {
      if ((countBatteryInverterIPs.get(v.Inverter?.Config?.IpAddress ?? '') ?? 0) > 1) {
        add({ message: 'Battery/Inverter IP Address duplicate', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Inverter', 'Config', 'IpAddress'] });
      }
      if ((countBatteryInverterIPs.get(v.Battery?.Config?.IpAddress ?? '') ?? 0) > 1) {
        add({ message: 'Battery/Inverter IP Address duplicate', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Battery', 'Config', 'IpAddress'] });
      }
    }
  });
}

export function applyCardinality(config: any, add: (i: Issue) => void): void
{
  const emsConfig = config?.Units?.Ems?.Config ?? {};
  const emsConfigIssues = components.EmsConfig.validate?.(emsConfig) ?? [];
  emsConfigIssues.forEach((li) => add({ message: li.message, path: ['Units', 'Ems', 'Config', ...li.path] }));

  const emsEq = config?.Units?.Ems?.Equipment ?? {};
  const smCount = emsEq.Smartmeter?.length ?? emsEq.emsEqSmartmeter?.length ?? 0;
  if (smCount > cardinality.ems.smartmeterMax)
  {
    add({ message: `Smartmeter max. ${cardinality.ems.smartmeterMax}`, path: ['Units', 'Ems', 'Equipment', 'Smartmeter', cardinality.ems.smartmeterMax, 'Name'] });
  }
  const localCount = emsEq.LocalRemoteSystems?.filter((e: any) => { return e?.Type === 'SlaveLocalUM'; }).length;
  const remoteCount = emsEq.LocalRemoteSystems?.filter((e: any) => { return e?.Type === 'SlaveRemoteUM'; }).length;
  if (localCount > 1)
  {
    add({ message: 'SlaveLocalUM required exactly once', path: ['Units', 'Ems', 'Equipment', 'LocalSystem', 'Name'] });
  }
  if (remoteCount > cardinality.ems.slaveRemoteMax)
  {
    add({ message: `Max. ${cardinality.ems.slaveRemoteMax} RemoteSystems permitted`, path: ['Units', 'Ems', 'Equipment', 'RemoteSystems', cardinality.ems.slaveRemoteMax, 'Name'] });
  }

  const mainEq = config?.Units?.Main?.Equipment ?? {};
  const biCount = mainEq.BatteryInverter?.filter((e: any) => { return e?.Type === 'BatteryInverter'; }).length;
  if (biCount < cardinality.main.batteryInverterMin)
  {
    //add({ message: 'At least one BatteryInverter required', path: ['Units','Main','Equipment','BatteryInverter'] });
  }

}
