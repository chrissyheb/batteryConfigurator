
import React from 'react';
import { useEffect } from 'react';
import { SelectField, TextField, GuidField, NumberField, CheckField } from './Fields';
import { PathType, emsEquipmentKeys, createByKey, getEmsSmartmeterHardwares, getEmsSmartmeterModels, getEmsSmartmeterUseCaseTypes } from '@/spec/builder';
import { indexStringToString, stringToIndexString } from '@/utils/helper';
import { components } from '@/spec/catalog';
import { JSONValue } from '@/app/store';

export default function EMSForm(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any })
{
  const { cfg, setInCfg, getOrCfg, delFromCfg,  errorIndex } = props;
  
  let systemsInParallelCount: number = 0;

  // Effekt: NumberOfArrayEntries automatisch nachführen
  useEffect(() => {
    const systemsInParallelCount = cfg.Units.Ems.Equipment.RemoteSystems.length+1; // add local unit
    if (cfg.Units.Ems.Config.SystemsInParallelCount !== systemsInParallelCount) {
      setInCfg(['Units','Ems','Config','SystemsInParallelCount'], systemsInParallelCount);
    }
  }, [cfg.Units?.Ems?.Equipment?.RemoteSystems?.length ?? 0]); // <— wichtig: auf Länge hören, nicht auf ganze Struktur!
  
  // Effekt: NumberOfArrayEntries automatisch nachführen
  useEffect(() => {
    const smartmeterCount = cfg.Units.Ems.Equipment.Smartmeter.length;
    if (cfg.Units.Ems.Config.SmartmeterCount !== smartmeterCount) {
      setInCfg(['Units','Ems','Config','SmartmeterCount'], smartmeterCount);
    }
  }, [cfg.Units?.Ems?.Equipment?.Smartmeter?.length ?? 0]); // <— wichtig: auf Länge hören, nicht auf ganze Struktur!
  

  function addElement(path: PathType, type: emsEquipmentKeys): void
  {
    //const pathExt: PathType = path.concat([type]);
    const list:JSONValue = getOrCfg(path, []);
    let idxNew: number = 0;
    if (!Array.isArray(list)) { return; }
    idxNew = list.length;
    const item: any = createByKey(type, { n: idxNew+1 });
    const pathNew: PathType = path.concat([idxNew]);
    setInCfg(pathNew, item);

    //setInCfg(['Units','Ems','Config','SmartmeterCount'], smartmeterCount);
    //setInCfg(['Units','Ems','Config','SystemsInParallelCount'],  getOrCfg(['Units','Ems','Equipment','RemoteSystems'], []).length + 1);
    
  }

  function removeElement(path: PathType, i?: number): void 
  {
    if (i !== undefined && i !== null) { delFromCfg(path.concat([i])); }
    else { delFromCfg(path); }

    //setInCfg(['Units','Ems','Config','SmartmeterCount'], smartmeterCount);
    //setInCfg(['Units','Ems','Config','SystemsInParallelCount'],  getOrCfg(['Units','Ems','Equipment','RemoteSystems'], []).length + 1);
    
  };

  return (
    <div className="card stack">
      <h2>EMS</h2>
      <div className="card">
        <h3>Config - Grid Connection Point</h3>
        <NumberField 
          path={['Units','Ems','Config','GridConnectionPoint','PowerGridConsumptionLimit']}
          defLink={components.EmsConfig.fields.GridConnectionPoint.group.PowerGridConsumptionLimit}
        />
        <NumberField 
          path={['Units','Ems','Config','GridConnectionPoint','PowerGridFeedInLimit']}
          defLink={components.EmsConfig.fields.GridConnectionPoint.group.PowerGridFeedInLimit}
        />
        <NumberField 
          path={['Units','Ems','Config','GridConnectionPoint','PowerGridConsumptionOffset']}
          defLink={components.EmsConfig.fields.GridConnectionPoint.group.PowerGridConsumptionOffset}
        />
      </div>
      
      <div className="card">
        <h3>Config - Master/Slave</h3>
        <NumberField 
          path={['Units','Ems','Config','MasterSlave','PowerActiveInstalledTotal']}
          defLink={components.EmsConfig.fields.MasterSlave.group.PowerActiveInstalledTotal}
        />
        <NumberField 
          path={['Units','Ems','Config','MasterSlave','CapacityInstalledTotal']}
          defLink={components.EmsConfig.fields.MasterSlave.group.CapacityInstalledTotal}
        />
        <NumberField 
          path={['Units','Ems','Config','MasterSlave','PowerChargeLimitTotal']}
          defLink={components.EmsConfig.fields.MasterSlave.group.PowerChargeLimitTotal}
        />
        <NumberField 
          path={['Units','Ems','Config','MasterSlave','PowerDischargeLimitTotal']}
          defLink={components.EmsConfig.fields.MasterSlave.group.PowerDischargeLimitTotal}
        />
      </div>

      <div className="row">
        <button onClick={() => {addElement(['Units','Ems','Equipment','Smartmeter'],'Smartmeter')}}>+ Smartmeter</button>
        <button onClick={() => {addElement(['Units','Ems','Equipment','RemoteSystems'],'SlaveRemoteUM')}}>+ Remote System</button>
      </div>
      <div className="card">
        
        <NumberField 
          path={['Units','Ems','Config','SmartmeterCount']}
          defLink={components.EmsConfig.fields.SmartmeterCount}
        />
        <NumberField 
          path={['Units','Ems','Config','SystemsInParallelCount']}
          defLink={components.EmsConfig.fields.SystemsInParallelCount}
        />
      </div>

      {getOrCfg(['Units','Ems','Equipment',"Smartmeter"], []).map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>{getOrCfg(['Units','Ems','Equipment',"Smartmeter",i,'Type'], 'Unkown Smartmeter') + ' (' + getOrCfg(['Units','Ems','Equipment',"Smartmeter",i,'DisplayName'], '') + ')'}</h3>
              <button className="ghost" onClick={() => removeElement(['Units','Ems','Equipment','Smartmeter'],i)}>Remove</button>
            </div>
            <TextField 
              path={['Units','Ems','Equipment',"Smartmeter",i,'Name']}
              defLink={components.Smartmeter.fields.Name}
            />
            <TextField
              path={['Units','Ems','Equipment',"Smartmeter",i,'DisplayName']}
              defLink={components.Smartmeter.fields.DisplayName}
            />
            <SelectField
              path={['Units','Ems','Equipment',"Smartmeter",i,'HardwareType']}
              defLink={components.Smartmeter.fields.HardwareType}
              options={getEmsSmartmeterHardwares()}
              onChange={(v: string) =>
              {
                const models = getEmsSmartmeterModels(v);
                setInCfg(['Units','Ems','Equipment',"Smartmeter",i,'HardwareType'], v);
                setInCfg(['Units','Ems','Equipment',"Smartmeter",i,'HardwareModel'], models[0]);
              }}
            />
            <SelectField
              path={['Units','Ems','Equipment',"Smartmeter",i,'HardwareModel']}
              defLink={components.Smartmeter.fields.HardwareModel}
              options={getEmsSmartmeterModels(getOrCfg(['Units','Ems','Equipment',"Smartmeter",i,'HardwareType'], ''))}
            />
            <GuidField
              path={['Units','Ems','Equipment',"Smartmeter",i,'Guid']}
              defLink={components.Smartmeter.fields.Guid}
            />
            <SelectField
              path={['Units','Ems','Equipment',"Smartmeter",i,'Config','Usecase']}
              defLink={components.Smartmeter.fields.Config.group.Usecase}
              options={indexStringToString(getEmsSmartmeterUseCaseTypes())}
              value={indexStringToString([getOrCfg(['Units','Ems','Equipment',"Smartmeter",i,'Config','Usecase'], [0,''])])[0]}
              onChange={(v: string) => { setInCfg(['Units','Ems','Equipment',"Smartmeter",i,'Config','Usecase'], stringToIndexString(v)); }}
            />
            <TextField
              path={['Units','Ems','Equipment',"Smartmeter",i,'Config','IpAddress']}
              defLink={components.Smartmeter.fields.Config.group.IpAddress}
            />
            <NumberField 
              path={['Units','Ems','Equipment',"Smartmeter",i,'Config','Port']}
              defLink={components.Smartmeter.fields.Config.group.Port}
            />
          </div>
        );
      })}

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>{(getOrCfg(['Units','Ems','Equipment',"LocalSystem",'Type'], 'Unkown Local System') === 'SlaveLocalUM' ? 'LocalSystem' : 'Unknown Local System') + ' (' + getOrCfg(['Units','Ems','Equipment',"LocalSystem",'DisplayName'], '') + ')'}</h3>
        </div>
        <TextField
          path={['Units','Ems','Equipment',"LocalSystem",'Name']}
          defLink={components.SlaveLocalUM.fields.Name}
        />
        <TextField
          path={['Units','Ems','Equipment',"LocalSystem",'DisplayName']}
          defLink={components.SlaveLocalUM.fields.DisplayName}
        />
        <GuidField
          path={['Units','Ems','Equipment',"LocalSystem",'Guid']}
          defLink={components.SlaveLocalUM.fields.Guid}
        />
        <TextField
          path={['Units','Ems','Equipment',"LocalSystem",'Config','IpAddress']}
          defLink={components.SlaveLocalUM.fields.Config.group.IpAddress}
        />
      </div>

      {getOrCfg(['Units','Ems','Equipment',"RemoteSystems"], []).map((e: any, i: number) =>
      {
        return (
          <div key={i} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>{(getOrCfg(['Units','Ems','Equipment',"RemoteSystems",i,'Type'], 'Unkown Remote System') === 'SlaveRemoteUM' ? 'RemoteSystem' : 'Unknown Remote System') + ' (' + getOrCfg(['Units','Ems','Equipment',"RemoteSystems",i,'DisplayName'], '') + ')'}</h3>
              <button className="ghost" onClick={() => removeElement(['Units','Ems','Equipment','RemoteSystems'],i)}>Remove</button>
            </div>
            <TextField
              path={['Units','Ems','Equipment',"RemoteSystems",i,'Name']}
              defLink={components.SlaveRemoteUM.fields.Name}
            />
            <TextField
              path={['Units','Ems','Equipment',"RemoteSystems",i,'DisplayName']}
              defLink={components.SlaveRemoteUM.fields.DisplayName}
            />
            <GuidField
              path={['Units','Ems','Equipment',"RemoteSystems",i,'Guid']}
              defLink={components.SlaveRemoteUM.fields.Guid}
            />
            <TextField
              path={['Units','Ems','Equipment',"RemoteSystems",i,'Config','IpAddress']}
              defLink={components.SlaveRemoteUM.fields.Config.group.IpAddress}
            />
          </div>
        );
      })}
    </div>
  );
}
