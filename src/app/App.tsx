
import React from 'react';
import { useStore, useConfigAccessors } from './store';
import { SelectField, TextField } from '@/components/Fields';
import { getLibraryVersion, getHardwareVariants } from '@/spec/builder';
import SystemForm from '@/components/SystemForm';
import EMSForm from '@/components/EMSForm';
import MainForm from '@/components/MainForm';
import { exportJSON, importJSON } from '@/utils/io';
import { clearLocal } from '@/utils/storage';
import { getInitialConfig } from '@/spec/builder';
import { formatPath, errorAt } from '@/utils/errors';

export default function App()
{
  const { state, dispatch, errorIndex, issues, isValid, flatIssues } = useStore();

  const {get, getOr, setIn, set, has, patch, del } = useConfigAccessors(state, dispatch);

  const setCfg = (cfg: any): void => { dispatch({ type: 'SET', payload: cfg }); };

  const onExport = (): void => { exportJSON(state, 'config.json'); };

  const onImport = async (file: File): Promise<void> =>
  {
    clearLocal();
    const cfg = await importJSON(file);
    set(cfg);
    //dispatch({ type: 'SET', payload: cfg });
  };

  const onReset = (): void =>
  {
    clearLocal();
    const fresh = getInitialConfig();
    set(fresh);
    //dispatch({ type: 'SET', payload: fresh });
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
          value={getOr(['Global', 'Customer'],'')}
          onChange={(v: string) => { setIn(['Global', 'Customer'], v );}}
          error={errorAt(errorIndex, ['Global', 'Customer'])}
        />     
        <SelectField
          label="Library Version"
          options={getLibraryVersion()}
          value={get(['Global', 'ModularPlc', 'Version'])}
          onChange={(v: string) => { setIn(['Global', 'ModularPlc', 'Version'], v );}}
          error={errorAt(errorIndex, ['Global', 'ModularPlc', 'Version'])}
        />    
        <SelectField
          label="Hardware Variant"
          options={getHardwareVariants()}
          value={get(['Global', 'ModularPlc', 'HardwareVariant'])}
          onChange={(v: string) => { setIn(['Global', 'ModularPlc', 'HardwareVariant'], v );}}
          error={errorAt(errorIndex, ['Global', 'ModularPlc', 'HardwareVariant'])}
        />
      </section>
      <SystemForm cfg={state} setCfg={set} setInCfg={setIn} getCfg={get} getOrCfg={getOr} errorIndex={errorIndex} />
      <EMSForm cfg={state} setCfg={set} setInCfg={setIn} getCfg={get} getOrCfg={getOr} delFromCfg={del} errorIndex={errorIndex} />
      <MainForm cfg={state} setCfg={set} errorIndex={errorIndex} />
    </div>
  );
}
