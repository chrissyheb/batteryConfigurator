
import React from 'react';
import { SelectField, TextField, GuidField, NumberField, CheckField } from './Fields';
import { PathType, emsEquipmentKeys, createByKey, getEmsSmartmeterHardwares, getEmsSmartmeterModels, getEmsSmartmeterUseCaseTypes } from '@/spec/builder';
import { errorAt } from '@/utils/errors';
import { components } from '@/spec/catalog';
import { JSONValue } from '@/app/store';

export default function EMSForm(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any })
{
  const { cfg, setInCfg, getOrCfg, delFromCfg, errorIndex } = props;
  
  function addElement(path: PathType, type: emsEquipmentKeys): void
  {
    const pathExt: PathType = path.concat([type]);
    const list:JSONValue = getOrCfg(pathExt, []);
    let idxNew: number = 0;
    if (!Array.isArray(list)) { return; }
    idxNew = list.length;
    const item: any = createByKey(type, { n: idxNew+1 });
    const pathNew: PathType = pathExt.concat([idxNew]);
    setInCfg(pathNew, item);
  }

  function removeElement(path: PathType, i?: number): void 
  {
    if (i !== undefined && i !== null) { delFromCfg(path.concat([i])); }
    else { delFromCfg(path); }
  };


  return (
    <div className="card stack">
      <h2>EMS</h2>
      <div className="card">
        <h3>Config - Grid Connection Point</h3>
        <NumberField 
          leftLabel="PowerGridConsumptionLimit"
          path={['Units','Ems','Config','GridConnectionPoint','PowerGridConsumptionLimit']}
          rightLabel={components.EmsConfig.fields.GridConnectionPoint.group.PowerGridConsumptionLimit.unit}
          minValue="0"
        />
        <NumberField 
          leftLabel="PowerGridFeedInLimit"
          path={['Units','Ems','Config','GridConnectionPoint','PowerGridFeedInLimit']}
          rightLabel={components.EmsConfig.fields.GridConnectionPoint.group.PowerGridFeedInLimit.unit}
          minValue="0"
        />
        <NumberField 
          leftLabel="PowerGridConsumptionOffset"
          path={['Units','Ems','Config','GridConnectionPoint','PowerGridConsumptionOffset']}
          rightLabel={components.EmsConfig.fields.GridConnectionPoint.group.PowerGridConsumptionOffset.unit}
          minValue="0"
        />
      </div>
      
      <div className="card">
        <h3>Config - Master/Slave</h3>
        <NumberField 
          leftLabel="PowerActiveInstalledTotal"
          path={['Units','Ems','Config','MasterSlave','PowerActiveInstalledTotal']}
          rightLabel={components.EmsConfig.fields.MasterSlave.group.PowerActiveInstalledTotal.unit}
          minValue="0"
        />
        <NumberField 
          leftLabel="CapacityInstalledTotal"
          path={['Units','Ems','Config','MasterSlave','CapacityInstalledTotal']}
          rightLabel={components.EmsConfig.fields.MasterSlave.group.CapacityInstalledTotal.unit}
          minValue="0"
        />
        <NumberField 
          leftLabel="PowerChargeLimitTotal"
          path={['Units','Ems','Config','MasterSlave','PowerChargeLimitTotal']}
          rightLabel={components.EmsConfig.fields.MasterSlave.group.PowerChargeLimitTotal.unit}
          minValue="0"
        />
        <NumberField 
          leftLabel="PowerDischargeLimitTotal"
          path={['Units','Ems','Config','MasterSlave','PowerDischargeLimitTotal']}
          rightLabel={components.EmsConfig.fields.MasterSlave.group.PowerDischargeLimitTotal.unit}
          minValue="0"
        />
      </div>

      <div className="row">
        <button onClick={() => {addElement(['Units','Ems','Equipment'],'Smartmeter')}}>+ Smartmeter</button>
        <button onClick={() => {addElement(['Units','Ems','Equipment'],'SlaveLocalUM')}}>+ SlaveLocalUM</button>
        <button onClick={() => {addElement(['Units','Ems','Equipment'],'SlaveRemoteUM')}}>+ SlaveRemoteUM</button>
      </div>

      {getOrCfg(['Units','Ems','Equipment',"Smartmeter"], []).map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>{getOrCfg(['Units','Ems','Equipment',"Smartmeter",i,'Type'], 'Unkown Smartmeter') + ' (' + getOrCfg(['Units','Ems','Equipment',"Smartmeter",i,'Name'], '') + ')'}</h3>
              <button className="ghost" onClick={() => removeElement(['Units','Ems','Equipment','Smartmeter'],i)}>Entfernen</button>
            </div>
            <TextField 
              leftLabel="Name"
              path={['Units','Ems','Equipment',"Smartmeter",i,'Name']}
            />
            <TextField
              leftLabel="DisplayName"
              path={['Units','Ems','Equipment',"Smartmeter",i,'DisplayName']}
            />
            <SelectField
              label="HardwareType"
              path={['Units','Ems','Equipment',"Smartmeter",i,'HardwareType']}
              options={getEmsSmartmeterHardwares()}
              onChange={(v: string) =>
              {
                const models = getEmsSmartmeterModels(v);
                setInCfg(['Units','Ems','Equipment',"Smartmeter",i,'HardwareType'], v);
                setInCfg(['Units','Ems','Equipment',"Smartmeter",i,'HardwareModel'], models[0]);
              }}
            />
            <SelectField
              label="HardwareModel"
              path={['Units','Ems','Equipment',"Smartmeter",i,'HardwareModel']}
              options={getEmsSmartmeterModels(getOrCfg(['Units','Ems','Equipment',"Smartmeter",i,'HardwareType'], ''))}
            />
            <GuidField
              path={['Units','Ems','Equipment',"Smartmeter",i,'Guid']}
            />
            <SelectField
              label="Usecase"
              path={['Units','Ems','Equipment',"Smartmeter",i,'Config','Usecase']}
              options={getEmsSmartmeterUseCaseTypes()}
            />
            <NumberField 
              leftLabel="Port"
              path={['Units','Ems','Equipment',"Smartmeter",i,'Config','Port']}
              minValue="1"
              maxValue="65535"
              step="1"
            />
          </div>
        );
      })}

      {getOrCfg(['Units','Ems','Equipment',"SlaveLocalUM"], []).map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>{getOrCfg(['Units','Ems','Equipment',"SlaveLocalUM",i,'Type'], 'Unkown Local Unit') + ' (' + getOrCfg(['Units','Ems','Equipment',"SlaveLocalUM",i,'Name'], '') + ')'}</h3>
              <button className="ghost" onClick={() => removeElement(['Units','Ems','Equipment','SlaveLocalUM'],i)}>Entfernen</button>
            </div>
            <TextField
              leftLabel="Name"
              path={['Units','Ems','Equipment',"SlaveLocalUM",i,'Name']}
            />
            <TextField
              leftLabel="DisplayName"
              path={['Units','Ems','Equipment',"SlaveLocalUM",i,'DisplayName']}
            />
            <GuidField
              path={['Units','Ems','Equipment',"SlaveLocalUM",i,'Guid']}
            />
            <TextField
              leftLabel="IP Address"
              path={['Units','Ems','Equipment',"SlaveLocalUM",i,'Config','IpAddress']}
            />
          </div>
        );
      })}

      {getOrCfg(['Units','Ems','Equipment',"SlaveRemoteUM"], []).map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>{getOrCfg(['Units','Ems','Equipment',"SlaveRemoteUM",i,'Type'], 'Unkown Remote Unit') + ' (' + getOrCfg(['Units','Ems','Equipment',"SlaveRemoteUM",i,'Name'], '') + ')'}</h3>
              <button className="ghost" onClick={() => removeElement(['Units','Ems','Equipment','SlaveRemoteUM'],i)}>Remove</button>
            </div>
            <SelectField
              leftIsType
              options={['SlaveRemoteUM']}
              value={getOrCfg(['Units','Ems','Equipment',"SlaveRemoteUM",i,'Type'], 'SlaveRemoteUM')}
              onChange={() => {}}
            />
            <TextField
              leftLabel="Name"
              path={['Units','Ems','Equipment',"SlaveRemoteUM",i,'Name']}
            />
            <TextField
              leftLabel="DisplayName"
              path={['Units','Ems','Equipment',"SlaveRemoteUM",i,'DisplayName']}
            />
            <GuidField
              path={['Units','Ems','Equipment',"SlaveRemoteUM",i,'Guid']}
            />
            <TextField
              leftLabel="IP Address"
              path={['Units','Ems','Equipment',"SlaveRemoteUM",i,'Config','IpAddress']}
            />
          </div>
        );
      })}
    </div>
  );
}
