
import React from 'react'
import type { TConfig, TSmartmeterEMS, TSlaveLocalUM, TSlaveRemoteUM } from '@/domain/externalTypes'
import { SelectField, TextField, GuidField } from './Fields'
import { v4 as uuid } from 'uuid'
import { EMS_SM_HARDWARES, EMS_SM_TYPES } from '@/catalog/loader'
import { errorAt } from '@/utils/errors'

export default function EMSForm({cfg, setCfg, errorIndex}: {cfg:TConfig, setCfg:(c:TConfig)=>void, errorIndex: any}) {
  const list = cfg.Units.Ems.Equipment

  const addSmart = () => setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: [...list, { Name:'Smartmeter', Displayname:'', Type:'Smartmeter', Hardware:'Virtual', Guid: uuid(), Config:{ Usecase:'Undefined', Port:'502' } as any }] } } })
  const addLocal = () => setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: [...list, { Name:'Local UM', Displayname:'', Type:'SlaveLocalUM', Guid: uuid() }] } } })
  const addRemote = () => setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: [...list, { Name:'Remote UM', Displayname:'', Type:'SlaveRemoteUM', Guid: uuid(), Ip:'192.168.0.10' }] } } })

  const removeAt = (i:number) => setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: list.filter((_,idx)=>idx!==i) } } })

  return (<div className="card stack">
    <h2>EMS</h2>
    <div className="row">
      <button onClick={addSmart}>+ Smartmeter</button>
      <button onClick={addLocal}>+ SlaveLocalUM</button>
      <button onClick={addRemote}>+ SlaveRemoteUM</button>
    </div>
    {list.map((e, i) => (
      <div key={i} className="card">
        <div className="row" style={{justifyContent:'space-between'}}>
          <span className="badge">{e.Type}</span>
          <button className="ghost" onClick={()=>removeAt(i)}>Entfernen</button>
        </div>
        {e.Type === 'Smartmeter' && (<>
          <SelectField leftIsType options={['Smartmeter']} value={e.Type} onChange={()=>{}} />
          <SelectField label="Hardware" options={EMS_SM_HARDWARES} value={(e as TSmartmeterEMS).Hardware} onChange={(v:string)=>{
            const c = structuredClone(cfg); (c.Units.Ems.Equipment[i] as TSmartmeterEMS).Hardware = v as any; (c.Units.Ems.Equipment[i] as TSmartmeterEMS).Config ??= { Usecase:'Undefined', Port:'502' }; setCfg(c)
          }} error={undefined} />
          {/* Typenliste angezeigt (aus Katalog), aber nicht persistiert, da nicht Teil des Exportschemas */}
          <SelectField label="Modell (aus Hardware)" options={EMS_SM_TYPES((e as TSmartmeterEMS).Hardware)} value={EMS_SM_TYPES((e as TSmartmeterEMS).Hardware)[0] ?? ''} onChange={()=>{}} disabled />
          <TextField leftLabel="Name" value={e.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
          <TextField leftLabel="Displayname" value={e.Displayname ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Displayname=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Displayname'])} />
          <GuidField value={e.Guid ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Guid=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
          <SelectField label="Usecase" options={['Undefined','GridConnectionPointControl']} value={(e as any).Config?.Usecase ?? 'Undefined'} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Ems.Equipment[i] as TSmartmeterEMS).Config.Usecase=v as any; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Config','Usecase'])} />
          <TextField leftLabel="Port" value={(e as any).Config?.Port ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Ems.Equipment[i] as TSmartmeterEMS).Config.Port=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Config','Port'])} />
        </>)}
        {e.Type === 'SlaveLocalUM' && (<>
          <SelectField leftIsType options={['SlaveLocalUM']} value={e.Type} onChange={()=>{}} />
          <TextField leftLabel="Name" value={e.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Ems.Equipment[i] as TSlaveLocalUM).Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
          <TextField leftLabel="Displayname" value={e.Displayname ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Ems.Equipment[i] as TSlaveLocalUM).Displayname=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Displayname'])} />
          <GuidField value={e.Guid ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Ems.Equipment[i] as TSlaveLocalUM).Guid=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
        </>)}
        {e.Type === 'SlaveRemoteUM' && (<>
          <SelectField leftIsType options={['SlaveRemoteUM']} value={e.Type} onChange={()=>{}} />
          <TextField leftLabel="Name" value={e.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Ems.Equipment[i] as TSlaveRemoteUM).Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
          <TextField leftLabel="Displayname" value={e.Displayname ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Ems.Equipment[i] as TSlaveRemoteUM).Displayname=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Displayname'])} />
          <GuidField value={e.Guid ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Ems.Equipment[i] as TSlaveRemoteUM).Guid=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
          <TextField leftLabel="Ip" value={(e as TSlaveRemoteUM).Ip} onChange={(v:string)=>{ const c=structuredClone(cfg); (c.Units.Ems.Equipment[i] as TSlaveRemoteUM).Ip=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Ip'])} />
        </>)}
      </div>
    ))}
  </div>)
}
