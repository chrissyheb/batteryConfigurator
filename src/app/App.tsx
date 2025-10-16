
import React from 'react';
import { useRef } from 'react';
import { useStore, useConfigAccessors } from './store';
import { SelectField, TextField, setGlobalProps } from '@/components/Fields';
import { getInitialConfig, getLibraryVersion, getHardwareVariants, PathType } from '@/spec/builder';
import SystemForm from '@/components/SystemForm';
import EMSForm from '@/components/EMSForm';
import MainForm from '@/components/MainForm';
import { exportJSON, importJSON } from '@/utils/io';
import { clearLocal } from '@/utils/storage';
import { formatPath, errorAt } from '@/utils/errors';
import { components } from '@/spec/catalog';

export default function App()
{
  const { state, dispatch, errorIndex, issues, isValid, flatIssues, addIssue } = useStore();

  const {get, getOr, setIn, set, has, patch, del } = useConfigAccessors(state, dispatch);

  const onExport = (): void => { exportJSON(state, 'config.json'); };

  const fileRef = useRef<HTMLInputElement>(null);
  const onImport = async (file: File): Promise<void> =>
  {
    console.log('Import start')
    clearLocal();
    const cfg = await importJSON(file);
    console.log('Import: data read')
    set(cfg);
    console.log('Import done')
  };

  const onReset = (): void =>
  {
    clearLocal();
    const fresh = getInitialConfig();
    set(fresh);
  };

  setGlobalProps({get, getOr, setIn, errorIndex, addIssue});

  return (
    <div className="container">
      <header className="row" {...{ style: { 
          backgroundColor: flatIssues.length > 0 ? 'var(--errBg)' : 'var(--bg)', 
          borderColor: flatIssues.length > 0 ? 'var(--errBorder)' : 'var(--bg)' } }}>
        <h1>Terra / BLOKK PLC Configurator</h1>
        <div className="row">
          <button className="ghost" onClick={onReset}>Reset</button>
          <button onClick={onExport}>Export</button>
          <button onClick={() => fileRef.current?.click()}>Import</button>
          <input hidden ref={fileRef} type="file" accept="application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = ""; // reset -> not only first click triggers an import of same file
            }}
          />
        </div>
      </header>

      {!isValid && (
        <div className="row">
          <div className="error-panel">
            <strong>Fehler</strong>
            <ul>{flatIssues.map((er, i) => { return <li key={i}>{er.message}&nbsp;&nbsp;&nbsp;&nbsp;<code>@ {formatPath(er.path as PathType | undefined)}</code></li>; })}</ul>
          </div>
        </div>
      )}

      <section className="card">
        <h2>Global</h2>
        <TextField 
          path={['Global', 'Customer']}
          defLink={components.Global.fields.Customer}
        />     
        <SelectField
          path={['Global', 'ModularPlc', 'Version']}
          defLink={components.Global.fields.ModularPlc.group.Version}
          options={getLibraryVersion()}
        />    
        <SelectField
          label="Hardware Variant"
          path={['Global', 'ModularPlc', 'HardwareVariant']}
          defLink={components.Global.fields.ModularPlc.group.HardwareVariant}
          options={getHardwareVariants()}
        />
      </section>
      <SystemForm cfg={state} setCfg={set} setInCfg={setIn} getCfg={get} getOrCfg={getOr} errorIndex={errorIndex} />
      <EMSForm cfg={state} setCfg={set} setInCfg={setIn} getCfg={get} getOrCfg={getOr} delFromCfg={del} hasCfg={has} errorIndex={errorIndex} />
      <MainForm cfg={state} setCfg={set} setInCfg={setIn} getCfg={get} getOrCfg={getOr} delFromCfg={del} hasCfg={has} errorIndex={errorIndex} />

    </div>
  );
}
   