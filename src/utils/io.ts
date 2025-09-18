
import type { TConfig } from '@/domain/externalTypes'
export function exportJSON(cfg: TConfig, name='config.json') {
  const blob = new Blob([JSON.stringify(cfg, null, 4)], { type: 'application/json' })
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
export async function importJSON(file: File): Promise<TConfig> { const t = await file.text(); return JSON.parse(t) as TConfig }
