
import React from 'react';
import { SelectField, TextField, GuidField, NumberField, CheckField } from './Fields';
import { emsEquipmentLists, emsEquipmentKeys, componentType, createByKey, nextIndexForType, getEmsSmartmeterHardwares, getEmsSmartmeterModels, getEmsSmartmeterUseCaseTypes } from '@/spec/builder';
import { errorAt } from '@/utils/errors';
import { components } from '@/spec/catalog';
import { stripUnit, addUnit } from '@/utils/helper';

export default function EMSForm(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; errorIndex: any })
{
  const { cfg, setCfg, setInCfg, getCfg, getOrCfg, delFromCfg, errorIndex } = props;
  //const list = cfg.Units.Ems.Equipment;
  const lists: Partial<emsEquipmentLists> = cfg.Units.Ems.Equipment ?? {};
  const listsSingle: emsEquipmentLists =
  {
    Smartmeter: lists.Smartmeter ?? [],
    SlaveLocalUM: lists.SlaveLocalUM ?? [],
    SlaveRemoteUM: lists.SlaveRemoteUM ?? []
  };


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
              <h3>{e.Type + ' (' + e.Name + ')'}</h3>
              <button className="ghost" onClick={() => delFromCfg(['Units','Ems','Equipment',"Smartmeter",i])}>Entfernen</button>
            </div>
            <SelectField leftIsType options={['Smartmeter']} value={e.Type} onChange={() => {}} />
            <TextField leftLabel="Name" value={e.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.Smartmeter[i].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
            <TextField leftLabel="DisplayName" value={e.DisplayName ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.Smartmeter[i].DisplayName = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'DisplayName'])} />
            <SelectField
              label="HardwareType"
              options={getEmsSmartmeterHardwares()}
              value={e.HardwareType}
              onChange={(v: string) =>
              {
                const models = getEmsSmartmeterModels(v);
                setInCfg(['Units','Ems','Equipment',"Smartmeter",i,'HardwareType'], v);
                setInCfg(['Units','Ems','Equipment',"Smartmeter",i,'HardwareModel'], models[0]);
              }}
              error={errorAt(errorIndex, ['Units','Ems','Equipment',"Smartmeter",i,'HardwareType'])}
            />
            <SelectField
              label="HardwareModel"
              options={getEmsSmartmeterModels(e.HardwareType)}
              value={e.HardwareModel ?? ''}
              onChange={(v: string) =>
              {
                setInCfg(['Units','Ems','Equipment',"Smartmeter",i,'HardwareModel'], v);
              }}
              error={errorAt(errorIndex, ['Units','Ems','Equipment',"Smartmeter",i,'HardwareModel'])}
            />
            <GuidField value={e.Guid ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.Smartmeter[i].Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment',"Smartmeter",i,'Guid'])} />
            <SelectField label="Usecase" options={getEmsSmartmeterUseCaseTypes()} value={e.Config?.Usecase ?? 'Undefined'} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.Smartmeter[i].Config.Usecase = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', "Smartmeter",i,'Config','Usecase'])} />
            <NumberField 
              leftLabel="Port"
              value={e.Config?.Port ?? 0}
              minValue="1"
              maxValue="65535"
              step="1"
              onChange={(v: number) => 
              {
                const c = structuredClone(cfg);
                c.Units.Ems.Equipment.Smartmeter[i].Config.Port = v;
                setCfg(c);
              }}
              error={errorAt(errorIndex, ['Units','Ems','Equipment',"Smartmeter",i,'Config','Port'])}
            />
          </div>
        );
      })}

      {listsSingle.SlaveLocalUM.map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>{e.Type + ' (' + e.Name + ')'}</h3>
              <button className="ghost" onClick={() => removeAt('SlaveLocalUM',i)}>Entfernen</button>
            </div>
            <SelectField leftIsType options={['SlaveLocalUM']} value={e.Type} onChange={() => {}} />
            <TextField leftLabel="Name" value={e.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.SlaveLocalUM[i].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment','SlaveLocalUM',i,'Name'])} />
            <TextField leftLabel="DisplayName" value={e.DisplayName ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.SlaveLocalUM[i].DisplayName = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment','SlaveLocalUM',i,'DisplayName'])} />
            <GuidField value={e.Guid ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.SlaveLocalUM[i].Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment','SlaveLocalUM',i,'Guid'])} />
          </div>
        );
      })}

      {listsSingle.SlaveRemoteUM.map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>{e.Type + ' (' + e.Name + ')'}</h3>
              <button className="ghost" onClick={() => removeAt('SlaveRemoteUM',i)}>Entfernen</button>
            </div>
            <SelectField leftIsType options={['SlaveRemoteUM']} value={e.Type} onChange={() => {}} />
            <TextField leftLabel="Name" value={e.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.SlaveRemoteUM[i].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment','SlaveRemoteUM',i,'Name'])} />
            <TextField leftLabel="DisplayName" value={e.DisplayName ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.SlaveRemoteUM[i].DisplayName = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment','SlaveRemoteUM',i,'DisplayName'])} />
            <GuidField value={e.Guid ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.SlaveRemoteUM[i].Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment','SlaveRemoteUM',i,'Guid'])} />
            <TextField leftLabel="IP Address" value={e.Ip} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment.SlaveRemoteUM[i].Ip = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment','SlaveRemoteUM',i,'Ip'])} />
          </div>
        );
      })}
    </div>
  );
}
