// Versionierungs-/Verfügbarkeits-Mechanismus.
//
// Ziel: Felder, Komponenten oder Enum-Optionen können optional an eine
// PLC-Lib-Version (Global.ModularPlc.Version) und/oder eine HardwareVariant
// (Global.ModularPlc.HardwareVariant) gebunden werden, ohne dass jede
// Regel/jedes Formular das einzeln von Hand prüfen muss.

export type VersionContext = {
  version: string;
  hardwareVariant: string;
};

export type AvailabilitySpec = {
  /** Ab dieser Version verfügbar (inklusive). Format wie enums.global.libVersion, z.B. "0.0.7". */
  sinceVersion?: string;
  /** Bis zu dieser Version verfügbar (exklusive). */
  untilVersion?: string;
  /** Nur für diese HardwareVariant(en) verfügbar, z.B. ['Terra']. */
  hardwareVariants?: string[];
  /** Freie Zusatzbedingung, z.B. abhängig von einem anderen Feld im Config-Objekt. */
  when?: (cfg: any) => boolean;
};

/**
 * Vergleicht zwei Versionsstrings der Form "0.0.8".
 * Rückgabe < 0 wenn a < b, 0 wenn gleich, > 0 wenn a > b.
 * Robust auch bei unterschiedlicher Anzahl an Segmenten (z.B. "0.1" vs "0.1.0").
 */
export function compareVersions(a: string, b: string): number
{
  const pa = String(a ?? '').split('.').map((n) => Number(n) || 0);
  const pb = String(b ?? '').split('.').map((n) => Number(n) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++)
  {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) { return d < 0 ? -1 : 1; }
  }
  return 0;
}

/**
 * Prüft, ob ein Feld/eine Komponente/eine Enum-Option unter dem aktuellen
 * VersionContext (und optional dem restlichen Config-Objekt) verfügbar ist.
 * Ohne AvailabilitySpec ist alles immer verfügbar (rückwärtskompatibel).
 */
export function isAvailable(avail: AvailabilitySpec | undefined, ctx: VersionContext, cfg?: any): boolean
{
  if (!avail) { return true; }

  if (avail.sinceVersion && ctx.version && compareVersions(ctx.version, avail.sinceVersion) < 0)
  {
    return false;
  }
  if (avail.untilVersion && ctx.version && compareVersions(ctx.version, avail.untilVersion) >= 0)
  {
    return false;
  }
  if (avail.hardwareVariants && avail.hardwareVariants.length > 0 && !avail.hardwareVariants.includes(ctx.hardwareVariant))
  {
    return false;
  }
  if (avail.when && !avail.when(cfg))
  {
    return false;
  }
  return true;
}

/** Liest Version/HardwareVariant aus dem Config-Objekt (Global.ModularPlc.*). */
export function getVersionContext(cfg: any): VersionContext
{
  return {
    version: cfg?.Global?.ModularPlc?.Version ?? '',
    hardwareVariant: cfg?.Global?.ModularPlc?.HardwareVariant ?? ''
  };
}
