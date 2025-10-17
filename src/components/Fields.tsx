
import React, { useEffect, useId } from 'react';
import { v4 as uuid } from 'uuid';
import { errorAt, ErrorIndex, SimpleIssue } from '@/utils/errors';
import { PathType } from '@/spec/builder';
import { JSONValue } from '@/app/store';
import { stripUnit, addUnit, clearVariableName } from '@/utils/helper';

export interface GlobalFns {
  get: (path: PathType) => any;
  getOr: (path: PathType, fallback: any) => any; //<T>(value: T, fallback: T) => T;
  setIn: (path: PathType, value: JSONValue) => void;
  errorIndex: ErrorIndex;
  addIssue: (issue: SimpleIssue) => void; 
}

const defaults: GlobalFns = {
  get: (path) => path,
  getOr: (path, fallback) => (path === undefined || path === null ? fallback : path),
  setIn: () => { throw new Error('setIn undefined -> call Fields.setGlobalProps()'); },
  errorIndex: new Map<string, string[]>(),
  addIssue: (issue) => issue
};

const g: Partial<GlobalFns> = { ...defaults };

function gFun() : GlobalFns {
  return {
    get: g.get ?? defaults.get,
    getOr: g.getOr ?? defaults.getOr,
    setIn: g.setIn ?? defaults.setIn,
    errorIndex: g.errorIndex ?? defaults.errorIndex,
    addIssue: g.addIssue ?? defaults.addIssue
  };
}

export function setGlobalProps(props: Partial<GlobalFns>): void {
  // Nur definierte Keys überschreiben
  if (props.get) g.get = props.get;
  if (props.getOr) g.getOr = props.getOr;
  if (props.setIn) g.setIn = props.setIn;
  if (props.errorIndex) g.errorIndex = props.errorIndex;
  if (props.addIssue) g.addIssue = props.addIssue;
}


function handleOnChange(s: string|number|boolean, pathDefined: boolean, onChange: any, path: PathType) : void { 
  if (!pathDefined) { return; }
  if (onChange === undefined) 
  {
    //console.log(path, ': onChange default: ', s); 
    gFun().setIn(path, s); 
  }
  else 
  { 
    //console.log(path, ': onChange custom: ', s); 
    onChange(s);
  }
}

function setNoPathError():string {
    const issue:SimpleIssue = { message: 'path not defined', path: ['unknown'] };
    gFun().addIssue(issue);
    return issue.message;
  }


export function NumberField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount
  }, []); // ← empty depts Array -> important for run once

  const { path, defLink, unit, label, value, onChange, error, minValue, maxValue, step, readOnly } = props;

  const pathDefined: boolean = (path !== null && path !== undefined && Array.isArray(path) && path.length > 0);
  const rl: string = unit ?? defLink?.unit ?? '';
  const minVal: number = minValue ?? defLink?.min ?? Number.NEGATIVE_INFINITY;
  const maxVal: number = maxValue ?? defLink?.max ?? Number.POSITIVE_INFINITY;
  const st: number = step ?? (defLink?.int ?? false) ? 1 : 0.1;
  const rightLabelDefined: boolean = (rl !== '');
  const l = label ?? pathDefined ? path.at(-1) : 'UnknownComponent';
  const ro = readOnly ?? defLink?.readOnly ?? false
  const hint = defLink?.hint ?? '';
  const id = useId();

  const v:number = (() => {
    if (value !== undefined && !Number.isNaN(value) && typeof value === 'number') 
    {
      return value;
    }
    if (rightLabelDefined) 
    {
      let t = stripUnit(gFun().getOr(path ?? [],'0x'));
      return t;
    }
    let t = gFun().getOr(path ?? [], 0);
    return t;
  })();

  function handleUnitOnChange(s: number):void {
    if (!pathDefined) { setNoPathError(); return; }
    if (rightLabelDefined) { handleOnChange(addUnit(s, rl), pathDefined, onChange, path); }
    else { handleOnChange(s, pathDefined, onChange, path); }
  }

  const err = error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');

  return (
    <div className="field numberWithUnit tooltip-wrapper">
      <label>{l}</label>
      <input type="number" min={minVal} max={maxVal} step={st} value={v} readOnly={ro} title={hint} onChange={(e) => handleUnitOnChange(Number(e.target.value))} onPlay={() => pathDefined ? () => {} : setNoPathError()}/>
      {err ? <div className="inline-error">{err}</div> : <span />}
      <div role="tooltip" id={id} className={`tooltip-bubble`}>
        {hint}
      </div>
      <span className="unit">{rl}</span>
    </div>
  );
}

export function SelectField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount to read correct value
  }, []); // ← empty depts Array -> important for run once

  const { path, defLink, label, options, value, onChange, error, readOnly } = props;
  
  const pathDefined: boolean = (path !== null && path !== undefined && Array.isArray(path) && path.length > 0);
  const v:string = value ?? gFun().getOr(path ?? [], '');
  const err = error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');
  const l = label ?? pathDefined ? path.at(-1) : 'UnknownComponent';
  const ro = readOnly ?? defLink?.readOnly ?? false
  const hint = defLink?.hint ?? '';
  const id = useId();
  
  return (
    <div className="field tooltip-wrapper">
      <label>{l}</label>
      <select title={hint} value={v} onChange={(e) => handleOnChange(e.target.value, pathDefined, onChange, path)} disabled={ro}>
        {options.map((o: string) => { return <option key={o} value={o}>{o}</option>; })}
      </select>
      {err ? <div className="inline-error">{err}</div> : <span />}
      <div role="tooltip" id={id} className={`tooltip-bubble`}>
        {hint}
      </div>
    </div>
  );
}

export function CheckField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount
  }, []); // ← empty depts Array -> important for run once

  const { path, defLink, label, checked, onChange, error, readOnly } = props;

  const pathDefined: boolean = path ? true : false;
  const v:boolean = checked ?? gFun().getOr(path ?? [], false);
  const err = error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');
  const l = label ?? pathDefined ? path.at(-1) : 'UnknownComponent';
  const ro = readOnly ?? defLink?.readOnly ?? false
  const hint = defLink?.hint ?? '';
  const id = useId();

  if (!pathDefined) { 

  }

  return (
    <div className="field tooltip-wrapper">
      <label>{l}</label>
      <input type="checkbox" readOnly={ro} checked={v} title={hint} onChange={(e) => handleOnChange(e.target.checked, pathDefined, onChange, path)} />
      {err ? <div className="inline-error">{err}</div> : <span />}
      <div role="tooltip" id={id} className={`tooltip-bubble`}>
        {hint}
      </div>
    </div>
  );
}


export function TextField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount
  }, []); // ← empty depts Array -> important for run once

  const { path, defLink, label, value, onChange, error, readOnly } = props;

  const pathDefined: boolean = path ? true : false;
  const v:string = value ?? gFun().getOr(path ?? [], '');
  const err =  error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');
  const l = label ?? pathDefined ? path.at(-1) : 'UnknownComponent';
  const ro = readOnly ?? defLink?.readOnly ?? false
  const hint = defLink?.hint ?? 'Bla';
  const id = useId();
  const plcVar = defLink?.plcVariableName ?? false;

  return (
    <div className="field tooltip-wrapper">
      <label>{l}</label>
      <input value={v} readOnly={ro} title={hint} onChange={(e) => handleOnChange(plcVar ? clearVariableName(e.target.value) : e.target.value, pathDefined, onChange, path)} />
      {err ? <div className="inline-error">{err}</div> : <span />}
      <div role="tooltip" id={id} className={`tooltip-bubble`}>
        {hint}
      </div>
    </div>
  );
}


export function GuidField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount
  }, []); // ← empty depts Array -> important for run once

  //const { label = 'Guid', value, readOnly, onChange, error, path } = props;
  const { path, defLink, label, value, readOnly, onChange, error,  } = props;

  const pathDefined: boolean = path ? true : false;
  const v:string = value ?? gFun().getOr(path ?? [], '');
  const err =  error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');
  const l = label ?? pathDefined ? path.at(-1) : 'UnknownComponent';
  const ro = readOnly ?? defLink?.readOnly ?? false
  const hint = defLink?.hint ?? '';
  const id = useId();

  return (
    <div className="field tooltip-wrapper">
      <label>{l}</label>
      <input value={v} readOnly={ro} title={hint} onChange={(e) => handleOnChange(e.target.value, pathDefined, onChange, path)} />
      <div role="tooltip" id={id} className={`tooltip-bubble`}>
        {hint}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button className="ghost" onClick={() => handleOnChange(uuid(), pathDefined, onChange, path)}>Generate</button>
        {err ? <div className="inline-error">{err}</div> : <span />}
      </div>
    </div>
  );
}