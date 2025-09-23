
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
    return t ? JSON.parse(t) : null;
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