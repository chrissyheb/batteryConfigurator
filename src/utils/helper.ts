import { IndexStringType } from '@/spec/catalog';

export function addUnit(n: number, unit: string): string
{
  const s:string = n.toString() + unit;
  return s;
}



export function stripUnit(s: string): number
{
  if (!s) { 
    return 0; 
  }
  const t: string = s.trim();
  const m: RegExpMatchArray | null = t.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
  if (m)
  {
    const num: number = parseFloat(m[1]);
    return num;
  }
  else
  {
    const num: number = 0;
    const unit: string = t;
    return num;
  }
}


export const indexStringToString = (e: IndexStringType[]): string[] =>
{
  let output:string[] = [];
  let i = 0;
  e.forEach(element => {
    if (element[0] !== undefined && element[1] !== undefined)
    {
      output.push(element[0] + " - " + element[1]);
      i++;
    }
  });
  return output;
};
export const stringToIndexString = (v: string): IndexStringType =>
{
  const parts = v.split(" - ");
  return [Number(parts[0]), parts[1]] as IndexStringType;
};



export type TupleToRecord<T extends readonly string[], V> = { [K in T[number]]: V };