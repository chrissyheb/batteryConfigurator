
import type { ZodIssue } from 'zod';

export type ErrorIndex = Map<string, string[]>;

export function keyFromPath(path: (string | number)[]): string
{
  const parts = path.map((seg) =>
  {
    if (typeof seg === 'number')
    {
      return String(seg);
    }
    return seg;
  });
  return parts.join('.');
}

export function buildErrorIndex(issues: ZodIssue[]): ErrorIndex
{
  const map: ErrorIndex = new Map();
  for (const is of issues)
  {
    const key = keyFromPath(is.path as (string | number)[]);
    const list = map.get(key) ?? [];
    list.push(is.message);
    map.set(key, list);
  }
  return map;
}

export function errorAt(index: ErrorIndex, path: (string | number)[]): string | undefined
{
  const key = keyFromPath(path);
  const msgs = index.get(key);
  if (!msgs || msgs.length === 0)
  {
    return undefined;
  }
  return msgs[0];
}
