
import React from 'react';
import { useEffect } from 'react';
import { SelectField, TextField, GuidField, CheckField, NumberField } from './Fields';
import { PathType, createByKey, getInverterTypes, getBatteryTypes, getModbusTypes, getMainSmartmeterHardwares, getMainSmartmeterModels, getInverterHardwareTypes, getBatteryHardwareTypes, mainEquipmentKeys, mainConfigKeys } from '@/spec/builder';
import { components } from '@/spec/catalog';
import { JSONValue } from '@/app/store';
import { Collapsible } from '@/components/Cards';

function BatteryInverterCard(props: { idx: number; count: number; cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any, errorPrefixSet:any })
{
  const { idx, count, cfg, setCfg, setInCfg, getOrCfg, delFromCfg } = props;

  const modbusAvailable = getOrCfg(['Units','Main','Equipment','BatteryInverter',idx,'Modbus'], false); 

  function removeElement(path: PathType, i?: number): void 
  {
    if (i !== undefined && i !== null) { delFromCfg(path.concat([i])); }
    else { delFromCfg(path); }
  };

  return (
    <Collapsible 
      title={getOrCfg(['Units','Main','Equipment','BatteryInverter',idx,'Type'], 'Unkown Smartmeter Type') + ' (' + getOrCfg(['Units','Main','Equipment','BatteryInverter',idx,'Name'], '') + ')'} 
      className="card stack"
      actionType={(count === 1) ? undefined : "delete"}
      onAction={() => removeElement(['Units','Main','Equipment','BatteryInverter'],idx)}
      path={['Units','Main','Equipment','BatteryInverter',idx]}
      errorPrefixSet={props.errorPrefixSet}
    >
      <TextField
        path={['Units','Main','Equipment','BatteryInverter',idx,'Name']}
        defLink={components.BatteryInverter.fields.Name}
      />
      <NumberField 
        value={idx}
        path={['Units','Main','Equipment','BatteryInverter',idx,'Index']}
        defLink={components.BatteryInverter.fields.Index}
      />

      <Collapsible 
        title="Inverter"
        className="card"
        path={['Units','Main','Equipment','BatteryInverter',idx,'Inverter']}
        errorPrefixSet={props.errorPrefixSet}
      >
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
      </Collapsible>

      <Collapsible
        title="Battery"
        className="card"
        path={['Units','Main','Equipment','BatteryInverter',idx,'Battery']}
        errorPrefixSet={props.errorPrefixSet}
      >
        <SelectField
          path={['Units','Main','Equipment','BatteryInverter',idx,'Battery','Type']}
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
      </Collapsible>

      <Collapsible
        title="Modbus"
        className="card"
        path={['Units','Main','Equipment','BatteryInverter',idx,'Modbus']}
        errorPrefixSet={props.errorPrefixSet}
      >
        <SelectField 
          path={['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Type']}
            defLink={components.BatteryInverterModbus.fields.group.Type}
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
      </Collapsible>
    </Collapsible>
  );
}


export default function MainForm(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any, errorPrefixSet: any })
{
  const { cfg, setCfg, setInCfg, getCfg, getOrCfg, delFromCfg, hasCfg, errorIndex, errorPrefixSet } = props;
  
  function addElement(path: PathType, type: mainEquipmentKeys|mainConfigKeys): void
  {
    const list:JSONValue = getOrCfg(path, []);
    let idxNew: number = 0;
    if (!Array.isArray(list)) { return; }
    idxNew = list.length;
    const item: any = createByKey(type, { n: idxNew+1 });
    const pathNew: PathType = path.concat([idxNew]);
    setInCfg(pathNew, item);
  }

  
  function removeElement(path: PathType, i?: number): void 
  {
    if (i !== undefined && i !== null) { delFromCfg(path.concat([i])); }
    else { delFromCfg(path); }
  };

  
  // Effect -> get numbers of batteries and inverters -> change value on JSON-Structure change
  useEffect(() => {
    const BatteryCount = cfg.Units?.Main?.Equipment?.BatteryInverter?.length ?? 0; 
    if (cfg.Units?.Main?.Config?.BatteryCount !== BatteryCount) {
      setInCfg(['Units','Main','Config','BatteryCount'], BatteryCount);
    }
    const InverterCount = cfg.Units?.Main?.Equipment?.BatteryInverter?.length ?? 0;
    if (cfg.Units?.Main?.Config?.InverterCount !== InverterCount) {
      setInCfg(['Units','Main','Config','InverterCount'], InverterCount);
    }
  }, [cfg.Units?.Main?.Equipment?.BatteryInverter?.length ?? 0]);

  // Effect -> get numbers of batteries and inverters -> change value on JSON-Structure change
  useEffect(() => {
    if (cfg.Units?.Main?.Equipment?.SmartmeterMain?.HardwareModel !== 'El34x3') {
      setInCfg(['Units','Main','Equipment','SmartmeterMain','CurrentTransformerPrimaryCurrent'], '0A');
    }
  }, [cfg.Units?.Main?.Equipment?.SmartmeterMain?.HardwareModel ?? 'Virtual']);
  
  return (
    <Collapsible
      title="Main"
      defaultOpen
      className="card stack"
      path={['Units','Main']}
      errorPrefixSet={props.errorPrefixSet}
    >
      <Collapsible 
        title="Config - Main Unit"
        className="card"
        path={['Units','Main','Config']}
        errorPrefixSet={props.errorPrefixSet}
      >
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
      </Collapsible>
      
      <Collapsible 
        title="Config - Power Limit Groups" 
        className="card stack"
        actionType="add"
        onAction={() => {addElement(['Units','Main','Config','PowerLimitGroups'],'PowerLimitGroup')}}
        path={['Units','Main','Config','PowerLimitGroups']}
        errorPrefixSet={props.errorPrefixSet}
      >
        { getOrCfg(['Units','Main','Config','PowerLimitGroups'], []).map((e: any, i: number) =>
        {
          return (
            <Collapsible 
              key={i}
              title={'Power Limitation Group Main ' + (i+1)}
              className="card"
              actionType="delete"
              onAction={() => removeElement(['Units','Main','Config','PowerLimitGroups'],i)}
              path={['Units','Main','Config','PowerLimitGroups',i]}
              errorPrefixSet={props.errorPrefixSet}
            >
              <CheckField 
                path={['Units','Main','Config','PowerLimitGroups',i,'Active']}
                defLink={components.PowerLimitGroup.fields.Active}
              />
              <NumberField
                path={['Units','Main','Config','PowerLimitGroups',i,'PowerActiveLimit']}
                defLink={components.PowerLimitGroup.fields.PowerActiveLimit}
              />
              <NumberField
                path={['Units','Main','Config','PowerLimitGroups',i,'FallbackPowerLimitCharge']}
                defLink={components.PowerLimitGroup.fields.FallbackPowerLimitCharge}
              />
              <NumberField
                path={['Units','Main','Config','PowerLimitGroups',i,'FallbackPowerLimitDischarge']}
                defLink={components.PowerLimitGroup.fields.FallbackPowerLimitDischarge}
              />
            </Collapsible>
          );
        })}
      </Collapsible>

      <Collapsible
        title={getOrCfg(['Units','Main','Equipment','SmartmeterMain','Type'], 'Unkown Smartmeter Type') + ' (' + getOrCfg(['Units','Main','Equipment',"SmartmeterMain",'Name'], '') + ')'}
        className="card"
        path={['Units','Main','Equipment','SmartmeterMain']}
        errorPrefixSet={props.errorPrefixSet}
      >
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
        <NumberField 
          path={['Units','Main','Equipment','SmartmeterMain','CurrentTransformerPrimaryCurrent']}
          defLink={components.SmartmeterMain.fields.CurrentTransformerPrimaryCurrent}
          readOnly={getOrCfg(['Units','Main','Equipment','SmartmeterMain','HardwareModel'], 'Virtual') !== 'El34x3'}
        />
        <GuidField
          path={['Units','Main','Equipment','SmartmeterMain','Guid']}
          defLink={components.SmartmeterMain.fields.Guid}
        />
      </Collapsible>
      
      <Collapsible
        title="Battery & Inverter"
        className="card"
        actionType="add"
        onAction={() => {addElement(['Units','Main','Equipment','BatteryInverter'],'BatteryInverter')}}
        path={['Units','Main','Equipment','BatteryInverter']}
        errorPrefixSet={props.errorPrefixSet}
      >
        {((cfg.Units?.Main?.Equipment?.BatteryInverter ?? []).filter((e: any) => { return e.Type === 'BatteryInverter'; })).map((_: any, idx: number, array: any) =>
          {
            return <BatteryInverterCard key={idx} idx={idx} count={array.length} cfg={cfg} setCfg={setCfg} setInCfg={setInCfg} getCfg={getCfg} getOrCfg={getOrCfg} delFromCfg={delFromCfg} hasCfg={hasCfg} errorIndex={errorIndex} errorPrefixSet={errorPrefixSet} />;
          })
        }
      </Collapsible>
    </Collapsible>
  );
}
