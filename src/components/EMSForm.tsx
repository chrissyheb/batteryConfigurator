
import React from 'react';
import { SelectField, TextField, GuidField } from './Fields';
import { v4 as uuid } from 'uuid';
import { getEmsSmartmeterHardwares, getEmsSmartmeterModels, getEmsSmartmeterUseCaseTypes } from '@/spec/builder';
import { errorAt } from '@/utils/errors';

export default function EMSForm(props: { cfg: any; setCfg: (c: any) => void; errorIndex: any })
{
  const { cfg, setCfg, errorIndex } = props;
  const list = cfg.Units.Ems.Equipment;

  const addSmart = (): void =>
  {
    const item = {
      Name: 'Smartmeter',
      DisplayName: '',
      Type: 'Smartmeter',
      HardwareType: 'Virtual',
      HardwareModel: 'Virtual',
      Guid: uuid(),
      Config: { Usecase: 'Undefined', Port: '502' }
    };
    setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: [...list, item] } } });
  };

  const addLocal = (): void =>
  {
    const item = { Name: 'Local UM', DisplayName: '', Type: 'SlaveLocalUM', Guid: uuid() };
    setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: [...list, item] } } });
  };

  const addRemote = (): void =>
  {
    const item = { Name: 'Remote UM', DisplayName: '', Type: 'SlaveRemoteUM', Guid: uuid(), Ip: '192.168.0.10' };
    setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: [...list, item] } } });
  };

  const removeAt = (i: number): void =>
  {
    const filtered = list.filter((_: any, idx: number) => { return idx !== i; });
    setCfg({ ...cfg, Units: { ...cfg.Units, Ems: { Equipment: filtered } } });
  };

  return (
    <div className="card stack">
      <h2>EMS</h2>
      <div className="row">
        <button onClick={addSmart}>+ Smartmeter</button>
        <button onClick={addLocal}>+ SlaveLocalUM</button>
        <button onClick={addRemote}>+ SlaveRemoteUM</button>
      </div>

      {list.map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="badge">{e.Type}</span>
              <button className="ghost" onClick={() => removeAt(i)}>Entfernen</button>
            </div>

            {e.Type === 'Smartmeter' && (
              <>
                <SelectField leftIsType options={['Smartmeter']} value={e.Type} onChange={() => {}} />

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
                <TextField leftLabel="Name" value={e.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
                <TextField leftLabel="DisplayName" value={e.DisplayName ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].DisplayName = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'DisplayName'])} />
                <GuidField value={e.Guid ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
                <SelectField label="Usecase" options={getEmsSmartmeterUseCaseTypes()} value={e.Config?.Usecase ?? 'Undefined'} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Config.Usecase = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Config','Usecase'])} />
                <TextField leftLabel="Port" value={e.Config?.Port ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Config.Port = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Config','Port'])} />
              </>
            )}

            {e.Type === 'SlaveLocalUM' && (
              <>
                <SelectField leftIsType options={['SlaveLocalUM']} value={e.Type} onChange={() => {}} />
                <TextField leftLabel="Name" value={e.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
                <TextField leftLabel="DisplayName" value={e.DisplayName ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].DisplayName = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'DisplayName'])} />
                <GuidField value={e.Guid ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
              </>
            )}

            {e.Type === 'SlaveRemoteUM' && (
              <>
                <SelectField leftIsType options={['SlaveRemoteUM']} value={e.Type} onChange={() => {}} />
                <TextField leftLabel="Name" value={e.Name} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Name = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Name'])} />
                <TextField leftLabel="DisplayName" value={e.DisplayName ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].DisplayName = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'DisplayName'])} />
                <GuidField value={e.Guid ?? ''} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Guid = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Guid'])} />
                <TextField leftLabel="IP Address" value={e.Ip} onChange={(v: string) => { const c = structuredClone(cfg); c.Units.Ems.Equipment[i].Ip = v; setCfg(c); }} error={errorAt(errorIndex, ['Units','Ems','Equipment', i, 'Ip'])} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
