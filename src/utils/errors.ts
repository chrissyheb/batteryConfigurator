
import type { ZodIssue } from 'zod'
export type ErrorIndex = Map<string, string[]>
export function keyFromPath(path: (string | number)[]): string {
  return path.map(seg => typeof seg === 'number' ? String(seg) : seg).join('.')
}
export function buildErrorIndex(issues: ZodIssue[]): ErrorIndex {
  const m: ErrorIndex = new Map()
  for (const is of issues) {
    const k = keyFromPath(is.path as (string|number)[])
    const list = m.get(k) ?? []
    list.push(is.message); m.set(k, list)
  }
  return m
}
export function errorAt(index: ErrorIndex, path: (string|number)[]): string | undefined {
  const k = keyFromPath(path); const msgs = index.get(k); return msgs && msgs.length ? msgs[0] : undefined
}
