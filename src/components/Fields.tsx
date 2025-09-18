
import React from 'react'
import { v4 as uuid } from 'uuid'
export function TextField({label, value, onChange, error, leftLabel}: any) {
  return (<div className="field"><label>{leftLabel ?? 'Type'}</label>
    <input value={value} onChange={(e)=>onChange(e.target.value)} />
    {error ? <div className="inline-error">{error}</div> : <span />}</div>)}
export function SelectField({label, options, value, onChange, error, leftIsType=false, disabled=false}: any) {
  return (<div className="field"><label>{leftIsType ? 'Type' : label}</label>
    <select value={value} onChange={(e)=>onChange(e.target.value)} disabled={disabled}>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}</select>
    {error ? <div className="inline-error">{error}</div> : <span />}</div>)}
export function GuidField({label='Guid', value, onChange, error}: any) {
  return (<div className="field"><label>{label}</label>
    <input value={value} onChange={(e)=>onChange(e.target.value)} />
    <div className="row" style={{gap:8}}><button className="ghost" onClick={()=>onChange(uuid())}>Neu generieren</button>
      {error ? <div className="inline-error">{error}</div> : <span />}</div></div>)}
