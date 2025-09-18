
import React from 'react'
import type { TConfig, TBatteryInverter, TSmartmeterMain } from '@/domain/externalTypes'
import { SelectField, TextField, GuidField } from './Fields'
import { v4 as uuid } from 'uuid'
import { INVERTER_TYPES, BATTERY_TYPES, MODBUS_TYPES, MAIN_SM_HARDWARES, MAIN_SM_TYPES } from '@/catalog/loader'
import { errorAt } from '@/utils/errors'

function BatteryInverterCard({cfg, biIndex, setCfg, errorIndex}: any) {
  const biList = (cfg.Units.Main.Equipment.filter((e:any)=>e.Type==='BatteryInverter') as TBatteryInverter[])
  const bi = biList[biIndex]
  const listIndex = cfg.Units.Main.Equipment.findIndex((e:any)=>e === biList[biIndex])
  const remove = () => { const c = structuredClone(cfg); c.Units.Main.Equipment.splice(listIndex,1); setCfg(c) }
  return (<div className="card">
    <div className="row" style={{justifyContent:'space-between'}}>
      <span className="badge">BatteryInverter</span>
      <button className="ghost" onClick={remove}>Entfernen</button>
    </div>
    <SelectField leftIsType options={['BatteryInverter']} value="BatteryInverter" onChange={()=>{}} />
    <TextField leftLabel="Name" value={bi.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Name'])} />

    <div className="grid-2">
      <div className="card">
        <h3>Inverter</h3>
        <SelectField leftIsType options={INVERTER_TYPES} value={bi.Inverter.Type} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Inverter.Type=v as any; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Inverter','Type'])} />
        <TextField leftLabel="Name" value={bi.Inverter.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Inverter.Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Inverter','Name'])} />
        <GuidField value={bi.Inverter.Guid} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Inverter.Guid=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Inverter','Guid'])} />
        <SelectField label="InverterType" options={['Kaco','SofarTerra']} value={bi.Inverter.Config.InverterType} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Inverter.Config.InverterType=v as any; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Inverter','Config','InverterType'])} />
        <TextField leftLabel="NominalInverterPower" value={bi.Inverter.Config.NominalInverterPower} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Inverter.Config.NominalInverterPower=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Inverter','Config','NominalInverterPower'])} />
      </div>
      <div className="card">
        <h3>Battery</h3>
        <SelectField leftIsType options={BATTERY_TYPES} value={bi.Battery.Type} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Battery.Type=v as any; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Type'])} />
        <TextField leftLabel="Name" value={bi.Battery.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Battery.Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Name'])} />
        <GuidField value={bi.Battery.Guid} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Battery.Guid=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Guid'])} />
        <SelectField label="BatteryType" options={['PylontechM1C','SofarTerra']} value={bi.Battery.Config.BatteryType} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Battery.Config.BatteryType=v as any; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Config','BatteryType'])} />
        <TextField leftLabel="BatteryCabinetCount" value={bi.Battery.Config.BatteryCabinetCount} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Battery.Config.BatteryCabinetCount=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Config','BatteryCabinetCount'])} />
        <TextField leftLabel="BatteryCabinetModuleCount" value={bi.Battery.Config.BatteryCabinetModuleCount} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Battery.Config.BatteryCabinetModuleCount=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Battery','Config','BatteryCabinetModuleCount'])} />
      </div>
    </div>

    <div className="card">
      <h3>Modbus</h3>
      <SelectField leftIsType options={['(kein)', ...MODBUS_TYPES]} value={bi.Modbus ? 'TerraModbus' : '(kein)'} onChange={(v:string)=>{
        const c=structuredClone(cfg);
        if (v==='(kein)') delete (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Modbus;
        else (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Modbus = { Name:'', Type:'TerraModbus', Guid: bi.Modbus?.Guid ?? '' }
        setCfg(c)
      }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Modbus'])} />
      {bi.Modbus && (<>
        <TextField leftLabel="Name" value={bi.Modbus.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Modbus!.Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Modbus','Name'])} />
        <GuidField value={bi.Modbus.Guid} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[listIndex] as TBatteryInverter).Modbus!.Guid=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', listIndex, 'Modbus','Guid'])} />
      </>)}
    </div>
  </div>)
}

export default function MainForm({cfg, setCfg, errorIndex}: {cfg:TConfig, setCfg:(c:TConfig)=>void, errorIndex:any}) {
  const addSmartMain = () => {
    const has = cfg.Units.Main.Equipment.some((e:any)=>e.Type==='SmartmeterMain')
    if (has) return
    const c = structuredClone(cfg);
    c.Units.Main.Equipment.unshift({ Name:'Smartmeter', Displayname:'', Type:'SmartmeterMain', Hardware:'Virtual', Guid: uuid() } as TSmartmeterMain)
    setCfg(c)
  }
  const addBatteryInv = () => {
    const c = structuredClone(cfg);
    c.Units.Main.Equipment.push({
      Name:'BatteryInverter', Type:'BatteryInverter',
      Inverter: { Name:'', Type:'InverterKaco', Guid: uuid(), Config:{ InverterType:'Kaco', NominalInverterPower:'0' } },
      Battery: { Name:'', Type:'BatteryPylontechM1xBms', Guid: uuid(), Config:{ BatteryType:'PylontechM1C', BatteryCabinetCount:'1', BatteryCabinetModuleCount:'1' } }
    } as TBatteryInverter)
    setCfg(c)
  }
  const smMainIndex = cfg.Units.Main.Equipment.findIndex((e:any)=>e.Type==='SmartmeterMain')
  const smMain = smMainIndex >=0 ? cfg.Units.Main.Equipment[smMainIndex] as TSmartmeterMain : null

  return (<div className="card stack">
    <h2>Main</h2>
    <div className="field">
      <label>Type</label>
      <select value={cfg.Units.Main.Type} onChange={(e)=>setCfg({ ...cfg, Units: { ...cfg.Units, Main: { ...cfg.Units.Main, Type: e.target.value as any } } })}>
        <option>Blokk</option>
        <option>Terra</option>
      </select>
      <div className="inline-error">{errorAt(errorIndex, ['Units','Main','Type'])}</div>
    </div>
    <div className="row">
      <button onClick={addSmartMain}>+ SmartmeterMain</button>
      <button onClick={addBatteryInv}>+ BatteryInverter</button>
    </div>

    {smMain && (<div className="card">
      <span className="badge">SmartmeterMain</span>
      <SelectField leftIsType options={['SmartmeterMain']} value="SmartmeterMain" onChange={()=>{}} />
      <SelectField label="Hardware" options={MAIN_SM_HARDWARES} value={smMain.Hardware} onChange={(v:string)=>{
        const c=structuredClone(cfg); (c.Units.Main.Equipment[smMainIndex] as TSmartmeterMain).Hardware=v as any; setCfg(c)
      }} error={undefined} />
      {/* Automatische Typenliste (aus Katalog), Anzeige als read-only weil nicht Teil des Exportschemas */}
      <SelectField label="Modell (aus Hardware)" options={MAIN_SM_TYPES(smMain.Hardware)} value={MAIN_SM_TYPES(smMain.Hardware)[0] ?? ''} onChange={()=>{}} disabled />
      <TextField leftLabel="Name" value={smMain.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[smMainIndex] as TSmartmeterMain).Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', smMainIndex, 'Name'])} />
      <TextField leftLabel="Displayname" value={smMain.Displayname ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[smMainIndex] as TSmartmeterMain).Displayname=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', smMainIndex, 'Displayname'])} />
      <GuidField value={smMain.Guid} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Main.Equipment[smMainIndex] as TSmartmeterMain).Guid=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Main','Equipment', smMainIndex, 'Guid'])} />
    </div>)}

    {(cfg.Units.Main.Equipment.filter((e:any)=>e.Type==='BatteryInverter') as TBatteryInverter[]).map((_, idx)=>(
      <BatteryInverterCard key={idx} cfg={cfg} biIndex={idx} setCfg={setCfg} errorIndex={errorIndex} />
    ))}
  </div>)
}
