
import React from 'react';
import { useStore } from './store';
import { SelectField, TextField } from '@/components/Fields';
import { getLibraryVersion, getHardwareVariants } from '@/spec/builder';
import EMSForm from '@/components/EMSForm';
import MainForm from '@/components/MainForm';
import { exportJSON, importJSON } from '@/utils/io';

export default function App()
{
  const { state, dispatch, errorIndex, issues, isValid } = useStore();

  const setCfg = (cfg: any): void => { dispatch({ type: 'SET', payload: cfg }); };

  const onExport = (): void => { exportJSON(state, 'config.json'); };

  const onImport = async (file: File): Promise<void> =>
  {
    const cfg = await importJSON(file);
    dispatch({ type: 'SET', payload: cfg });
  };

  return (
    <div className="container">
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Battery Configurator</h1>
        <div className="row">
          <button onClick={onExport}>Export</button>
          <label className="btn">Import
            <input hidden type="file" accept="application/json" onChange={(e) => { const f = e.target.files?.[0]; if (f) { onImport(f); } }} />
          </label>
        </div>
      </header>

      {!isValid && (
        <div className="error-panel">
          <strong>Fehler</strong>
          <ul>{issues.map((er, i) => { return <li key={i}>{er.message}</li>; })}</ul>
        </div>
      )}

      <section className="card">
        <h2>Global</h2>
        <TextField 
          leftLabel="Customer"
          value={state.Customer}
          onChange={(v: string) => { setCfg({ ...state, Customer: v }); }}
        />     
        <SelectField
          label="LibraryVersion"
          options={getLibraryVersion()}
          value={state.ModularPlc.Version}
          onChange={(v: string) => { setCfg({ ...state, ModularPlc: { ...state.ModularPlc, Version: v } }); }}
        />    
        <SelectField
          label="HardwareVariant"
          options={getHardwareVariants()}
          value={state.ModularPlc.HardwareVariant}
          onChange={(v: string) => { setCfg({ ...state, ModularPlc: { ...state.ModularPlc, HardwareVariant: v } }); }}
        />
      </section>

      <EMSForm cfg={state} setCfg={setCfg} errorIndex={errorIndex} />
      <MainForm cfg={state} setCfg={setCfg} errorIndex={errorIndex} />
    </div>
  );
}
