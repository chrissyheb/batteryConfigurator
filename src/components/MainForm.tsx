
import React from 'react';
import { SelectField, TextField, GuidField } from './Fields';
import { v4 as uuid } from 'uuid';
import { getInverterTypes, getBatteryTypes, getModbusTypes, getMainSmartmeterHardwares, getMainSmartmeterModels, getInverterHardwareTypes, getBatteryHardwareTypes } from '@/spec/builder';
import { errorAt } from '@/utils/errors';

function BatteryInverterCard(props: { cfg: any; biIndex: number; setCfg: (c: any) => void; errorIndex: any })
{
  const { cfg, biIndex, setCfg, errorIndex } = props;
  const biList = cfg.Units.Main.Equipment.filter((e: any) => { return e.Type === 'BatteryInverter'; });
  const bi = biList[biIndex];
  const listIndex = cfg.Units.Main.Equipment.indexOf(bi);

  const remove = (): void =>
  {
    const c = structuredClone(cfg);
    c.Units.Main.Equipment.splice(listIndex, 1);
    setCfg(c);
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="badge">BatteryInverter</span>
        <button className="ghost" onClick={remove}>Entfernen</button>
      </div>

      <SelectField leftIsType options={['BatteryInverter']} value="BatteryInverter" onChange={() => {}} />
      <TextField leftLabel="Name" value={bi.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Name'])} />

      <div className="card">
        <h3>Inverter</h3>
        <SelectField leftIsType options={getInverterTypes()} value={bi.Inverter.Type} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Inverter.Type = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Inverter','Type'])} />
        <TextField leftLabel="Name" value={bi.Inverter.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Inverter.Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Inverter','Name'])} />
        <GuidField value={bi.Inverter.Guid} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Inverter.Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Inverter','Guid'])} />
        <SelectField label="InverterType" options={getInverterHardwareTypes()} value={bi.Inverter.Config.InverterType} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Inverter.Config.InverterType = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Inverter','Config','InverterType'])} />
        <TextField leftLabel="NominalInverterPower" value={bi.Inverter.Config.NominalInverterPower} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Inverter.Config.NominalInverterPower = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Inverter','Config','NominalInverterPower'])} />
      </div>

      <div className="card">
        <h3>Battery</h3>
        <SelectField leftIsType options={getBatteryTypes()} value={bi.Battery.Type} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Battery.Type = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Type'])} />
        <TextField leftLabel="Name" value={bi.Battery.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Battery.Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Name'])} />
        <GuidField value={bi.Battery.Guid} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Battery.Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Guid'])} />
        <SelectField label="BatteryType" options={getBatteryHardwareTypes()} value={bi.Battery.Config.BatteryType} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Battery.Config.BatteryType = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Config','BatteryType'])} />
        <TextField leftLabel="BatteryCabinetCount" value={bi.Battery.Config.BatteryCabinetCount} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Battery.Config.BatteryCabinetCount = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Config','BatteryCabinetCount'])} />
        <TextField leftLabel="BatteryCabinetModuleCount" value={bi.Battery.Config.BatteryCabinetModuleCount} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Battery.Config.BatteryCabinetModuleCount = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Config','BatteryCabinetModuleCount'])} />
      </div>

      <div className="card">
        <h3>Modbus</h3>
        <SelectField leftIsType options={['(kein)', ...getModbusTypes()]} value={bi.Modbus ? 'TerraModbus' : '(kein)'} onChange={(v: string) => {
          const c = structuredClone(cfg);
          if (v === '(kein)') { delete c.Units.Main.Equipment[listIndex].Modbus; }
          else { c.Units.Main.Equipment[listIndex].Modbus = { Name: '', Type: 'TerraModbus', Guid: bi.Modbus?.Guid ?? '' }; }
          setCfg(c);
        }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Modbus'])} />
        {bi.Modbus && (<>
          <TextField leftLabel="Name" value={bi.Modbus.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Modbus.Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Modbus','Name'])} />
          <GuidField value={bi.Modbus.Guid} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[listIndex].Modbus.Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Modbus','Guid'])} />
        </>)}
      </div>
    </div>
  );
}

export default function MainForm(props: { cfg: any; setCfg: (c: any) => void; errorIndex: any })
{
  const { cfg, setCfg, errorIndex } = props;

  const addSmartMain = (): void =>
  {
    const alreadyConfigured = cfg.Units.Main.Equipment.some((e: any) => { return e.Type === 'SmartmeterMain'; });
    if (alreadyConfigured) 
    {
      return;
    }
    const sm = { Name: 'Smartmeter', DisplayName: '', Type: 'SmartmeterMain', HardwareType: 'Virtual', HardwareModel: 'Virtual', Guid: uuid() };
    const c = structuredClone(cfg);
    c.Units.Main.Equipment.unshift(sm);
    setCfg(c);
  };

  const addBatteryInv = (): void =>
  {
    const bi = {
      Name: 'BatteryInverter',
      Type: 'BatteryInverter',
      Inverter: { Name: '', Type: 'InverterKaco', Guid: uuid(), Config: { InverterType: 'Kaco', NominalInverterPower: '0' } },
      Battery: { Name: '', Type: 'BatteryPylontechM1xBms', Guid: uuid(), Config: { BatteryType: 'PylontechM1C', BatteryCabinetCount: '1', BatteryCabinetModuleCount: '1' } }
    };
    const c = structuredClone(cfg);
    c.Units.Main.Equipment.push(bi);
    setCfg(c);
  };

  const smMainIndex = cfg.Units.Main.Equipment.findIndex((e: any) => { return e.Type === 'SmartmeterMain'; });
  const smMain = smMainIndex >= 0 ? cfg.Units.Main.Equipment[smMainIndex] : null;

  return (
    <div className="card stack">
      <h2>Main</h2>

      <div className="row">
        <button onClick={addSmartMain}>+ SmartmeterMain</button>
        <button onClick={addBatteryInv}>+ BatteryInverter</button>
      </div>

      {smMain && (
        <div className="card">
          <span className="badge">SmartmeterMain</span>
          <SelectField leftIsType options={['SmartmeterMain']} value="SmartmeterMain" onChange={() => {}} />
          <SelectField
            label="HardwareType"
            options={getMainSmartmeterHardwares()}
            value={smMain.HardwareType}
            onChange={(v: string) =>
            {
              const c = structuredClone(cfg);
              const models = getMainSmartmeterModels(v);
              c.Units.Main.Equipment[smMainIndex].HardwareType = v;
              c.Units.Main.Equipment[smMainIndex].HardwareModel = models[0] ?? '';
              setCfg(c);
            }}
            error={errorAt(errorIndex, ['Units','Ems','Equipment', smMainIndex, 'HardwareType'])}
          />
          <SelectField
            label="HardwareModel"
            options={getMainSmartmeterModels(smMain.HardwareType)}
            value={smMain.HardwareModel ?? ''}
            onChange={(v: string) =>
            {
              const c = structuredClone(cfg);
              c.Units.Main.Equipment[smMainIndex].HardwareModel = v;
              setCfg(c);
            }}
            error={errorAt(errorIndex, ['Units','Ems','Equipment', smMainIndex, 'HardwareModel'])}
          />
          <TextField leftLabel="Name" value={smMain.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[smMainIndex].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', smMainIndex, 'Name'])} />
          <TextField leftLabel="DisplayName" value={smMain.DisplayName ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[smMainIndex].DisplayName = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', smMainIndex, 'DisplayName'])} />
          <GuidField value={smMain.Guid} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Main.Equipment[smMainIndex].Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Main','Equipment', smMainIndex, 'Guid'])} />
        </div>
      )}

      {(cfg.Units.Main.Equipment.filter((e: any) => { return e.Type === 'BatteryInverter'; })).map((_: any, idx: number) =>
      {
        return <BatteryInverterCard key={idx} cfg={cfg} biIndex={idx} setCfg={setCfg} errorIndex={errorIndex} />;
      })}
    </div>
  );
}
