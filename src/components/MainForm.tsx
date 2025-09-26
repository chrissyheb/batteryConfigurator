
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
        leftLabel="Name"
        path={['Units','Main','Equipment','BatteryInverter',idx,'Name']}
      />

      <div className="card">
        <h3>Inverter</h3>
        <SelectField
          leftIsType
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Type']}
          options={getInverterTypes()}
        />
        <TextField
          leftLabel="Name"
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Name']}
        />
        <GuidField 
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Guid']}
        />
        <SelectField
          label="InverterType"
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Config','InverterType']}
          options={getInverterHardwareTypes()}
        />
        <NumberField
          leftLabel="NominalInverterPower"
          path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter','Config','NominalInverterPower']}
          rightLabel={components.BatteryInverterInverter.fields.group.Config.group.NominalInverterPower.unit}
          minValue="1"
          maxValue="250"
        />
      </div>

      <div className="card">
        <h3>Battery</h3>
        <SelectField
          leftIsType
          path={['Units','Main','Equipment','BatteryInverter',idx, 'Battery','Type']}
          options={getBatteryTypes()}
        />
        <TextField
          leftLabel="Name"
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Name']}
        />
        <GuidField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Guid']}
        />
        <SelectField
          label="BatteryType"
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','BatteryType']}
          options={getBatteryHardwareTypes()}
        />
        <NumberField
          leftLabel="BatteryCabinetCount"
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','BatteryCabinetCount']}
          minValue="1"
          maxValue="4"
          step="1"
        />
        <NumberField
          leftLabel="BatteryCabinetModuleCount"
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Config','BatteryCabinetModuleCount']}
          minValue="1"
          maxValue="25"
          step="1"
        />
      </div>

      <div className="card">
        <h3>Modbus</h3>
        <SelectField 
          leftIsType 
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
            leftLabel="Name"
            path={['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Name']}
          />
          <GuidField 
            path={['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Guid']}
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
          leftLabel="IP Address Internal"
          path={['Units','Main','Config','IpAddressInternal']}
        />
        <CheckField 
          label="Power Switch Available"
          path={['Units','Main','Config','PowerSwitchMainAvailable']}
        />
        <NumberField 
          leftLabel="Local Power Charge Limit"
          path={['Units','Main','Config','PowerChargeLimitLocal']}
          rightLabel={components.EmsConfig.fields.GridConnectionPoint.group.PowerGridConsumptionLimit.unit}
          minValue="0"
        />
        <NumberField 
          leftLabel="Local Power Discharge Limit"
          path={['Units','Main','Config','PowerDischargeLimitLocal']}
          rightLabel={components.EmsConfig.fields.GridConnectionPoint.group.PowerGridFeedInLimit.unit}
          minValue="0"
        />
      </div>
      <div className="card">
        <h3>{getOrCfg(['Units','Main','Equipment','SmartmeterMain','Type'], 'Unkown Smartmeter Type') + ' (' + getOrCfg(['Units','Main','Equipment',"SmartmeterMain",'Name'], '') + ')'}</h3>
        <TextField 
          leftLabel="Name"
          path={['Units','Main','Equipment','SmartmeterMain','Name']}
        />
        <TextField
          leftLabel="DisplayName"
          path={['Units','Main','Equipment','SmartmeterMain','DisplayName']}
        />
        <SelectField
          label="HardwareType"
          path={['Units','Main','Equipment','SmartmeterMain','HardwareType']}
          options={getMainSmartmeterHardwares()}
          onChange={(v: string) =>
          {
            const model = getMainSmartmeterModels(v)[0] ?? '';
            setInCfg(['Units','Main','Equipment','SmartmeterMain','HardwareType'], v);
            setInCfg(['Units','Main','Equipment','SmartmeterMain','HardwareModel'], model);
          }}
        />
        <SelectField
          label="HardwareModel"
          path={['Units','Main','Equipment','SmartmeterMain','HardwareModel']}
          options={getMainSmartmeterModels(getCfg(['Units','Main','Equipment','SmartmeterMain','HardwareType']))}
        />
        <GuidField
          path={['Units','Main','Equipment','SmartmeterMain','Guid']}
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
