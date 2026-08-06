/** Period presets matching the Aptabase dashboard date filter. */
export const PERIODS = [
  "24h",
  "48h",
  "today",
  "yesterday",
  "7d",
  "14d",
  "30d",
  "month",
  "last-month",
  "90d",
  "180d",
  "365d",
  "all",
] as const;

export type Period = (typeof PERIODS)[number];
export type Granularity = "hour" | "day" | "month";

export type ResolvedPeriod = {
  startDate: string;
  endDate: string;
  granularity: Granularity;
};

function startOfMinute(d: Date): Date {
  const r = new Date(d);
  r.setSeconds(0, 0);
  return r;
}

function endOfMinute(d: Date): Date {
  const r = new Date(d);
  r.setSeconds(59, 999);
  return r;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfHour(d: Date): Date {
  const r = new Date(d);
  r.setMinutes(0, 0, 0);
  return r;
}

function subMs(d: Date, ms: number): Date {
  return new Date(d.getTime() - ms);
}

function subMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() - months);
  return r;
}

/**
 * Resolve a dashboard period preset to startDate/endDate/granularity,
 * mirroring Aptabase's `mapPeriodToStartEnd` in `date-atoms.ts`.
 */
export function resolvePeriod(period: Period, now = new Date()): ResolvedPeriod {
  let endDate = endOfDay(now);
  let startDate = startOfMinute(subMs(endDate, 24 * 3600_000));
  let granularity: Granularity = "hour";

  switch (period) {
    case "24h": {
      endDate = endOfMinute(now);
      startDate = startOfMinute(subMs(endDate, 24 * 3600_000));
      granularity = "hour";
      break;
    }
    case "48h": {
      endDate = endOfMinute(now);
      startDate = startOfMinute(subMs(endDate, 48 * 3600_000));
      granularity = "hour";
      break;
    }
    case "today": {
      endDate = endOfMinute(now);
      startDate = startOfDay(now);
      granularity = "hour";
      break;
    }
    case "yesterday": {
      endDate = subMs(endOfDay(now), 24 * 3600_000);
      startDate = subMs(startOfDay(now), 24 * 3600_000);
      granularity = "hour";
      break;
    }
    case "7d": {
      endDate = endOfDay(now);
      startDate = startOfMinute(subMs(endDate, 7 * 86400_000));
      granularity = "day";
      break;
    }
    case "14d": {
      endDate = endOfDay(now);
      startDate = startOfMinute(subMs(endDate, 14 * 86400_000));
      granularity = "day";
      break;
    }
    case "30d": {
      endDate = endOfDay(now);
      startDate = startOfMinute(subMs(endDate, 30 * 86400_000));
      granularity = "day";
      break;
    }
    case "month": {
      endDate = endOfDay(now);
      startDate = startOfMonth(endDate);
      granularity = "day";
      break;
    }
    case "last-month": {
      endDate = endOfMonth(subMonths(now, 1));
      startDate = startOfMonth(subMonths(now, 1));
      granularity = "day";
      break;
    }
    case "90d": {
      endDate = endOfDay(now);
      startDate = startOfMinute(subMs(endDate, 90 * 86400_000));
      granularity = "day";
      break;
    }
    case "180d": {
      endDate = endOfDay(now);
      startDate = startOfMinute(subMs(endDate, 180 * 86400_000));
      granularity = "month";
      break;
    }
    case "365d": {
      endDate = endOfDay(now);
      startDate = startOfHour(subMs(endDate, 365 * 86400_000));
      granularity = "month";
      break;
    }
    case "all": {
      endDate = endOfDay(now);
      startDate = new Date(0);
      granularity = "month";
      break;
    }
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    granularity,
  };
}

export function granularityFromRange(
  startDate: string,
  endDate: string,
): Granularity {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const hours = (end.getTime() - start.getTime()) / 3600_000;
  if (hours < 72) return "hour";
  const days = (end.getTime() - start.getTime()) / 86400_000;
  if (days > 90) return "month";
  return "day";
}
