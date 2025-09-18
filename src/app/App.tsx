
import React from 'react'
import { useStore } from './store'
import EMSForm from '@/components/EMSForm'
import MainForm from '@/components/MainForm'
import { exportJSON, importJSON } from '@/utils/io'
import { configZ } from '@/domain/schema'

export default function App() {
  const { state, dispatch, errorIndex, issues, isValid } = useStore()
  const setCfg = (cfg:any)=>dispatch({ type:'SET', payload: cfg })

  const onExport = () => exportJSON(state, 'config.json')
  const onImport = async (file: File) => { const cfg = await importJSON(file); dispatch({ type:'SET', payload: cfg }) }

  return (
    <div className="container">
      <header className="row" style={{justifyContent:'space-between'}}>
        <h1>Battery Configurator</h1>
        <div className="row">
          <button onClick={onExport}>Export</button>
          <label className="btn">
            Import
            <input hidden type="file" accept="application/json" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onImport(f) }} />
          </label>
        </div>
      </header>

      {!isValid && (
        <div className="error-panel">
          <strong>Fehler</strong>
          <ul>{issues.map((er, i) => (<li key={i}>{er.message}</li>))}</ul>
        </div>
      )}

      <section className="card">
        <h2>Global</h2>
        <div className="field">
          <label>Type</label>
          <select value="Global" onChange={()=>{}}><option>Global</option></select>
          <span />
        </div>
        <div className="field">
          <label>Customer</label>
          <input value={state.Customer} onChange={(e)=>setCfg({ ...state, Customer: e.target.value })} />
          <div className="inline-error">{errorIndex.get('Customer')?.[0]}</div>
        </div>
        <div className="field">
          <label>Version</label>
          <select value={state.ModularPlc.Version} onChange={(e)=>setCfg({ ...state, ModularPlc: { ...state.ModularPlc, Version: e.target.value } })}>
            <option>0.0.1</option><option>0.0.2</option><option>0.0.3</option><option>1.0.0</option>
          </select>
          <div className="inline-error">{errorIndex.get('ModularPlc.Version')?.[0]}</div>
        </div>
        <div className="field">
          <label>Hardwarevariante</label>
          <select value={state.ModularPlc.Hardwarevariante} onChange={(e)=>setCfg({ ...state, ModularPlc: { ...state.ModularPlc, Hardwarevariante: e.target.value } })}>
            <option>BlokkV3</option><option>Terra</option><option>Variante1</option>
          </select>
          <small className="hint">Wechsel ändert nichts automatisch – nur Validierungsfehler.</small>
        </div>
      </section>

      <EMSForm cfg={state} setCfg={setCfg} errorIndex={errorIndex} />
      <MainForm cfg={state} setCfg={setCfg} errorIndex={errorIndex} />
    </div>
  )
}
