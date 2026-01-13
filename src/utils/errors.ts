
import type { ZodIssue } from 'zod';
import { PathType } from '@/spec/builder';

export type ErrorIndex = Map<string, string[]>;

export function keyFromPath(path: PathType): string
{
  const parts = path.map((seg) =>
  {
    if (typeof seg === 'number') { return String(seg); }
    return seg;
  });
  return parts.join('.');
}

// minimaler Typ für dein UI / error-index
export type SimpleIssue = {
  message: string;
  path: PathType;
};

type UnrecognizedKeysIssue = Extract<ZodIssue, { code: 'unrecognized_keys' }>;

function isUnrecognizedKeysIssue(i: ZodIssue): i is UnrecognizedKeysIssue {
  return i.code === 'unrecognized_keys';
}

export function expandUnknownKeyIssues(issues: ZodIssue[]): SimpleIssue[] {
  const out: SimpleIssue[] = [];

  for (const is of issues) {
    if (isUnrecognizedKeysIssue(is)) {
      const base = (is.path ?? []) as PathType;
      for (const k of is.keys) {
        out.push({ message: 'Unknown key', path: [...base, k] });
      }
    } else {
      out.push({
        message: is.message,
        path: (is.path ?? []) as PathType,
      });
    }
  }
  return out;
}


export function buildErrorIndex(issues: SimpleIssue[]): ErrorIndex {
  const map: ErrorIndex = new Map();
  for (const is of issues) {
    const key = (is.path ?? []).map(p => typeof p === 'number' ? String(p) : p).join('.');
    const list = map.get(key) ?? [];
    list.push(is.message);
    map.set(key, list);
  }
  return map;
}


export function errorAt(index: ErrorIndex, path: PathType): string | undefined
{
  const key = keyFromPath(path);
  const msgs = index.get(key);
  if (!msgs || msgs.length === 0)
  {
    return undefined;
  }
  return msgs[0];
}

export function buildErrorPrefixSet(index: ErrorIndex): Set<string> {
  const set = new Set<string>();
  for (const key of index.keys()) {
    const parts = key.split(".");
    for (let i = 1; i <= parts.length; i++) {
      set.add(parts.slice(0, i).join("."));
    }
  }
  return set;
}

export function hasErrorUnder(prefixSet: Set<string>, path: PathType): boolean {
  const key = keyFromPath(path);
  return key === "" ? prefixSet.size > 0 : prefixSet.has(key);
}

export function formatPath(path: PathType | undefined): string
{
  // no or empty path
  if (!path || path.length === 0) { return '(root)'; }
  // path valid -> format
  return path
    .map((seg, i) =>
    {
      if (typeof seg === 'number') { return `[${seg}]`; }
      return i === 0 ? String(seg) : `.${String(seg)}`;
    })
    .join('');
}