
import React, { useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { errorAt, ErrorIndex, SimpleIssue } from '@/utils/errors';
import { PathType } from '@/spec/builder';
import { JSONValue } from '@/app/store';
import { stripUnit, addUnit } from '@/utils/helper';

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

  const { leftLabel, value, onChange, error, rightLabel, minValue, maxValue, step, path } = props;

  const pathDefined: boolean = (path !== null && path !== undefined && Array.isArray(path) && path.length > 0);
  const rightLabelDefined: boolean = (rightLabel !== undefined && rightLabel !== '');

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
    if (rightLabelDefined) { handleOnChange(addUnit(s, rightLabel), pathDefined, onChange, path); }
    else { handleOnChange(s, pathDefined, onChange, path); }
  }

  const err = error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');

  return (
    <div className="field numberWithUnit" >
      <label>{leftLabel ?? ''}</label>
      <input type="number" min={minValue} max={maxValue} step={step} value={v} onChange={(e) => handleUnitOnChange(Number(e.target.value))} onPlay={() => pathDefined ? () => {} : setNoPathError()}/>
      {err ? <div className="inline-error">{err}</div> : <span />}
      <span className="unit">{rightLabel ?? ''}</span>
    </div>
  );
}

export function SelectField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount
  }, []); // ← empty depts Array -> important for run once

  const { label, options, value, onChange, error, path,leftIsType = false, disabled = false } = props;
  
  const pathDefined: boolean = (path !== null && path !== undefined && Array.isArray(path) && path.length > 0);
  const v:string = value ?? gFun().getOr(path ?? [], '');
  const err = error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');
  
  return (
    <div className="field">
      <label>{leftIsType ? 'Type' : label}</label>
      <select value={v} onChange={(e) => handleOnChange(e.target.value, pathDefined, onChange, path)} disabled={disabled}>
        {options.map((o: string) => { return <option key={o} value={o}>{o}</option>; })}
      </select>
      {err ? <div className="inline-error">{err}</div> : <span />}
    </div>
  );
}

export function CheckField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount
  }, []); // ← empty depts Array -> important for run once

  const { label, checked, onChange, error, path } = props;

  const pathDefined: boolean = path ? true : false;
  const v:boolean = checked ?? gFun().getOr(path ?? [], false);
  const err = error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');

  if (!pathDefined) { 

  }

  return (
    <div className="field">
      <label>{label ?? '???'}</label>
      <input type="checkbox" checked={v} onChange={(e) => handleOnChange(e.target.checked, pathDefined, onChange, path)} />
      {err ? <div className="inline-error">{err}</div> : <span />}
    </div>
  );
}


export function TextField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount
  }, []); // ← empty depts Array -> important for run once

  const { label, value, onChange, error, leftLabel, path } = props;

  const pathDefined: boolean = path ? true : false;
  const v:string = value ?? gFun().getOr(path ?? [], '');
  const err =  error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');

  return (
    <div className="field">
      <label>{leftLabel ?? 'Type'}</label>
      <input value={v} onChange={(e) => handleOnChange(e.target.value, pathDefined, onChange, path)} />
      {err ? <div className="inline-error">{err}</div> : <span />}
    </div>
  );
}


export function GuidField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount
  }, []); // ← empty depts Array -> important for run once

  const { label = 'Guid', value, onChange, error, path } = props;

  const pathDefined: boolean = path ? true : false;
  const v:string = value ?? gFun().getOr(path ?? [], '');
  const err =  error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');

  return (
    <div className="field">
      <label>{label}</label>
      <input value={v} onChange={(e) => handleOnChange(e.target.value, pathDefined, onChange, path)} />
      <div className="row" style={{ gap: 8 }}>
        <button className="ghost" onClick={() => handleOnChange(uuid(), pathDefined, onChange, path)}>Neu generieren</button>
        {err ? <div className="inline-error">{err}</div> : <span />}
      </div>
    </div>
  );
}