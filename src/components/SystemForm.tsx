
import React from 'react';
import { SelectField, TextField, NumberField } from './Fields';
import { components } from '@/spec/catalog';
import { getBatteryBalancingModes, getExternalControlOperationModes } from '@/spec/builder';
import { errorAt } from '@/utils/errors';
import { indexStringToString, stringToIndexString } from '@/utils/helper';

export default function SystemForm(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; errorIndex: any })
{
  const { setInCfg, getOrCfg, errorIndex } = props;

  return (
    <div className="card stack">
      <h2>System</h2>
      <TextField 
        path={['System', 'SerialNumber']}
        defLink={components.System.fields.SerialNumber}
      />
      <div className="card">
        <h3>Battery Balancing</h3>
        <SelectField
          path={['System', 'BatteryBalancing', 'PreemptiveMode']}
          defLink={components.System.fields.BatteryBalancing.group.PreemptiveMode}
          options={indexStringToString(getBatteryBalancingModes())}
          value={indexStringToString([getOrCfg(['System', 'BatteryBalancing', 'PreemptiveMode'], [0,''])])[0]}
          onChange={(v: string) => { setInCfg(['System', 'BatteryBalancing', 'PreemptiveMode'], stringToIndexString(v)); }}
        />
        <NumberField 
          path={['System', 'BatteryBalancing', 'PreemptiveDaysToEnable']}
          defLink={components.System.fields.BatteryBalancing.group.PreemptiveDaysToEnable}
        />
        <NumberField 
          path={['System', 'BatteryBalancing', 'PreemptiveMaxGridChargePower']}
          defLink={components.System.fields.BatteryBalancing.group.PreemptiveMaxGridChargePower}
        />
        <NumberField 
          path={['System', 'BatteryBalancing', 'ForcedDaysToEnable']}
          defLink={components.System.fields.BatteryBalancing.group.ForcedDaysToEnable}
        />
        <NumberField 
          path={['System', 'BatteryBalancing', 'ForcedMaxGridChargePowerPerInverter']}
          defLink={components.System.fields.BatteryBalancing.group.ForcedMaxGridChargePowerPerInverter}
        />
      </div>
      <div className="card">
        <h3>External Control</h3>
        <SelectField
          path={['System', 'ExternalControl', 'FallbackMode']}
          defLink={components.System.fields.ExternalControl.group.FallbackMode}
          options={indexStringToString(getExternalControlOperationModes())}
          value={indexStringToString([getOrCfg(['System', 'ExternalControl', 'FallbackMode'], [0,''])])[0]}
          onChange={(v: string) => { setInCfg(['System', 'ExternalControl', 'FallbackMode'], stringToIndexString(v)); }}
        />
      </div>
    </div>
  );
}
