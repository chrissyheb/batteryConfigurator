
import type { TConfig } from '@/domain/externalTypes'
const KEY = 'battery-config-exact'
export function saveLocal(cfg: TConfig) { localStorage.setItem(KEY, JSON.stringify(cfg)) }
export function loadLocal(): TConfig | null {
  try { const t = localStorage.getItem(KEY); return t ? JSON.parse(t) as TConfig : null } catch { return null }
}
