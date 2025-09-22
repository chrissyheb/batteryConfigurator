
import { useEffect, useMemo, useReducer } from 'react';
import { loadLocal, saveLocal } from '@/utils/storage';
import { validate, getInitialConfig } from '@/spec/builder';
import { buildErrorIndex } from '@/utils/errors';

// const defaultCfg: any = {
//   Customer: '',
//   ModularPlc: { Version: '0.0.3', HardwareVariant: 'Terra' },
//   Units: {
//     Ems: {
//       Equipment: [
//       ]
//     },
//     Main: {
//       Type: 'Blokk',
//       Equipment: [
//         { Name: 'Smartmeter', DisplayName: 'Local Power Measurement', Type: 'SmartmeterMain', Hardware: 'Virtual', Guid: uuid() },
//         { Name: 'Kaco 1 + BMS 1 - Inverter1 / Battery1', Type: 'BatteryInverter',
//           Inverter: { Name: 'Kaco1', Type: 'InverterKaco', Guid: uuid(), Config: { InverterType: 'Kaco', NominalInverterPower: '92000' } },
//           Battery: { Name: 'Battery1', Type: 'BatteryPylontechM1xBms', Guid: uuid(), Config: { BatteryType: 'PylontechM1C', BatteryCabinetCount: '1', BatteryCabinetModuleCount: '24' } } }
//       ]
//     }
//   }
// };

type Action = { type: 'SET'; payload: any } | { type: 'PATCH'; payload: Partial<any> };

function reducer(state: any, action: Action): any
{
  if (action.type === 'SET') { return action.payload; }
  return { ...state, ...action.payload } as any;
}

export function useStore()
{
  const [state, dispatch] = useReducer(reducer, null, () =>
  {
    const local = loadLocal();
    if (local) { return local; }
    return getInitialConfig();
    //return defaultCfg;
  });

  const result = useMemo(() => { return validate(state); }, [state]);
  const errorIndex = useMemo(() => { return buildErrorIndex(result.issues); }, [result.issues]);

  useEffect(() => { saveLocal(state); }, [state]);

  const isValid = result.issues.length === 0;

  return { state, dispatch, errorIndex, issues: result.issues, isValid };
}
