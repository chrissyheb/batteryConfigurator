
import React from 'react';
import { SelectField, TextField, GuidField } from './Fields';
import { emsEquipmentLists, emsEquipmentKeys, componentType, createByKey, nextIndexForType, getEmsSmartmeterHardwares, getEmsSmartmeterModels, getEmsSmartmeterUseCaseTypes } from '@/spec/builder';
import { errorAt } from '@/utils/errors';

export default function EMSForm(props: { cfg: any; setCfg: (c: any) => void; errorIndex: any })
{
  const { cfg, setCfg, errorIndex } = props;
  //const list = cfg.Units.Ems.Equipment;
  const lists: Partial<emsEquipmentLists> = cfg.Units.Ems.Equipment ?? {};
  const listsSingle: emsEquipmentLists =
  {
    Smartmeter: lists.Smartmeter ?? [],
    SlaveLocalUM: lists.SlaveLocalUM ?? [],
    SlaveRemoteUM: lists.SlaveRemoteUM ?? []
  };
//  const smList = list.Smartmeter ?? list.emsEqSmartmeter ?? [];
//  const localList = list.SlaveLocalUM ?? list.emsEqSlaveLocalUM ?? [];
//  const remoteList = list.SlaveRemoteUM ?? list.emsEqSlaveRemoteUM ?? [];


  function addElement(type: emsEquipmentKeys)
  {
    //const lists: Partial<emsEquipmentLists> = cfg.Units.Ems.Equipment ?? {};
    const current: any[] = lists[type] ?? [];
    const n: number = current.length + 1;
    const item: any = createByKey(type, { n });
    const next: emsEquipmentLists = { ...listsSingle };
    next[type] = [ ...next[type], item ];

    setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { ...cfg.Units.Ems, Equipment: next }}});
  }

  const removeAt = (type: emsEquipmentKeys, i: number): void =>
  {
    const listsReduced: emsEquipmentLists = { ...listsSingle };
    listsReduced[type] = listsSingle[type].filter((_: any, idx: number) => { return idx !== i; });
    setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { ...cfg.Units.Ems, Equipment: listsReduced } } });
  };


  return (
    <div className="card stack">
      <h2>EMS</h2>
      <div className="row">
        <button onClick={() => {addElement('Smartmeter')}}>+ Smartmeter</button>
        <button onClick={() => {addElement('SlaveLocalUM')}}>+ SlaveLocalUM</button>
        <button onClick={() => {addElement('SlaveRemoteUM')}}>+ SlaveRemoteUM</button>
      </div>

      {listsSingle.Smartmeter.map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="badge">{e.Type}</span>
              <button className="ghost" onClick={() => removeAt('Smartmeter',i)}>Entfernen</button>
            </div>
            <SelectField leftIsType options={['Smartmeter']} value={e.Type} onChange={() => {}} />
            <TextField leftLabel="Name" value={e.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
            <TextField leftLabel="DisplayName" value={e.DisplayName ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].DisplayName = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'DisplayName'])} />
            <SelectField
              label="HardwareType"
              options={getEmsSmartmeterHardwares()}
              value={e.HardwareType}
              onChange={(v: string) =>
              {
                const c = structuredClone(cfg);
                const models = getEmsSmartmeterModels(v);
                c.Units.Ems.Equipment[i].HardwareType = v;
                c.Units.Ems.Equipment[i].HardwareModel = models[0] ?? '';
                setCfg(c);
              }}
              error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'HardwareType'])}
            />
            <SelectField
              label="HardwareModel"
              options={getEmsSmartmeterModels(e.HardwareType)}
              value={e.HardwareModel ?? ''}
              onChange={(v: string) =>
              {
                const c = structuredClone(cfg);
                c.Units.Ems.Equipment[i].HardwareModel = v;
                setCfg(c);
              }}
              error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'HardwareModel'])}
            />
            <GuidField value={e.Guid ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
            <SelectField label="Usecase" options={getEmsSmartmeterUseCaseTypes()} value={e.Config?.Usecase ?? 'Undefined'} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Config.Usecase = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Config','Usecase'])} />
            <TextField leftLabel="Port" value={e.Config?.Port ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Config.Port = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Config','Port'])} />
          </div>
        );
      })}

      {listsSingle.SlaveLocalUM.map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="badge">{e.Type}</span>
              <button className="ghost" onClick={() => removeAt('SlaveLocalUM',i)}>Entfernen</button>
            </div>
            <SelectField leftIsType options={['SlaveLocalUM']} value={e.Type} onChange={() => {}} />
            <TextField leftLabel="Name" value={e.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
            <TextField leftLabel="DisplayName" value={e.DisplayName ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].DisplayName = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'DisplayName'])} />
            <GuidField value={e.Guid ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
          </div>
        );
      })}

      {listsSingle.SlaveRemoteUM.map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="badge">{e.Type}</span>
              <button className="ghost" onClick={() => removeAt('SlaveRemoteUM',i)}>Entfernen</button>
            </div>
            <SelectField leftIsType options={['SlaveRemoteUM']} value={e.Type} onChange={() => {}} />
            <TextField leftLabel="Name" value={e.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
            <TextField leftLabel="DisplayName" value={e.DisplayName ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].DisplayName = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'DisplayName'])} />
            <GuidField value={e.Guid ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
            <TextField leftLabel="IP Address" value={e.Ip} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Ip = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Ip'])} />
          </div>
        );
      })}
    </div>
  );
}
