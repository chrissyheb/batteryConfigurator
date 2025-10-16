
import React from 'react';
import { SelectField, TextField, GuidField, CheckField, NumberField } from './Fields';
import { PathType, createByKey, getInverterTypes, getBatteryTypes, getModbusTypes, getMainSmartmeterHardwares, getMainSmartmeterModels, getInverterHardwareTypes, getBatteryHardwareTypes, mainEquipmentKeys } from '@/spec/builder';
import { errorAt } from '@/utils/errors';
import { components } from '@/spec/catalog';
import { JSONValue } from '@/app/store';

function BatteryInverterCard(props: { idx: number; cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any })
{
  const { idx, cfg, setCfg, setInCfg, getOrCfg, delFromCfg } = props;

  const modbusAvailable = getOrCfg(['Units','Main','Equipment','BatteryInverter',idx,'Modbus'], false); 

  function removeElement(path: PathType, i?: number): void 
  {
    if (i !== undefined && i !== null) { delFromCfg(path.concat([i])); }
    else { delFromCfg(path); }
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3>{getOrCfg(['Units','Main','Equipment','BatteryInverter',idx,'Type'], 'Unkown Smartmeter Type') + ' (' + getOrCfg(['Units','Main','Equipment','BatteryInverter',idx,'Name'], '') + ')'}</h3>
        <button className="ghost" onClick={() => removeElement(['Units','Main','Equipment','BatteryInverter'],idx)}>Remove</button>
      </div>

      <TextField
        path={['Units','Main','Equipment','BatteryInverter',idx,'Name']}
        defLink={components.BatteryInverter.fields.Name}
      />
      <NumberField 
        value={idx}
        path={['Units','Main','Equipment','BatteryInverter',idx,'Index']}
        defLink={components.BatteryInverter.fields.Index}
      />

      <div className="card">
        <h3>Inverter</h3>
        <SelectField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Type']}
          defLink={components.BatteryInverterInverter.fields.group.Type}
          options={getInverterTypes()}
        />
        <TextField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Name']}
          defLink={components.BatteryInverterInverter.fields.group.Name}
        />
        <GuidField 
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Guid']}
          defLink={components.BatteryInverterInverter.fields.group.Guid}
        />
        <SelectField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Config','InverterType']}
          defLink={components.BatteryInverterInverter.fields.group.Config.group.InverterType}
          options={getInverterHardwareTypes()}
        />
        <NumberField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Config','NominalInverterPower']}
          defLink={components.BatteryInverterInverter.fields.group.Config.group.NominalInverterPower}
        />
        <TextField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Config','IpAddress']}
          defLink={components.BatteryInverterInverter.fields.group.Config.group.IpAddress}
        />
        <NumberField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Config','Port']}
          defLink={components.BatteryInverterInverter.fields.group.Config.group.Port}
        />
      </div>

      <div className="card">
        <h3>Battery</h3>
        <SelectField
          path={['Units','Main','Equipment','BatteryInverter',idx, 'Battery','Type']}
          defLink={components.BatteryInverterBattery.fields.group.Type}
          options={getBatteryTypes()}
        />
        <TextField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Name']}
          defLink={components.BatteryInverterBattery.fields.group.Name}
        />
        <GuidField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Guid']}
          defLink={components.BatteryInverterBattery.fields.group.Guid}
        />
        <SelectField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','BatteryType']}
          defLink={components.BatteryInverterBattery.fields.group.Config.group.BatteryType}
          options={getBatteryHardwareTypes()}
        />
        <NumberField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','BatteryCabinetCount']}
          defLink={components.BatteryInverterBattery.fields.group.Config.group.BatteryCabinetCount}
        />
        <NumberField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','BatteryCabinetModuleCount']}
          defLink={components.BatteryInverterBattery.fields.group.Config.group.BatteryCabinetModuleCount}
        />
        <TextField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','IpAddress']}
          defLink={components.BatteryInverterBattery.fields.group.Config.group.IpAddress}
        />
        <NumberField 
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','Port']}
          defLink={components.BatteryInverterBattery.fields.group.Config.group.Port}
        />
      </div>

      <div className="card">
        <h3>Modbus</h3>
        <SelectField 
          path={['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Type']}
          options={getModbusTypes()} 
          onChange=
          {(v: string) => 
            {
              if (v === getModbusTypes()[0]) { delFromCfg(['Units','Main','Equipment','BatteryInverter',idx,'Modbus']); }
              else { setInCfg(['Units','Main','Equipment','BatteryInverter',idx,'Modbus'], createByKey('BatteryInverterModbus',{n: idx})); }
            }
          }
        />
        {modbusAvailable && (<>
          <TextField 
            path={['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Name']}
            defLink={components.BatteryInverterModbus.fields.group.Name}
          />
          <GuidField 
            path={['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Guid']}
            defLink={components.BatteryInverterModbus.fields.group.Guid}
          />
          <TextField
            path={['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Config','IpAddress']}
            defLink={components.BatteryInverterModbus.fields.group.Config.group.IpAddress}
          />
          <NumberField 
            path={['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Config','Port']}
            defLink={components.BatteryInverterModbus.fields.group.Config.group.Port}
          />
        </>)}
      </div>
    </div>
  );
}
export default function MainForm(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any })
{
  const { cfg, setCfg, setInCfg, getCfg, getOrCfg, delFromCfg, hasCfg, errorIndex } = props;
    
    function addElement(path: PathType, type: mainEquipmentKeys): void
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

  return (
    <div className="card stack">
      <h2>Main</h2>

      <div className="card">
        <h3>Config - Main Unit</h3>
        <TextField
          path={['Units','Main','Config','IpAddressInternal']}
          defLink={components.MainConfig.fields.IpAddressInternal}
        />
        <CheckField 
          path={['Units','Main','Config','PowerSwitchMainAvailable']}
          defLink={components.MainConfig.fields.PowerSwitchMainAvailable}
        />
        <CheckField 
          path={['Units','Main','Config','SafetyRelayAvailable']}
          defLink={components.MainConfig.fields.SafetyRelayAvailable}
        />
        <NumberField 
          path={['Units','Main','Config','PowerChargeLimitLocal']}
          defLink={components.MainConfig.fields.PowerChargeLimitLocal}
        />
        <NumberField 
          path={['Units','Main','Config','PowerDischargeLimitLocal']}
          defLink={components.MainConfig.fields.PowerDischargeLimitLocal}
        />
        <NumberField 
          readOnly
          path={['Units','Main','Config','InverterCount']}
          defLink={components.MainConfig.fields.InverterCount}
        />
        <NumberField 
          readOnly
          path={['Units','Main','Config','BatteryCount']}
          defLink={components.MainConfig.fields.BatteryCount}
        />
      </div>
      <div className="card">
        <h3>{getOrCfg(['Units','Main','Equipment','SmartmeterMain','Type'], 'Unkown Smartmeter Type') + ' (' + getOrCfg(['Units','Main','Equipment',"SmartmeterMain",'Name'], '') + ')'}</h3>
        <TextField 
          path={['Units','Main','Equipment','SmartmeterMain','Name']}
          defLink={components.SmartmeterMain.fields.Name}
        />
        <TextField
          path={['Units','Main','Equipment','SmartmeterMain','DisplayName']}
          defLink={components.SmartmeterMain.fields.DisplayName}
        />
        <SelectField
          path={['Units','Main','Equipment','SmartmeterMain','HardwareType']}
          defLink={components.SmartmeterMain.fields.HardwareType}
          options={getMainSmartmeterHardwares()}
          onChange={(v: string) =>
          {
            const model = getMainSmartmeterModels(v)[0] ?? '';
            setInCfg(['Units','Main','Equipment','SmartmeterMain','HardwareType'], v);
            setInCfg(['Units','Main','Equipment','SmartmeterMain','HardwareModel'], model);
          }}
        />
        <SelectField
          path={['Units','Main','Equipment','SmartmeterMain','HardwareModel']}
          defLink={components.SmartmeterMain.fields.HardwareModel}
          options={getMainSmartmeterModels(getCfg(['Units','Main','Equipment','SmartmeterMain','HardwareType']))}
        />
        <GuidField
          path={['Units','Main','Equipment','SmartmeterMain','Guid']}
          defLink={components.SmartmeterMain.fields.Guid}
        />
      </div>

      <div className="row">
        <button onClick={() => {addElement(['Units','Main','Equipment'],'BatteryInverter')}}>+ BatteryInverter</button>
      </div>

      {((cfg.Units?.Main?.Equipment?.BatteryInverter ?? []).filter((e: any) => { return e.Type === 'BatteryInverter'; })).map((_: any, idx: number) =>
        {
          return <BatteryInverterCard key={idx} idx={idx} cfg={cfg} setCfg={setCfg} setInCfg={setInCfg} getCfg={getCfg} getOrCfg={getOrCfg} delFromCfg={delFromCfg} hasCfg={hasCfg} errorIndex={errorIndex} />;
        })
      }
    </div>
  );
}
