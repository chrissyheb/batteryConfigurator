
import React from 'react';
import { SelectField, TextField, NumberField } from './Fields';
import { components } from '@/spec/catalog';
import { getBatteryBalancingModes, getExternalControlOperationModes } from '@/spec/builder';
import { errorAt } from '@/utils/errors';
import { indexStringToString, stringToIndexString, stripUnit, addUnit } from '@/utils/helper';

export default function SystemForm(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; errorIndex: any })
{
  const { cfg, setCfg, setInCfg, getCfg, getOrCfg, errorIndex } = props;

  return (
    <div className="card stack">
      <h2>System</h2>
      <TextField 
        leftLabel="Name"
        value={getOrCfg(['System', 'SerialNumber'],'')}
        onChange={(v: string) => { setInCfg(['System', 'SerialNumber'], v); }}
        error={errorAt(errorIndex, ['System', 'SerialNumber'])}
      />
      <div className="card">
        <h3>Battery Balancing</h3>
        <SelectField
          label="PreemptiveBalancingMode"
          options={indexStringToString(getBatteryBalancingModes())}
          value={indexStringToString([getOrCfg(['System', 'BatteryBalancing', 'PreemptiveMode'], [0,''])])[0]}
          onChange={(v: string) => { setInCfg(['System', 'BatteryBalancing', 'PreemptiveMode'], stringToIndexString(v)); }}
          error={errorAt(errorIndex, ['System', 'BatteryBalancing', 'PreemptiveMode'])}
        />
        <NumberField 
          leftLabel="PreemptiveDaysToEnable"
          value={getOrCfg(['System', 'BatteryBalancing', 'PreemptiveDaysToEnable'], 0)}
          minValue="0"
          maxValue="365"
          step="1"
          onChange={(v: number) => { setInCfg(['System', 'BatteryBalancing', 'PreemptiveDaysToEnable'], v); }}
          error={errorAt(errorIndex, ['System', 'BatteryBalancing', 'PreemptiveDaysToEnable'])}
        />
        <NumberField 
          leftLabel="PreemptiveMaxGridChargePower"
          rightLabel={components.System.fields.BatteryBalancing.group.PreemptiveMaxGridChargePower.unit}
          value={stripUnit(getCfg(['System', 'BatteryBalancing', 'PreemptiveMaxGridChargePower']))}
          minValue="0"
          maxValue="50"
          step="1"
          onChange={(v: number) => { setInCfg(['System', 'BatteryBalancing', 'PreemptiveMaxGridChargePower'], addUnit(v, components.System.fields.BatteryBalancing.group.PreemptiveMaxGridChargePower.unit)); }}
          error={errorAt(errorIndex, ['System', 'BatteryBalancing', 'PreemptiveMaxGridChargePower'])}
        />
        <NumberField 
          leftLabel="ForcedDaysToEnable"
          value={getOrCfg(['System', 'BatteryBalancing', 'ForcedDaysToEnable'], 0)}
          minValue="0"
          maxValue="365"
          step="1"
          onChange={(v: number) => {setInCfg(['System', 'BatteryBalancing', 'ForcedDaysToEnable'], v); }}
          error={errorAt(errorIndex, ['System', 'BatteryBalancing', 'ForcedDaysToEnable'])}
        />
        <NumberField 
          leftLabel="ForcedMaxGridChargePowerPerInverter"
          rightLabel={components.System.fields.BatteryBalancing.group.ForcedMaxGridChargePowerPerInverter.unit}
          value={stripUnit(getCfg(['System', 'BatteryBalancing', 'ForcedMaxGridChargePowerPerInverter']))}
          minValue="0"
          maxValue="50"
          step="1"
          onChange={(v: number) => { setInCfg(['System', 'BatteryBalancing', 'ForcedMaxGridChargePowerPerInverter'], addUnit(v, components.System.fields.BatteryBalancing.group.ForcedMaxGridChargePowerPerInverter.unit)); }}
          error={errorAt(errorIndex, ['System', 'BatteryBalancing', 'ForcedMaxGridChargePowerPerInverter'])}
        />
      </div>
      <div className="card">
        <h3>External Control</h3>
        <SelectField
          label="FallbackMode"
          options={indexStringToString(getExternalControlOperationModes())}
          value={indexStringToString([getOrCfg(['System', 'ExternalControl', 'FallbackMode'], [0,''])])[0]}
          onChange={(v: string) => { setInCfg(['System', 'ExternalControl', 'FallbackMode'], stringToIndexString(v)); }}
          error={errorAt(errorIndex, ['System', 'ExternalControl', 'FallbackMode'])}
        />
      </div>
    </div>
  );
}
