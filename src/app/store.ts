
import { useEffect, useMemo, useReducer, useState } from 'react';
import { loadLocal, saveLocal } from '@/utils/storage';
import { validate, getInitialConfig, PathType } from '@/spec/builder';
import { buildErrorIndex, expandUnknownKeyIssues, SimpleIssue } from '@/utils/errors';

export function useConfigAccessors(state: JSONObject, dispatch: React.Dispatch<Action>) {
  return {
    get: (path: PathType) => getAt(state, path), // get element at path from state (current config  )
    getOr: (path: PathType, fb: any) => getAtOr(state, path, fb),
    has: (path: PathType) => hasAt(state, path),
    set: (p: JSONObject) =>
      dispatch({ type: 'SET', payload: p }),
    setIn: (path: PathType, value: JSONValue) =>
      dispatch({ type: 'SET_AT_PATH', path, value }),
    del: (path: PathType) =>
      dispatch({ type: 'DELETE_AT_PATH', path }),
    patch: (p: DeepPartial<JSONObject>) =>
      dispatch({ type: 'PATCH', payload: p }),
  };
}

// Breite, sichere Typen für dynamische Config
export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export interface JSONObject { [k: string]: JSONValue }
export interface JSONArray extends Array<JSONValue> {}

// Read element value at path or return undefined
export function getAt(obj:JSONObject, path:PathType): JSONValue | undefined {
  if (path?.length === 0 || !obj) return undefined; // invalid path or object
  let cur:any = obj;
  for (const key of path) {
    if (cur == null) return undefined;
    cur = cur[key as any];
  }
  return cur as JSONValue | undefined;
}

// Read element value at path or return fallback
export function getAtOr<T>(obj: JSONObject, path: PathType, fallback: T): JSONValue | T {
  const v = getAt(obj, path);
  return v === undefined ? fallback : v;
}

// Check if element exists at path
export function hasAt(obj: JSONObject, path: PathType): boolean {
  let cur: any = obj;
  for (const key of path) {
    if (cur == null || !(key in cur)) return false;
    cur = cur[key as any];
  }
  return true;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
};

// --- Helfer ---
function deepMerge<T extends JSONObject>(base: T, patch: DeepPartial<T>): T {
  const out: any = structuredClone(base);
  for (const [k, v] of Object.entries(patch as object)) {
    const cur = out[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(
        (cur && typeof cur === 'object' && !Array.isArray(cur)) ? cur : {},
        v as any
      );
    } else if (Array.isArray(v)) {
      out[k] = structuredClone(v); // Arrays ersetzen (einfachste Semantik)
    } else {
      out[k] = v as any;
    }
  }
  return out;
}

export function setIn<T extends JSONObject>(obj: T, path: PathType, value: JSONValue): T {
  const clone: any = structuredClone(obj);
  let cur: any = clone;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];
    const exists = cur[key] !== undefined && cur[key] !== null;
    if (!exists) cur[key] = typeof nextKey === 'number' ? [] : {};
    else if (typeof nextKey === 'number' && !Array.isArray(cur[key])) cur[key] = [];
    else if (typeof nextKey === 'string' && (typeof cur[key] !== 'object' || Array.isArray(cur[key]))) cur[key] = {};
    cur = cur[key];
  }
  cur[path[path.length - 1]] = value as any;
  return clone as T;
}

export function delIn<T extends JSONObject>(obj: T, path: PathType): T {
  if ((path?.length ?? 0) === 0) return obj;

  // copy structure
  const clone: any = structuredClone(obj);
  let parent: any = clone;

  // zum Eltern-Knoten laufen
  for (let i = 0; i < path.length - 1; i++) {
    parent = parent?.[path[i]];
    if (parent == null) return clone; // nichts zu löschen
  }

  const last = path[path.length - 1];
  // Fall 1: letzter Key ist ein Array-Index -> per splice entfernen
  if (typeof last === "number" && Array.isArray(parent)) {
    if (last >= 0 && last < parent.length) { parent = parent.splice(last, 1); }
    return clone as T;
  }
  // Optional: String-"0" als Index behandeln (falls du Indizes als String reichst)
  if (typeof last === "string" && Array.isArray(parent) && /^\d+$/.test(last)) {
    const idx = Number(last);
    if (idx >= 0 && idx < parent.length) parent = parent.splice(idx, 1);
    return clone as T;
  }

  // Fall 2: normales Objekt-Property -> delete
  if (parent && typeof parent === "object") {
    delete parent[last as any];
  }
  return clone as T;
}

// --- Reducer ---

type Action =
  | { type: 'SET'; payload: JSONObject } // sets path
  | { type: 'PATCH'; payload: DeepPartial<JSONObject> } // deep merge
  | { type: 'SET_AT_PATH'; path: PathType; value: JSONValue } // inserts/replaces a path
  | { type: 'DELETE_AT_PATH'; path: PathType }; // delets a path

function reducer(state: JSONObject, action: Action): JSONObject {
  switch (action.type) {
    case 'SET':
      return action.payload;
    case 'PATCH':
      return deepMerge(state, action.payload);
    case 'SET_AT_PATH':
      return setIn(state, action.path, action.value);
    case 'DELETE_AT_PATH': 
      return delIn(state, action.path);
    default:
      return state;
  }
}


export function useStore()
{
  const [state, dispatch] = useReducer(reducer, null, () =>
  {
    const local = loadLocal();
    if (local) { return local; }
    return getInitialConfig();
  });

  const [addIssues, setAddIssues] = useState(new Array<SimpleIssue>());
  const [issues, setIssues] = useState(0);

  const { result, flatIssues, errorIndex } = useMemo(() =>
  {
    const result = validate(state);
    const valIssues = expandUnknownKeyIssues(result.issues);
    const flatIssues = [...valIssues, ...addIssues];
    const errorIndex = buildErrorIndex(flatIssues);
    return { result, flatIssues, errorIndex };
  }, [state, issues]);

  function addIssue(issue:SimpleIssue, ): void {
    setAddIssues([...addIssues, issue]);
    setIssues(issues + 1);
  }

  useEffect(() => { saveLocal(state); }, [state]);

  const isValid = result.issues.length === 0;

  return { state, dispatch, errorIndex, issues: result.issues, isValid, flatIssues, addIssue};
}
