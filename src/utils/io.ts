
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
  console.log('Import:', file, json);
  return json;
}
