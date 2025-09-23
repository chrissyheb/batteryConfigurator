export function addUnit(n: number, unit: string): string
{
  const s:string = n.toString() + unit;
  console.log('addUnit', s);
  return s;
}

export function stripUnit(s: string): [number, string]
{
  const t: string = s.trim();
  const m: RegExpMatchArray | null = t.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
  if (m)
  {
    const num: number = parseFloat(m[1]);
    const unit: string = m[2].trim();
    return [num, unit];
  }
  else
  {
    const num: number = Number.NaN;
    const unit: string = t;
    return [num, unit];
  }
}