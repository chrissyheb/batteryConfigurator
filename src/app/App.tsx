
import React from 'react';
import { useRef, useState } from 'react';
import { useStore, useConfigAccessors } from './store';
import { SelectField, TextField, setGlobalProps } from '@/ui/Fields';
import { getInitialConfig, getLibraryVersion, getHardwareVariants, PathType } from '@/spec/builder';
import SystemSection from '@/forms/SystemSection';
import EmsSection from '@/forms/EmsSection';
import MainSection from '@/forms/MainSection';
import { exportJSON, importJSON } from '@/utils/io';
import { clearLocal } from '@/utils/storage';
import { formatPath, errorAt } from '@/utils/errors';
import { components } from '@/registry';

export default function App()
{
  const { state, dispatch, errorIndex, errorPrefixSet, issues, isValid, flatIssues, addIssue } = useStore();

  const {get, getOr, setIn, set, has, patch, del } = useConfigAccessors(state, dispatch);

  const onExport = (): void => { exportJSON(state, 'config.json'); };

  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const onImport = async (file: File): Promise<void> =>
  {
    try
    {
      const cfg = await importJSON(file);
      clearLocal();
      set(cfg);
      setImportError(null);
    }
    catch (e)
    {
      setImportError(e instanceof Error ? e.message : 'Import fehlgeschlagen: ungültige Datei');
    }
  };

  const onReset = (): void =>
  {
    clearLocal();
    const fresh = getInitialConfig();
    set(fresh);
  };

  setGlobalProps({get, getOr, setIn, errorIndex, errorPrefixSet, addIssue});

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

      {importError && (
        <div className="row">
          <div className="error-panel">
            <strong>Import Fehler</strong>
            <div>{importError}</div>
          </div>
        </div>
      )}

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
      <SystemSection cfg={state} setCfg={set} setInCfg={setIn} getCfg={get} getOrCfg={getOr} delFromCfg={del} errorIndex={errorIndex} errorPrefixSet={errorPrefixSet} />
      <EmsSection cfg={state} setCfg={set} setInCfg={setIn} getCfg={get} getOrCfg={getOr} delFromCfg={del} hasCfg={has} errorIndex={errorIndex} errorPrefixSet={errorPrefixSet} />
      <MainSection cfg={state} setCfg={set} setInCfg={setIn} getCfg={get} getOrCfg={getOr} delFromCfg={del} hasCfg={has} errorIndex={errorIndex} errorPrefixSet={errorPrefixSet} />

    </div>
  );
}
   