
import React from 'react';
import { SelectField, TextField, NumberField } from './Fields';
import { components } from '@/spec/catalog';
import { getBatteryBalancingModes, getExternalControlOperationModes } from '@/spec/builder';
import { errorAt } from '@/utils/errors';
import { indexStringToString, stringToIndexString, stripUnit, addUnit } from '@/utils/helper';

export default function SystemForm(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; errorIndex: any })
{
  const { setInCfg, getOrCfg, errorIndex } = props;

  return (
    <div className="card stack">
      <h2>System</h2>
      <TextField 
        leftLabel="Serial Number"
        path={['System', 'SerialNumber']}
      />
      <div className="card">
        <h3>Battery Balancing</h3>
        <SelectField
          label="PreemptiveBalancingMode"
          path={['System', 'BatteryBalancing', 'PreemptiveMode']}
          options={indexStringToString(getBatteryBalancingModes())}
          value={indexStringToString([getOrCfg(['System', 'BatteryBalancing', 'PreemptiveMode'], [0,''])])[0]}
          onChange={(v: string) => { setInCfg(['System', 'BatteryBalancing', 'PreemptiveMode'], stringToIndexString(v)); }}
        />
        <NumberField 
          leftLabel="PreemptiveDaysToEnable"
          path={['System', 'BatteryBalancing', 'PreemptiveDaysToEnable']}
          minValue="0"
          maxValue="365"
          step="1"
        />
        <NumberField 
          leftLabel="PreemptiveMaxGridChargePower"
          path={['System', 'BatteryBalancing', 'PreemptiveMaxGridChargePower']}
          rightLabel={components.System.fields.BatteryBalancing.group.PreemptiveMaxGridChargePower.unit}
          minValue="0"
          maxValue="50"
          step="1"
        />
        <NumberField 
          leftLabel="ForcedDaysToEnable"
          path={['System', 'BatteryBalancing', 'ForcedDaysToEnable']}
          minValue="0"
          maxValue="365"
          step="1"
        />
        <NumberField 
          leftLabel="ForcedMaxGridChargePowerPerInverter"
          path={['System', 'BatteryBalancing', 'ForcedMaxGridChargePowerPerInverter']}
          rightLabel={components.System.fields.BatteryBalancing.group.ForcedMaxGridChargePowerPerInverter.unit}
          minValue="0"
          maxValue="50"
          step="1"
        />
      </div>
      <div className="card">
        <h3>External Control</h3>
        <SelectField
          label="FallbackMode"
          path={['System', 'ExternalControl', 'FallbackMode']}
          options={indexStringToString(getExternalControlOperationModes())}
          value={indexStringToString([getOrCfg(['System', 'ExternalControl', 'FallbackMode'], [0,''])])[0]}
          onChange={(v: string) => { setInCfg(['System', 'ExternalControl', 'FallbackMode'], stringToIndexString(v)); }}
        />
      </div>
    </div>
  );
}
