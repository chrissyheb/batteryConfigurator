
import React from 'react'
import { SelectField, TextField, GuidField } from './Fields'
import { v4 as uuid } from 'uuid'
import { getEmsSmartmeterHardwares, getEmsSmartmeterTypes } from '@/spec/builder'
import { errorAt } from '@/utils/errors'
export default function EMSForm({cfg, setCfg, errorIndex}: {cfg:any, setCfg:(c:any)=>void, errorIndex: any}) {
  const list = cfg.Units.Ems.Equipment
  const addSmart = () => setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: [...list, { Name:'Smartmeter', Displayname:'', Type:'Smartmeter', Hardware:'Virtual', Guid: uuid(), Config:{ Usecase:'Undefined', Port:'502' } }] } } })
  const addLocal = () => setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: [...list, { Name:'Local UM', Displayname:'', Type:'SlaveLocalUM', Guid: uuid() }] } } })
  const addRemote = () => setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: [...list, { Name:'Remote UM', Displayname:'', Type:'SlaveRemoteUM', Guid: uuid(), Ip:'192.168.0.10' }] } } })
  const removeAt = (i:number) => setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: list.filter((_,idx)=>idx!==i) } } })
  return (<div className="card stack"><h2>EMS</h2>
    <div className="row"><button onClick={addSmart}>+ Smartmeter</button><button onClick={addLocal}>+ SlaveLocalUM</button><button onClick={addRemote}>+ SlaveRemoteUM</button></div>
    {list.map((e: any, i: number) => (<div key={i} className="card">
      <div className="row" style={{justifyContent:'space-between'}}><span className="badge">{e.Type}</span><button className="ghost" onClick={()=>removeAt(i)}>Entfernen</button></div>
      {e.Type === 'Smartmeter' && (<>
        <SelectField leftIsType options={['Smartmeter']} value={e.Type} onChange={()=>{}} />
        <SelectField label="Hardware" options={getEmsSmartmeterHardwares()} value={e.Hardware} onChange={(v:string)=>{ const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Hardware = v; c.Units.Ems.Equipment[i].Config ??= { Usecase:'Undefined', Port:'502' }; setCfg(c) }} />
        <SelectField label="Modell (aus Hardware)" options={getEmsSmartmeterTypes(e.Hardware)} value={getEmsSmartmeterTypes(e.Hardware)[0] ?? ''} onChange={()=>{}} disabled />
        <TextField leftLabel="Name" value={e.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
        <TextField leftLabel="Displayname" value={e.Displayname ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Displayname=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Displayname'])} />
        <GuidField value={e.Guid ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Guid=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
        <SelectField label="Usecase" options={['Undefined','GridConnectionPointControl']} value={e.Config?.Usecase ?? 'Undefined'} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Config.Usecase=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Config','Usecase'])} />
        <TextField leftLabel="Port" value={e.Config?.Port ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Config.Port=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Config','Port'])} />
      </>)}
      {e.Type === 'SlaveLocalUM' && (<>
        <SelectField leftIsType options={['SlaveLocalUM']} value={e.Type} onChange={()=>{}} />
        <TextField leftLabel="Name" value={e.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
        <TextField leftLabel="Displayname" value={e.Displayname ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Displayname=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Displayname'])} />
        <GuidField value={e.Guid ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Guid=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
      </>)}
      {e.Type === 'SlaveRemoteUM' && (<>
        <SelectField leftIsType options={['SlaveRemoteUM']} value={e.Type} onChange={()=>{}} />
        <TextField leftLabel="Name" value={e.Name} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Name=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
        <TextField leftLabel="Displayname" value={e.Displayname ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Displayname=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Displayname'])} />
        <GuidField value={e.Guid ?? ''} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Guid=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
        <TextField leftLabel="Ip" value={e.Ip} onChange={(v:string)=>{ const c=structuredClone(cfg); c.Units.Ems.Equipment[i].Ip=v; setCfg(c) }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Ip'])} />
      </>)}
    </div>))}</div>)
}
