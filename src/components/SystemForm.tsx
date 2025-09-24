
import React from 'react';
import { SelectField, TextField, NumberField } from './Fields';
import { IndexStringType, components } from '@/spec/catalog';
import { getBatteryBalancingModes, getExternalControlOperationModes } from '@/spec/builder';
import { errorAt } from '@/utils/errors';
import { indexStringToString, stringToIndexString, stripUnit, addUnit } from '@/utils/helper';

export default function SystemForm(props: { cfg: any; setCfg: (c: any) => void; errorIndex: any })
{
  const { cfg, setCfg, errorIndex } = props;

  const balancingMode:string = '';




  return (
    <div className="card stack">
      <h2>System</h2>
      <TextField 
        leftLabel="Name"
        value={cfg.System.SerialNumber}
        onChange={(v: string) => 
        {
          const c = structuredClone(cfg);
          c.System.SerialNumber = v;
          setCfg(c);
        }}
        error={errorAt(errorIndex, ['System', 'SerialNumber'])}
      />
      <div className="card">
        <h3>Battery Balancing</h3>
        <SelectField
          label="PreemptiveBalancingMode"
          options={indexStringToString(getBatteryBalancingModes())}
          value={indexStringToString([cfg.System.BatteryBalancing.PreemptiveMode])[0]}
          onChange={(v: string) => 
          {
            const c = structuredClone(cfg);
            let out = stringToIndexString(v);
            console.log(out)
            c.System.BatteryBalancing.PreemptiveMode = out;//stringToIndexString(v);
            setCfg(c);
          }}
          error={errorAt(errorIndex, ['System', 'BatteryBalancing', 'PreemptiveMode'])}
        />
        <NumberField 
          leftLabel="PreemptiveDaysToEnable"
          value={cfg.System.BatteryBalancing.PreemptiveDaysToEnable}
          minValue="0"
          maxValue="365"
          step="1"
          onChange={(v: number) => 
          {
            const c = structuredClone(cfg);
            c.System.BatteryBalancing.PreemptiveDaysToEnable = v;
            setCfg(c);
          }}
          error={errorAt(errorIndex, ['System', 'BatteryBalancing', 'PreemptiveDaysToEnable'])}
        />
        <NumberField 
          leftLabel="PreemptiveMaxGridChargePower"
          rightLabel={components.System.fields.BatteryBalancing.group.PreemptiveMaxGridChargePower.unit}
          value={stripUnit(cfg.System.BatteryBalancing.PreemptiveMaxGridChargePower)[0]}
          minValue="0"
          maxValue="50"
          step="1"
          onChange={(v: number) => 
          {
            const c = structuredClone(cfg);
            c.System.BatteryBalancing.PreemptiveMaxGridChargePower = addUnit(v, components.System.fields.BatteryBalancing.group.PreemptiveMaxGridChargePower.unit);
            setCfg(c);
          }}
          error={errorAt(errorIndex, ['System', 'BatteryBalancing', 'PreemptiveMaxGridChargePower'])}
        />
        <NumberField 
          leftLabel="ForcedDaysToEnable"
          value={cfg.System.BatteryBalancing.ForcedDaysToEnable}
          minValue="0"
          maxValue="365"
          step="1"
          onChange={(v: number) => 
          {
            const c = structuredClone(cfg);
            c.System.BatteryBalancing.ForcedDaysToEnable = v;
            setCfg(c);
          }}
          error={errorAt(errorIndex, ['System', 'BatteryBalancing', 'ForcedDaysToEnable'])}
        />
        <NumberField 
          leftLabel="ForcedMaxGridChargePowerPerInverter"
          rightLabel={components.System.fields.BatteryBalancing.group.ForcedMaxGridChargePowerPerInverter.unit}
          value={stripUnit(cfg.System.BatteryBalancing.ForcedMaxGridChargePowerPerInverter)[0]}
          minValue="0"
          maxValue="50"
          step="1"
          onChange={(v: number) => 
          {
            const c = structuredClone(cfg);
            c.System.BatteryBalancing.ForcedMaxGridChargePowerPerInverter = addUnit(v, components.System.fields.BatteryBalancing.group.PreemptiveMaxGridChargePower.unit);
            setCfg(c);
          }}
          error={errorAt(errorIndex, ['System', 'BatteryBalancing', 'ForcedMaxGridChargePowerPerInverter'])}
        />
      </div>
      <div className="card">
        <h3>External Control</h3>
        <SelectField
          label="FallbackMode"
          options={indexStringToString(getExternalControlOperationModes())}
          value={indexStringToString([cfg.System.ExternalControl.FallbackMode])[0]}
          onChange={(v: string) => 
          {
            const c = structuredClone(cfg);
            let out = stringToIndexString(v);
            console.log(out)
            c.System.ExternalControl.FallbackMode = out;//stringToIndexString(v);
            setCfg(c);
          }}
          error={errorAt(errorIndex, ['System', 'ExternalControl', 'FallbackMode'])}
        />
      </div>
    </div>
  );
}
