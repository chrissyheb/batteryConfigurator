
import React from 'react';
import { useStore } from './store';
import { SelectField, TextField } from '@/components/Fields';
import { getLibraryVersion, getHardwareVariants } from '@/spec/builder';
import SystemForm from '@/components/SystemForm';
import EMSForm from '@/components/EMSForm';
import MainForm from '@/components/MainForm';
import { exportJSON, importJSON } from '@/utils/io';
import { clearLocal } from '@/utils/storage';
import { getInitialConfig } from '@/spec/builder';
import { formatPath } from '@/utils/errors';

export default function App()
{
  const { state, dispatch, errorIndex, issues, isValid, flatIssues } = useStore();

  const setCfg = (cfg: any): void => { dispatch({ type: 'SET', payload: cfg }); };

  const onExport = (): void => { exportJSON(state, 'config.json'); };

  const onImport = async (file: File): Promise<void> =>
  {
    const cfg = await importJSON(file);
    dispatch({ type: 'SET', payload: cfg });
  };

  const onReset = (): void =>
  {
    clearLocal();
    const fresh = getInitialConfig();
    dispatch({ type: 'SET', payload: fresh });
  };

  return (
    <div className="container">
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Battery Configurator</h1>
        <div className="row">
          <button className="ghost" onClick={onReset}>Reset</button>
          <button onClick={onExport}>Export</button>
          <label className="btn">Import
            <input hidden type="file" accept="application/json" onChange={(e) => { const f = e.target.files?.[0]; if (f) { onImport(f); } }} />
          </label>
        </div>
      </header>

      {!isValid && (
        <div className="error-panel">
          <strong>Fehler</strong>
          <ul>{flatIssues.map((er, i) => { return <li key={i}>{er.message}&nbsp;&nbsp;&nbsp;&nbsp;<code>@ {formatPath(er.path as (string | number)[] | undefined)}</code></li>; })}</ul>
        </div>
      )}

      <section className="card">
        <h2>Global</h2>
        <TextField 
          leftLabel="Customer"
          value={state.Global.Customer}
          onChange={(v: string) => { setCfg({ ...state, Global: { ...state.Global, Customer: v } }); }}
        />     
        <SelectField
          label="LibraryVersion"
          options={getLibraryVersion()}
          value={state.Global.ModularPlc.Version}
          onChange={(v: string) => { setCfg({ ...state, Global: { ...state.Global, ModularPlc: { ...state.Global.ModularPlc, Version: v } } }); }}
        />    
        <SelectField
          label="HardwareVariant"
          options={getHardwareVariants()}
          value={state.Global.ModularPlc.HardwareVariant}
          onChange={(v: string) => { setCfg({ ...state, Global: { ...state.Global, ModularPlc: { ...state.Global.ModularPlc, HardwareVariant: v } } }); }}
        />
      </section>
      <SystemForm cfg={state} setCfg={setCfg} errorIndex={errorIndex} />
      <EMSForm cfg={state} setCfg={setCfg} errorIndex={errorIndex} />
      <MainForm cfg={state} setCfg={setCfg} errorIndex={errorIndex} />
    </div>
  );
}
