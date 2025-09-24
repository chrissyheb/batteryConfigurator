
import React from 'react';
import { v4 as uuid } from 'uuid';

export function TextField(props: any)
{
  const { label, value, onChange, error, leftLabel } = props;
  return (
    <div className="field">
      <label>{leftLabel ?? 'Type'}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
      {error ? <div className="inline-error">{error}</div> : <span />}
    </div>
  );
}

export function NumberField(props: any)
{
  const { label, value, onChange, error, leftLabel, rightLabel, minValue, maxValue, step } = props;
  return (
    <div className="field">
      <label>{leftLabel ?? 'Type'}</label>
      <input type="number" min={minValue} max={maxValue} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <label>{rightLabel ?? ''}</label>
      {error ? <div className="inline-error">{error}</div> : <span />}
    </div>
  );
}

export function SelectField(props: any)
{
  const { label, options, value, onChange, error, leftIsType = false, disabled = false } = props;
  return (
    <div className="field">
      <label>{leftIsType ? 'Type' : label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {options.map((o: string) => { return <option key={o} value={o}>{o}</option>; })}
      </select>
      {error ? <div className="inline-error">{error}</div> : <span />}
    </div>
  );
}

export function GuidField(props: any)
{
  const { label = 'Guid', value, onChange, error } = props;
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="row" style={{ gap: 8 }}>
        <button className="ghost" onClick={() => onChange(uuid())}>Neu generieren</button>
        {error ? <div className="inline-error">{error}</div> : <span />}
      </div>
    </div>
  );
}

export function CheckField(props: any)
{
  const { label, value, onChange, error } = props;
  return (
    <div className="field">
      <label>{label ?? '???'}</label>
      <input type="checkbox" value={value} onChange={(e) => onChange(Boolean(e.target.value))} />
      {error ? <div className="inline-error">{error}</div> : <span />}
    </div>
  );
}
