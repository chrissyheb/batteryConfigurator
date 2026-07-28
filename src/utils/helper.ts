import { IndexStringType } from '@/core/field-types';

export function addUnit(n: number, unit: string): string
{
  const s:string = n.toString() + unit;
  return s;
}


export function removeWhitespaces(str: string): string
{
  return str.replace(/\s+/g, '');
}

export function stripUnit(s: unknown): number
{
  if (s === null || s === undefined) {
    return 0;
  }
  const t = String(s).trim();

  const m = t.match(/^([+-]?\d+(?:\.\d+)?)(.*)$/);
  //console.log(s, m)
  if (m)
  {
    return parseFloat(m[1]);
  }

  return 0;
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