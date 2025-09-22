
import { enums } from './catalog';

export const cardinality = {
  ems: { smartmeterMax: 10, slaveLocalEq: 1, slaveRemoteMax: 9 },
  main: { smartmeterMainEq: 1, batteryInverterMin: 1 }
} as const;

export type Issue = { message: string; path: (string | number)[]; };

export function applyCrossRules(config: any, add: (i: Issue) => void): void
{
  // Validate Smartmeter HardwareType/HardwareModel dependency
  const emsEq = config?.Units?.Ems?.Equipment ?? [];
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
      add({ message: 'HardwareType erforderlich', path: ['Units','Ems','Equipment', idx, 'HardwareType'] });
      return;
    }

    const allowed = (enums.ems.smartmeterHardwareToTypes as any)[type] as readonly string[] | undefined;

    if (!Array.isArray(allowed) || allowed.length === 0)
    {
      add({ message: 'Unbekannter HardwareType', path: ['Units','Ems','Equipment', idx, 'HardwareType'] });
      return;
    }

    if (!model)
    {
      add({ message: 'HardwareModel erforderlich', path: ['Units','Ems','Equipment', idx, 'HardwareModel'] });
      return;
    }

    if (!allowed.includes(model))
    {
      add({ message: 'HardwareModel passt nicht zu HardwareType', path: ['Units','Ems','Equipment', idx, 'HardwareModel'] });
    }
  });

  // Main/HV Terra/Blokk cross rules
  const hv = config?.ModularPlc?.HardwareVariant;
  const main = config?.Units?.Main;
  if (!main) { return; }
  const eq = main.Equipment || [];
  const biList = eq.filter((e: any) => { return e?.Type === 'BatteryInverter'; });

  const isTerraHV = typeof hv === 'string' && /terra/i.test(hv);
  main.Type = isTerraHV ? 'Terra' : 'Blokk';
//  const expectedMainType = isTerraHV ? 'Terra' : 'Blokk';
//  if (main.Type !== expectedMainType)
//  {
//    add({ message: `Main.Type must be ${expectedMainType} (HardwareVariant=${hv})`, path: ['Units','Main','Type'] });
//  }

  biList.forEach((bi: any) =>
  {
    const idx = eq.indexOf(bi);
    const inv = bi?.Inverter?.Type;
    const invType = bi?.Inverter?.Config?.InverterType;
    const bat = bi?.Battery?.Type;
    const batType = bi?.Battery?.Config?.BatteryType;
    const hasModbus = !!bi?.Modbus;

    if (isTerraHV)
    {
      if (inv !== 'TerraInverter')
      {
        add({ message: 'Terra configured ⇒ TerraInverter required', path: ['Units','Main','Equipment',idx,'Inverter','Type'] });
      }
      if (invType !== 'SofarTerra')
      {
        add({ message: 'TerraInverter configured ⇒ InverterType SofarTerra required', path: ['Units','Main','Equipment',idx,'Inverter','Config','InverterType'] });
      }
      if (bat !== 'TerraBattery')
      {
        add({ message: 'Terra configured ⇒ TerraBattery required', path: ['Units','Main','Equipment',idx,'Battery','Type'] });
      }
      if (batType !== 'SofarTerra')
      {
        add({ message: 'TerraBattery configured ⇒ BatteryType SofarTerra required', path: ['Units','Main','Equipment',idx,'Battery','Config','BatteryType'] });
      }
      if (!hasModbus)
      {
        add({ message: 'Terra configured ⇒ Modbus component required', path: ['Units','Main','Equipment',idx,'Modbus'] });
      }
    }
    else
    {
      if (inv === 'TerraInverter')
      {
        add({ message: 'Terra not configured ⇒ TerraInverter not allowed', path: ['Units','Main','Equipment',idx,'Inverter','Type'] });
      }
      if (invType === 'SofarTerra')
      {
        add({ message: 'Terra not configured ⇒ InverterType SofarTerra not allowed', path: ['Units','Main','Equipment',idx,'Inverter','Config','InverterType'] });
      }
      if (bat === 'TerraBattery')
      {
        add({ message: 'Terra not configured ⇒ TerraBattery not allowed', path: ['Units','Main','Equipment',idx,'Battery','Type'] });
      }
      if (batType === 'SofarTerra')
      {
        add({ message: 'Terra not configured ⇒ BatteryType SofarTerra not allowed', path: ['Units','Main','Equipment',idx,'Battery','Config','BatteryType'] });
      }
      if (hasModbus)
      {
        add({ message: 'Terra not configured ⇒ Modbus not allowed', path: ['Units','Main','Equipment',idx,'Modbus'] });
      }
    }
  });
}

export function applyCardinality(config: any, add: (i: Issue) => void): void
{
  const emsEq = config?.Units?.Ems?.Equipment ?? [];
  const smCount = emsEq.filter((e: any) => { return e?.Type === 'Smartmeter'; }).length;
  const localCount = emsEq.filter((e: any) => { return e?.Type === 'SlaveLocalUM'; }).length;
  const remoteCount = emsEq.filter((e: any) => { return e?.Type === 'SlaveRemoteUM'; }).length;
  if (localCount !== cardinality.ems.slaveLocalEq)
  {
    add({ message: 'SlaveLocalUM muss genau einmal vorhanden sein', path: ['Units','Ems','Equipment'] });
  }
  if (smCount > cardinality.ems.smartmeterMax)
  {
    add({ message: `Smartmeter max. ${cardinality.ems.smartmeterMax}`, path: ['Units','Ems','Equipment'] });
  }
  if (remoteCount > cardinality.ems.slaveRemoteMax)
  {
    add({ message: `SlaveRemoteUM max. ${cardinality.ems.slaveRemoteMax}`, path: ['Units','Ems','Equipment'] });
  }

  const mainEq = config?.Units?.Main?.Equipment ?? [];
  const smMainCount = mainEq.filter((e: any) => { return e?.Type === 'SmartmeterMain'; }).length;
  const biCount = mainEq.filter((e: any) => { return e?.Type === 'BatteryInverter'; }).length;
  if (smMainCount !== cardinality.main.smartmeterMainEq)
  {
    add({ message: 'SmartmeterMain muss genau einmal vorhanden sein', path: ['Units','Main','Equipment'] });
  }
  if (biCount < cardinality.main.batteryInverterMin)
  {
    add({ message: 'At least one BatteryInverter required', path: ['Units','Main','Equipment'] });
  }
}
