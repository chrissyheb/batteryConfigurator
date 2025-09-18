
import { useEffect, useMemo, useReducer } from 'react'
import { v4 as uuid } from 'uuid'
import { loadLocal, saveLocal } from '@/utils/storage'
import { validate } from '@/spec/builder'
import { buildErrorIndex } from '@/utils/errors'
const defaultCfg: any = {
  Customer: 'Company XYZ', ModularPlc: { Version: '1.0.0', Hardwarevariante: 'Variante1' },
  Units: { Ems: { Equipment: [
    { Name: 'Smartmeter', Displayname: 'Smartmeter 1', Type: 'Smartmeter', Hardware: 'Phoenix', Guid: uuid(), Config: { Usecase: 'GridConnectionPointControl', Port: '5020' } },
    { Name: 'Slave1', Displayname: 'Slave 1', Type: 'SlaveLocalUM', Guid: uuid() }
  ]}, Main: { Type: 'Blokk', Equipment: [
    { Name: 'Smartmeter', Displayname: 'Local Power Measurement', Type: 'SmartmeterMain', Hardware: 'Virtual', Guid: uuid() },
    { Name: 'Kaco 1 + BMS 1 - Inverter1 / Battery1', Type: 'BatteryInverter',
      Inverter: { Name: 'Kaco1', Type: 'InverterKaco', Guid: uuid(), Config: { InverterType: 'Kaco', NominalInverterPower: '92000' } },
      Battery: { Name: 'Battery1', Type: 'BatteryPylontechM1xBms', Guid: uuid(), Config: { BatteryType: 'PylontechM1C', BatteryCabinetCount: '1', BatteryCabinetModuleCount: '24' } }
    }
  ]}}}
type Action = { type: 'SET', payload: any } | { type: 'PATCH', payload: Partial<any> }
const reducer = (s: any, a: Action): any => (a.type === 'SET' ? a.payload : { ...s, ...a.payload } as any)
export function useStore() {
  const [state, dispatch] = useReducer(reducer, null, () => loadLocal() ?? defaultCfg)
  const { issues } = useMemo(() => validate(state), [state])
  const errorIndex = useMemo(() => buildErrorIndex(issues), [issues])
  useEffect(() => { saveLocal(state) }, [state])
  return { state, dispatch, errorIndex, issues, isValid: issues.length === 0 }
}
