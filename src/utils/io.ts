
import { isPlausibleConfig } from '@/spec/builder';

export function exportJSON(cfg: any, name: string = 'config.json'): void
{
  const pretty = JSON.stringify(cfg, null, 4);
  const blob = new Blob([pretty], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(file: File): Promise<any>
{
  const text = await file.text();
  const json = JSON.parse(text);
  if (!isPlausibleConfig(json))
  {
    throw new Error('Datei ist kein gültiges BatteryConfigurator-Config-JSON (Global/Units fehlen)');
  }
  return json;
}
