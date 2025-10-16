
import { PathType } from './builder';
import { enums, IndexStringType } from './catalog';

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
      add({ message: 'HardwareType required', path: ['Units','Ems','Equipment','Smartmeter', idx, 'HardwareType'] });
      return;
    }

    const allowed = (enums.ems.smartmeterHardwareToTypes as any)[type] as readonly string[] | undefined;

    if (!Array.isArray(allowed) || allowed.length === 0)
    {
      add({ message: 'Invalid HardwareType', path: ['Units','Ems','Equipment','Smartmeter', idx, 'HardwareType'] });
      return;
    }

    if (!model)
    {
      add({ message: 'HardwareModel required', path: ['Units','Ems','Equipment','Smartmeter', idx, 'HardwareModel'] });
      return;
    }

    if (!allowed.includes(model))
    {
      add({ message: 'HardwareModel not valid for HardwareType', path: ['Units','Ems','Equipment','Smartmeter', idx, 'HardwareModel'] });
    }
  });
  

  // Slave IP check
  const emsSlaves = config?.Units?.Ems?.Equipment?.RemoteSystems ?? [];
  const countSystemIPs = new Map<string, number>();
  const ipLocal = config?.Units?.Ems?.Equipment?.LocalSystem?.Config?.IpAddress ?? '';
  if (ipLocal !== '') {
    countSystemIPs.set(ipLocal, 1);
  }
  if (emsSlaves.length > 0) { 
    config.Units.Ems.Equipment.RemoteSystems.map((v:any) => {
      if (v.Config?.IpAddress) { countSystemIPs.set(v.Config.IpAddress, (countSystemIPs.get(v.Config.IpAddress) || 0) + 1); }
    });
    if ((countSystemIPs.get(ipLocal) || 0) > 1) {
      add({ message: 'Slave IP Address duplicate', path: ['Units','Ems','Equipment','LocalSystem','Config','IpAddress'] });
    }
    emsSlaves.map((e: any, idx: number) =>
    {
      const ip = e?.Config?.IpAddress ?? '';
      if ((countSystemIPs.get(ip) || 0) > 1) 
      {
        add({ message: 'Slave IP Address duplicate', path: ['Units','Ems','Equipment','RemoteSystems',idx,'Config','IpAddress'] });
      }
    });
  }

  // Main/HV Terra/Blokk cross rules
  const hv = config?.Global?.ModularPlc?.HardwareVariant;
  const main = config?.Units?.Main;
  if (!main) { return; }
  const eqBI = main.Equipment.BatteryInverter || [];
  const biList = eqBI.filter((e: any) => { return e?.Type === 'BatteryInverter'; });

  const isTerraHV = typeof hv === 'string' && /terra/i.test(hv);
  main.Type = isTerraHV ? 'Terra' : 'Blokk';
//  const expectedMainType = isTerraHV ? 'Terra' : 'Blokk';
//  if (main.Type !== expectedMainType)
//  {
//    add({ message: `Main.Type must be ${expectedMainType} (HardwareVariant=${hv})`, path: ['Units','Main','Type'] });
//  }  

  const countBatteryInverterIPs = new Map<string, number>();
  const countModbusIPs = new Map<string, number>();


  biList.forEach((bi: any, idx: number) =>
  {
    const inv = bi?.Inverter?.Type;
    const invType = bi?.Inverter?.Config?.InverterType;
    const bat = bi?.Battery?.Type;
    const batType = bi?.Battery?.Config?.BatteryType;
    const hasModbus = !!bi?.Modbus;
    
    const invIp:string|undefined = bi?.Inverter?.Config?.IpAddress ?? undefined;
    const batIp:string|undefined = bi?.Battery?.Config?.IpAddress ?? undefined;
    const modIp:string|undefined = bi?.Modbus?.Config?.IpAddress ?? undefined;

    if (isTerraHV)
    {
      if (inv !== 'TerraInverter')
      {
        add({ message: 'Terra configured ⇒ TerraInverter required', path: ['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Type'] });
      }
      if (invType !== 'SofarTerra')
      {
        add({ message: 'TerraInverter configured ⇒ InverterType SofarTerra required', path: ['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Config','InverterType'] });
      }
      if (bat !== 'TerraBattery')
      {
        add({ message: 'Terra configured ⇒ TerraBattery required', path: ['Units','Main','Equipment','BatteryInverter',idx,'Battery','Type'] });
      }
      if (batType !== 'SofarTerra')
      {
        add({ message: 'TerraBattery configured ⇒ BatteryType SofarTerra required', path: ['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','BatteryType'] });
      }
      if (!hasModbus)
      {
        add({ message: 'Terra configured ⇒ Modbus component required', path: ['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Type'] });
      }
      
      if (modIp !== invIp)
      {
        add({ message: 'Terra configured ⇒ Modbus IP must match Inverter IP', path: ['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Config','IpAddress'] });
      }
      if (modIp !== batIp)
      {
        add({ message: 'Terra configured ⇒ Modbus IP must match Battery IP', path: ['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','IpAddress'] });
      }
      if (modIp) { countModbusIPs.set(modIp, (countModbusIPs.get(modIp) || 0) + 1); }
    }
    else
    {
      if (inv === 'TerraInverter')
      {
        add({ message: 'Terra not configured ⇒ TerraInverter not allowed', path: ['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Type'] });
      }
      if (invType === 'SofarTerra')
      {
        add({ message: 'Terra not configured ⇒ InverterType SofarTerra not allowed', path: ['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Config','InverterType'] });
      }
      if (bat === 'TerraBattery')
      {
        add({ message: 'Terra not configured ⇒ TerraBattery not allowed', path: ['Units','Main','Equipment','BatteryInverter',idx,'Battery','Type'] });
      }
      if (batType === 'SofarTerra')
      {
        add({ message: 'Terra not configured ⇒ BatteryType SofarTerra not allowed', path: ['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','BatteryType'] });
      }
      if (hasModbus)
      {
        add({ message: 'Terra not configured ⇒ Modbus not allowed', path: ['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Type'] });
      }
      
      if (invIp) { countBatteryInverterIPs.set(invIp, (countBatteryInverterIPs.get(invIp) || 0) + 1); }
      if (batIp) { countBatteryInverterIPs.set(batIp, (countBatteryInverterIPs.get(batIp) || 0) + 1); }
    }
  });

  config.Units.Main.Equipment.BatteryInverter.map((v:any, idx:number) => 
  {
    if (isTerraHV) { 
      if ((countModbusIPs.get(v.Modbus?.Config?.IpAddress ?? '') ?? 0) > 1) {
        add({ message: 'Modbus IP Address duplicate', path: ['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Config','IpAddress'] });
      }
    }
    else 
    {
      if ((countBatteryInverterIPs.get(v.Inverter?.Config?.IpAddress ?? '') ?? 0) > 1) {
        add({ message: 'Battery/Inverter IP Address duplicate', path: ['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Config','IpAddress'] });
      }
      if ((countBatteryInverterIPs.get(v.Battery?.Config?.IpAddress ?? '') ?? 0) > 1) {
        add({ message: 'Battery/Inverter IP Address duplicate', path: ['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','IpAddress'] });
      }
    }
  });
}

export function applyCardinality(config: any, add: (i: Issue) => void): void
{
  const emsEq = config?.Units?.Ems?.Equipment ?? {};
  const smCount = emsEq.Smartmeter?.length ?? emsEq.emsEqSmartmeter?.length ?? 0;
  const localCount = emsEq.LocalSystem?.length ?? emsEq.emsEqSlaveLocalUM?.length ?? 0;
  const remoteCount = emsEq.RemoteSystems?.length ?? emsEq.emsEqSlaveRemoteUM?.length ?? 0;
  if (localCount > 1)
  {
    add({ message: 'SlaveLocalUM required exactly once', path: ['Units','Ems','Equipment','LocalSystem','Name'] });
  }
  if (smCount > cardinality.ems.smartmeterMax)
  {
    add({ message: `Smartmeter max. ${cardinality.ems.smartmeterMax}`, path: ['Units','Ems','Equipment','Smartmeter',cardinality.ems.smartmeterMax,'Name'] });
  }
  if (remoteCount > cardinality.ems.slaveRemoteMax)
  {
    add({ message: `Max. ${cardinality.ems.slaveRemoteMax} RemoteSystems permitted`, path: ['Units','Ems','Equipment','RemoteSystems',cardinality.ems.slaveRemoteMax,'Name'] });
  }

  const mainEq = config?.Units?.Main?.Equipment ?? {};
  const biCount = mainEq.BatteryInverter?.filter((e: any) => { return e?.Type === 'BatteryInverter'; }).length;
  if (biCount < cardinality.main.batteryInverterMin)
  {
    //add({ message: 'At least one BatteryInverter required', path: ['Units','Main','Equipment','BatteryInverter'] });
  }
  
}
