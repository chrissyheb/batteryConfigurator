
import React, { useEffect, useId, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  errorPrefixSet: Set<string>;
  addIssue: (issue: SimpleIssue) => void;
}

const defaults: GlobalFns = {
  get: (path) => path,
  getOr: (path, fallback) => (path === undefined || path === null ? fallback : path),
  setIn: () => { throw new Error('setIn undefined -> call Fields.setGlobalProps()'); },
  errorIndex: new Map<string, string[]>(),
  errorPrefixSet: new Set<string>(),
  addIssue: (issue) => issue
};

const g: Partial<GlobalFns> = { ...defaults };

function gFun() : GlobalFns {
  return {
    get: g.get ?? defaults.get,
    getOr: g.getOr ?? defaults.getOr,
    setIn: g.setIn ?? defaults.setIn,
    errorIndex: g.errorIndex ?? defaults.errorIndex,
    errorPrefixSet: g.errorPrefixSet ?? defaults.errorPrefixSet,
    addIssue: g.addIssue ?? defaults.addIssue
  };
}

export function setGlobalProps(props: Partial<GlobalFns>): void {
  // Nur definierte Keys überschreiben
  if (props.get) g.get = props.get;
  if (props.getOr) g.getOr = props.getOr;
  if (props.setIn) g.setIn = props.setIn;
  if (props.errorIndex) g.errorIndex = props.errorIndex;
  if (props.errorPrefixSet) g.errorPrefixSet = props.errorPrefixSet;
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

/** aria-describedby muss auf die ID eines Elements zeigen, nicht auf rohen
 *  Text - rendert den Hint-Text daher zusätzlich zum Hover/Focus-Tooltip
 *  (TooltipPortal) unsichtbar-aber-für-Screenreader-lesbar mit fester ID. */
function HintText({ id, text }: { id: string; text: string }) {
  if (!text) { return null; }
  return <span id={id} className="visually-hidden">{text}</span>;
}


type TooltipProps = {
  anchorRef: React.RefObject<HTMLElement>;
  visible: boolean;
  children: React.ReactNode;
};

function TooltipPortal({ anchorRef, visible, children }: TooltipProps) {
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!visible || !anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();

    setPos({
      top: rect.top - 8,   // Abstand nach oben
      left: (rect.left + rect.right) * 0.5,     // horizontal zentriert
    });
  }, [visible]);

  if (!visible) return null;

  return createPortal(
    <div
      className="tooltip-bubble tooltip-portal"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
      }}
    >
      {children}
    </div>,
    document.body
  );
}


type NumberFieldItem = {
  path?: PathType;
  defLink?: any;
  unit?: string;
  value?: number;
  error?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  readOnly?: boolean;
  onChange?: any;
};

type NumberFieldProps = NumberFieldItem & {
  label?: string;
  items?: NumberFieldItem[];
};

export function NumberField(props: NumberFieldProps) {
  const { items, label, defLink } = props;

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hintId = useId();

  const isArray = Array.isArray(items) && items.length > 0;
  const firstItem = isArray ? items[0] : undefined;

  useEffect(() => {
    const invalid = isArray
      ? items.some(i => !isPath(i.path))
      : !isPath(props.path);

    if (invalid) setNoPathError();
  }, []);

  const l = label ?? (props.path?.[props.path.length - 1]?.toString() ?? (firstItem?.path?.[firstItem.path.length - 1]?.toString()) ?? 'UnknownComponent');
  const hint = defLink?.hint ?? (firstItem?.defLink?.hint ?? '');

  const isPath = (p?: PathType): p is PathType => Array.isArray(p) && p.length > 0;

  const getVal = (p: NumberFieldItem): number => {
    if (typeof p.value === 'number' && !Number.isNaN(p.value)) return p.value;
    if (!isPath(p.path)) return 0;

    const unit = p.unit ?? p.defLink?.unit ?? '';
    const raw = gFun().getOr(p.path, unit ? '0x' : 0);
    const stripped = stripUnit(raw);
    //console.log(raw, p.unit, unit, p.defLink?.unit, stripped);
    return unit ? stripped : raw;
  };

  const getErr = (p: NumberFieldItem): string | undefined =>
    p.error ?? (isPath(p.path) ? errorAt(gFun().errorIndex, p.path) : 'path not defined');

  const handle = (p: NumberFieldItem, val: number): void => {
    if (!isPath(p.path)) {
      setNoPathError();
      return;
    }

    const unit = p.unit ?? p.defLink?.unit ?? '';
    const fn = p.onChange ?? props.onChange;

    handleOnChange(unit ? addUnit(val, unit) : val, true, fn, p.path);
  };

  const renderEntry = (p: NumberFieldItem, key: React.Key) => {
    const unit = p.unit ?? p.defLink?.unit ?? '';
    const min = p.minValue ?? p.defLink?.min ?? Number.NEGATIVE_INFINITY;
    const max = p.maxValue ?? p.defLink?.max ?? Number.POSITIVE_INFINITY;
    const step = p.step ?? ((p.defLink?.int ?? false) ? 1 : 0.1);
    const ro = p.readOnly ?? p.defLink?.readOnly ?? false;
    const val = getVal(p);
    const err = getErr(p);
    return (
      <div key={key} className="number-entry">
        <div className="input-with-unit">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={val}
            readOnly={ro}
            aria-describedby={hint ? hintId : undefined}
            onChange={e => handle(p, Number(e.target.value))}
          />
          {unit && <span className="unit">{unit}</span>}
        </div>
        <div className="inline-error">{err ?? ''}</div>
      </div>
    );
  };

  const list: NumberFieldItem[] = isArray ? items.map(i => ({ ...props, ...i })) : [props];

  return (
    <div
      className="field numberWithUnit"
      ref={tooltipRef}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
    >
      <label>{l}</label>

      <div className="number-field-list">
        {list.map((p, idx) => renderEntry(p, idx))}
      </div>

      <HintText id={hintId} text={hint} />
      {hint && (
        <TooltipPortal anchorRef={tooltipRef} visible={tooltipVisible}>
          {hint}
        </TooltipPortal>
      )}
    </div>
  );
}

export function SelectField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount to read correct value
  }, []); // ← empty depts Array -> important for run once

  const { path, defLink, label, options, value, onChange, error, readOnly } = props;

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hintId = useId();

  const pathDefined: boolean = (path !== null && path !== undefined && Array.isArray(path) && path.length > 0);
  const v:string = value ?? gFun().getOr(path ?? [], '');
  const err = error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');
  const l = label ?? (pathDefined ? path.at(-1) : 'UnknownComponent');
  const ro = readOnly ?? defLink?.readOnly ?? false
  const hint = defLink?.hint ?? '';

  return (
    <div
      className="field"
      ref={tooltipRef}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
    >
      <label>{l}</label>
      <select aria-describedby={hint ? hintId : undefined} value={v} onChange={(e) => handleOnChange(e.target.value, pathDefined, onChange, path)} disabled={ro}>
        {options.map((o: string) => { return <option key={o} value={o}>{o}</option>; })}
      </select>
      {err ? <div className="inline-error">{err}</div> : <span />}
      <HintText id={hintId} text={hint} />
      {hint && (
        <TooltipPortal anchorRef={tooltipRef} visible={tooltipVisible}>
          {hint}
        </TooltipPortal>
      )}
    </div>
  );
}

export function CheckField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount
  }, []); // ← empty depts Array -> important for run once

  const { path, defLink, label, checked, onChange, error, readOnly } = props;

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hintId = useId();

  const pathDefined: boolean = path ? true : false;
  const v:boolean = checked ?? gFun().getOr(path ?? [], false);
  const err = error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');
  const l = label ?? (pathDefined ? path.at(-1) : 'UnknownComponent');
  const ro = readOnly ?? defLink?.readOnly ?? false
  const hint = defLink?.hint ?? '';

  return (
    <div
      className="field"
      ref={tooltipRef}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
    >
      <label>{l}</label>
      {/* HTML ignoriert readOnly bei type="checkbox" (der Nutzer könnte es trotzdem
          per Klick umschalten) - disabled ist hier das funktionale Äquivalent. */}
      <input type="checkbox" disabled={ro} checked={v} aria-describedby={hint ? hintId : undefined} onChange={(e) => handleOnChange(e.target.checked, pathDefined, onChange, path)} />
      {err ? <div className="inline-error">{err}</div> : <span />}
      <HintText id={hintId} text={hint} />
      {hint && (
        <TooltipPortal anchorRef={tooltipRef} visible={tooltipVisible}>
          {hint}
        </TooltipPortal>
      )}
    </div>
  );
}


export function TextField(props: any)
{
  useEffect(() => {
    if (!props.path) { setNoPathError(); return; } // run once on mount
  }, []); // ← empty depts Array -> important for run once

  const { path, defLink, label, value, onChange, error, readOnly } = props;

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hintId = useId();

  const pathDefined: boolean = path ? true : false;
  const v:string = value ?? gFun().getOr(path ?? [], '');
  const err =  error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');
  const l = label ?? (pathDefined ? path.at(-1) : 'UnknownComponent');
  const ro = readOnly ?? defLink?.readOnly ?? false
  const hint = defLink?.hint ?? '';

  return (
    <div
      className="field"
      ref={tooltipRef}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
    >
      <label>{l}</label>
      <input value={v} readOnly={ro} aria-describedby={hint ? hintId : undefined} onChange={(e) => handleOnChange(e.target.value, pathDefined, onChange, path)} />
      {err ? <div className="inline-error">{err}</div> : <span />}
      <HintText id={hintId} text={hint} />
      {hint && (
        <TooltipPortal anchorRef={tooltipRef} visible={tooltipVisible}>
          {hint}
        </TooltipPortal>
      )}
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

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hintId = useId();

  const pathDefined: boolean = path ? true : false;
  const v:string = value ?? gFun().getOr(path ?? [], '');
  const err =  error ?? (pathDefined ? errorAt(gFun().errorIndex, path) : 'path not defined');
  const l = label ?? (pathDefined ? path.at(-1) : 'UnknownComponent');
  const ro = readOnly ?? defLink?.readOnly ?? false
  const hint = defLink?.hint ?? '';

  return (
    <div
      className="field"
      ref={tooltipRef}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
    >
      <label>{l}</label>
      <input value={v} readOnly={ro} aria-describedby={hint ? hintId : undefined} onChange={(e) => handleOnChange(e.target.value, pathDefined, onChange, path)} />
      <div className="row" style={{ gap: 8 }}>
        <button className="ghost" onClick={() => handleOnChange(uuid(), pathDefined, onChange, path)}>Generate</button>
        {err ? <div className="inline-error">{err}</div> : <span />}
      </div>
      <HintText id={hintId} text={hint} />
      {hint && (
        <TooltipPortal anchorRef={tooltipRef} visible={tooltipVisible}>
          {hint}
        </TooltipPortal>
      )}
    </div>
  );
}
