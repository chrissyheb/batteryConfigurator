
import { PathType, getEmsRippleControlDiContactTypes, getMainControlCabinetTypes, getEmsSmartmeterModels } from '@/spec/builder';
import type { IndexStringType } from '@/core/field-types';
import { components } from '@/registry';
import { getVersionContext, isAvailable } from '@/core/versioning';

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

    const type = e?.HardwareType;
    const model = e?.HardwareModel;

    if (!type)
    {
      add({ message: 'HardwareType required', path: ['Units', 'Ems', 'Equipment', 'Smartmeter', idx, 'HardwareType'] });
      return;
    }

    const allowed = getEmsSmartmeterModels(type);

    if (allowed.length === 0)
    {
      add({ message: 'Invalid HardwareType', path: ['Units', 'Ems', 'Equipment', 'Smartmeter', idx, 'HardwareType'] });
      return;
    }

    if (!model)
    {
      add({ message: 'HardwareModel required', path: ['Units', 'Ems', 'Equipment', 'Smartmeter', idx, 'HardwareModel'] });
      return;
    }

    if (!allowed.includes(model))
    {
      add({ message: 'HardwareModel not valid for HardwareType', path: ['Units', 'Ems', 'Equipment', 'Smartmeter', idx, 'HardwareModel'] });
    }
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
  const smMainHwType = smMain?.HardwareType ?? '';
  const smMainHwModel = smMain?.HardwareModel ?? '';
  if (smMainHwType === 'Beckhoff' && smMainHwModel === 'El34x3')
  {
    const current = smMain?.CurrentTransformerPrimaryCurrent ?? '';
    if (current === '' || current === '0A' || current === '0.0A')
    {
      add({ message: 'SmartmeterMain CurrentTransformerPrimaryCurrent must be > 0A', path: ['Units', 'Main', 'Equipment', 'SmartmeterMain', 'CurrentTransformerPrimaryCurrent'] });
    }
  }

  // Main/HV Terra/Blokk cross rules
  const hv = config?.Global?.ModularPlc?.HardwareVariant;
  const main = config?.Units?.Main;
  if (!main) { return; }

  const versionCtx = getVersionContext(config);
  const isTerraHV = typeof hv === 'string' && /terra/i.test(hv);

  const MainControlCabinetType = config?.Units?.Main?.Config?.MainControlCabinetType ?? getMainControlCabinetTypes()[0];
  if (isTerraHV) {
    const isValidTerraSystem = getMainControlCabinetTypes().some(
      ([id, name]) =>
        id === MainControlCabinetType[0] &&
        name.includes('Terra')
    );
    if (!isValidTerraSystem) {
      add({ message: 'Terra configured ⇒ MainControlCabinetType must be Terra', path: ['Units', 'Main', 'Config', 'MainControlCabinetType'] });
    }
  } else {
    const isValidBlokkSystem = getMainControlCabinetTypes().some(
      ([id, name]) =>
        id === MainControlCabinetType[0] &&
        name.includes('Blokk')
    );
    if (!isValidBlokkSystem) {
      add({ message: 'Blokk configured ⇒ MainControlCabinetType must be Blokk', path: ['Units', 'Main', 'Config', 'MainControlCabinetType'] });
    }
  }

  const eqBI = main.Equipment.BatteryInverter || [];
  const biList = eqBI.filter((e: any) => { return e?.Type === 'BatteryInverter'; });
  const countBatteryInverterIPs = new Map<string, number>();
  const countModbusIPs = new Map<string, number>();
  const countNames = new Map<string, number>();

  // Modbus ist nur verfügbar, wenn die Komponente selbst (siehe
  // components/battery-inverter/spec.ts -> BatteryInverterModbus.availability)
  // für den aktuellen VersionContext freigeschaltet ist. Aktuell deckungsgleich
  // mit "isTerraHV", aber zentral an der Komponente gepflegt statt hier verstreut.
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

    if (isTerraHV)
    {
      if (inv !== 'InverterTerra')
      {
        add({ message: 'Terra configured ⇒ InverterTerra required', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Inverter', 'Type'] });
      }
      if (invType !== 'SofarTerra')
      {
        add({ message: 'InverterTerra configured ⇒ InverterType SofarTerra required', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Inverter', 'Config', 'InverterType'] });
      }
      if (bat !== 'BatteryTerra')
      {
        add({ message: 'Terra configured ⇒ BatteryTerra required', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Battery', 'Type'] });
      }
      if (batType !== 'SofarTerra')
      {
        add({ message: 'BatteryTerra configured ⇒ BatteryType SofarTerra required', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Battery', 'Config', 'BatteryType'] });
      }
      if (modbusAvailable && !hasModbus)
      {
        add({ message: 'Terra configured ⇒ Modbus component required', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Modbus', 'Type'] });
      }

      if (modIp !== invIp)
      {
        add({ message: 'Terra configured ⇒ Modbus IP must match Inverter IP', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Inverter', 'Config', 'IpAddress'] });
      }
      if (modIp !== batIp)
      {
        add({ message: 'Terra configured ⇒ Modbus IP must match Battery IP', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Battery', 'Config', 'IpAddress'] });
      }
      if (modIp) { countModbusIPs.set(modIp, (countModbusIPs.get(modIp) || 0) + 1); }
      if (modName) { countNames.set(modName, (countNames.get(modName) || 0) + 1); }
    }
    else
    {
      if (inv === 'InverterTerra')
      {
        add({ message: 'Terra not configured ⇒ InverterTerra not allowed', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Inverter', 'Type'] });
      }
      if (invType === 'SofarTerra')
      {
        add({ message: 'Terra not configured ⇒ InverterType SofarTerra not allowed', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Inverter', 'Config', 'InverterType'] });
      }
      if (bat === 'BatteryTerra')
      {
        add({ message: 'Terra not configured ⇒ BatteryTerra not allowed', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Battery', 'Type'] });
      }
      if (batType === 'SofarTerra')
      {
        add({ message: 'Terra not configured ⇒ BatteryType SofarTerra not allowed', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Battery', 'Config', 'BatteryType'] });
      }
      if (!modbusAvailable && hasModbus)
      {
        add({ message: 'Terra not configured ⇒ Modbus not allowed', path: ['Units', 'Main', 'Equipment', 'BatteryInverter', idx, 'Modbus', 'Type'] });
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
    if (isTerraHV) {
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
  const emsRippleControlDiContactType: IndexStringType = config?.Units?.Ems?.Config?.RippleControl?.DiContactType ?? getEmsRippleControlDiContactTypes()[0];
  if (emsRippleControlDiContactType[0] === 0) {
    add({ message: 'Warning: Ripple Control not configured / disabled', path: ['Units', 'Ems', 'Config', 'RippleControl', 'DiContactType'] });
  }
  else if (emsRippleControlDiContactType[0] === 4) {
    add({ message: 'Warning: Ripple Control is not wirebreak-proof', path: ['Units', 'Ems', 'Config', 'RippleControl', 'DiContactType'] });
  }

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
