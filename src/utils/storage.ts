
import { isPlausibleConfig } from '@/spec/builder';

const KEY = 'battery-config-exact';

export function saveLocal(cfg: any): void
{
  localStorage.setItem(KEY, JSON.stringify(cfg));
}

export function loadLocal(): any | null
{
  try
  {
    const t = localStorage.getItem(KEY);
    if (!t) { return null; }
    const parsed = JSON.parse(t);
    // Ein Stand aus einer inkompatiblen/alten Konfigurator-Version wird
    // verworfen statt übernommen - useStore() fällt dann auf
    // getInitialConfig() zurück (siehe isPlausibleConfig).
    return isPlausibleConfig(parsed) ? parsed : null;
  }
  catch
  {
    return null;
  }
}

export function clearLocal(): void
{
  localStorage.removeItem(KEY);
}