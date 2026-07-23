// Generischer Zod-Schema-Generator aus einer Field-Spec (siehe core/field-types.ts).
// Bisher Teil von spec/builder.ts (fieldSchema/groupSchema) - hier verallgemeinert
// und um Versionierung erweitert: Felder, die laut ihrer `availability` (siehe
// core/versioning.ts) im aktuellen VersionContext nicht verfügbar sind, werden
// im Schema als optional behandelt (statt Pflichtfeld), damit weder das
// Formular noch der Import älterer/anderer Configs daran scheitert.

import { z, ZodObject } from 'zod';
import { isAvailable, type VersionContext } from './versioning';

function fieldSchema(f: any, ctx: VersionContext, cfg: any): z.ZodTypeAny
{
  let schema: z.ZodTypeAny = buildBaseFieldSchema(f);

  if (!isAvailable(f?.availability, ctx, cfg))
  {
    schema = schema.optional();
  }

  return schema;
}

function buildBaseFieldSchema(f: any): z.ZodTypeAny
{
  if (f?.const)
  {
    return z.literal(f.const);
  }
  if (f?.enum)
  {
    // f.enum ist jetzt eine direkte string[]-Referenz (siehe core/field-types.ts)
    return z.enum(f.enum as [string, ...string[]]);
  }
  if (f?.enumRef)
  {
    // f.enumRef ist jetzt eine direkte Referenz: entweder Array (IndexStringType[]/string[])
    // oder eine "Hardware -> Modelle"-Map, deren Top-Level-Keys die erlaubten Werte sind.
    const obj = f.enumRef;
    const flat = Array.isArray(obj) ? obj : Object.keys(obj);
    switch (f?.type)
    {
      case 'indexString':
      {
        const allowed = new Set(flat.map((t: any) => JSON.stringify(t)));
        return z.tuple([z.number(), z.string()])
          .refine((t) => {
            return allowed.has(JSON.stringify(t));
          }, {
            message: 'Invalid selection',
          });
      }
      default:
      {
        return z.enum(flat as [string, ...string[]]);
      }
    }
  }
  switch (f?.type)
  {
    case 'uuid':
    {
      return z.string().uuid();
    }

    case 'bool':
    {
      return z.boolean();
    }

    case 'ipv4':
    {
      const Octet = String.raw`(?:0|[1-9]\d?|1\d\d|2[0-4]\d|25[0-5])`;
      const OctetNoZero = String.raw`(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-5])`;
      const IPv4_RE = new RegExp(`^${OctetNoZero}(?:\\.${Octet}){2}\\.${OctetNoZero}$`);
      return z.string().trim().regex(IPv4_RE, 'Invalid IPv4');
    }

    case 'number':
    {
      let s = z.number().finite();

      if (f?.int) s = s.int();
      if (typeof f?.min === 'number') s = s.min(f.min);
      if (typeof f?.max === 'number') s = s.max(f.max);
      if (typeof f?.int === 'boolean' && f.int === true) { s = s.int(); }

      return s;
    }

    case 'numberWithUnit':
    {
      const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const unit = String(f.unit ?? '');
      const u = escapeRe(unit);

      const NUM = String.raw`[+-]?(?:\d+(?:\.\d+)?|\.\d+)`;

      const REwantedUnit = new RegExp(`^(${NUM})[ \\t\\u00A0]*${u}$`);
      const REfoundUnit = new RegExp(`^(${NUM})[ \\t\\u00A0]*(.*)$`);

      const toNumber = z.string().trim().transform((s, ctx) => {
        const good = s.match(REwantedUnit);
        if (good) { return Number(good[1]); }

        const bad = s.match(REfoundUnit);
        const foundUnit = bad ? bad[2] : '';
        ctx.addIssue({
          code: 'custom',
          message:
            foundUnit
              ? `Wrong unit: found ${foundUnit} - expected ${unit}`
              : `No unit - expected ${unit}`
        });
        return z.NEVER;
      });

      let num = z.number().finite();
      if (typeof f?.min === 'number') { num = num.min(f.min); }
      if (typeof f?.max === 'number') { num = num.max(f.max); }
      if (typeof f?.int === 'boolean' && f.int === true) { num = num.int(); }

      return toNumber.pipe(num);
    }

    default:
    {
      if (typeof f?.plcVariableName === 'boolean' && f.plcVariableName === true)
      {
        return z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, { message: 'Invalid PLC variable name - only alphanumeric and _ allowed, no leading number' })
          .refine((val) => val !== '' && val && (val[0] === '_' || val[0] === val[0].toUpperCase()), { message: 'Invalid PLC variable name - first character must be uppercase or "-"' });
      }
      return z.string().min(1);
    }
  }
}

export function groupSchema(g: any, ctx: VersionContext, cfg: any): z.ZodTypeAny
{
  if (Array.isArray(g))
  {
    const shape: Record<string, z.ZodTypeAny> = {};
    g.forEach((k, spec) => {
      const s: any = k;
      shape[k] = groupSchema(s, ctx, cfg);
    });
    return z.object(shape).strict();
  }
  else
  {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [k, spec] of Object.entries<any>(g))
    {
      const s: any = spec;
      if (Array.isArray(s))
      {
        s.forEach((element) => {
          shape[k] = groupSchema(element, ctx, cfg);
        });
      }
      else if (s.group)
      {
        const inner = groupSchema(s.group, ctx, cfg);
        shape[k] = s.optional ? inner.optional() : inner;
      }
      else
      {
        let zod = fieldSchema(s, ctx, cfg);
        if (s.optional) {
          zod = zod.optional();
        }
        shape[k] = zod;
      }
    }
    return z.object(shape).strict();
  }
}

export function isZodObject(s: z.ZodTypeAny): s is ZodObject<any>
{
  return s instanceof ZodObject;
}
