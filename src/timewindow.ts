/** Event-stack lookback. Day-granularity dates overlap the window; instants use their timestamp. */

export type TimeWindow = "24H" | "3D" | "7D" | "30D";

export const TIME_WINDOWS: readonly TimeWindow[] = ["24H", "3D", "7D", "30D"];
export const DEFAULT_TIME_WINDOW: TimeWindow = "7D";
export const TIME_WINDOW_KEY = "wf.timeWindow.v1";

const MS: Record<TimeWindow, number> = {
  "24H": 24 * 60 * 60 * 1000,
  "3D": 3 * 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
};

const MON: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

export function isTimeWindow(value: unknown): value is TimeWindow {
  return value === "24H" || value === "3D" || value === "7D" || value === "30D";
}

export function readTimeWindow(storage: Storage | null): TimeWindow {
  try {
    const value = storage?.getItem(TIME_WINDOW_KEY);
    return isTimeWindow(value) ? value : DEFAULT_TIME_WINDOW;
  } catch {
    return DEFAULT_TIME_WINDOW;
  }
}

export function writeTimeWindow(storage: Storage | null, window: TimeWindow): void {
  try {
    storage?.setItem(TIME_WINDOW_KEY, window);
  } catch {
    /* private mode and disabled storage */
  }
}

/** True when [startMs, endMs) overlaps [now - window, now]. */
export function rangeOverlapsWindow(startMs: number, endMs: number, window: TimeWindow, now = Date.now()): boolean {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return false;
  return endMs > now - MS[window] && startMs <= now;
}

/**
 * Date-only rows have no hour. Overlap would count the whole previous UTC day
 * inside a 24H window. A 24H row counts only when its last named UTC day is
 * today. Longer windows keep the overlap test.
 */
export function dateOnlyInWindow(startMs: number, endMs: number, window: TimeWindow, now = Date.now()): boolean {
  if (window !== "24H") return rangeOverlapsWindow(startMs, endMs, window, now);
  const nowDate = new Date(now);
  const todayStart = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate());
  const lastDayStart = endMs - 24 * 60 * 60 * 1000;
  return lastDayStart === todayStart && startMs <= now;
}

/** Clock skew of a few minutes still counts as current. Far-future timestamps do not. */
export function instantInWindow(ts: number, window: TimeWindow, now = Date.now()): boolean {
  if (!Number.isFinite(ts)) return false;
  return ts >= now - MS[window] && ts <= now + 5 * 60 * 1000;
}

function utcMidnight(year: number, monthIndex: number, day: number): number | null {
  if (day < 1 || day > 31 || monthIndex < 0 || monthIndex > 11) return null;
  const t = Date.UTC(year, monthIndex, day);
  const d = new Date(t);
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== monthIndex || d.getUTCDate() !== day) return null;
  return t;
}

/**
 * Parse a curated DTG against the snapshot year in `anchorIso` (YYYY-MM-DD…).
 * Returns the UTC half-open range covering every named day, or null when the
 * text is not a day or a day range. No date is guessed from prose.
 */
export function curatedRange(dtg: string, anchorIso: string): [number, number] | null {
  const anchor = /^(\d{4})-(\d{2})-(\d{2})/.exec(anchorIso);
  if (!anchor) return null;
  const year = Number(anchor[1]);
  const anchorMonth = Number(anchor[2]) - 1;
  const text = dtg.trim().toUpperCase().replace(/\u2013|\u2014/g, "-").replace(/\s+/g, " ");

  const day = (mon: string, date: number): number | null => {
    const monthIndex = MON[mon];
    if (monthIndex == null) return null;
    const y = monthIndex > anchorMonth + 1 ? year - 1 : year;
    return utcMidnight(y, monthIndex, date);
  };

  let start: number | null = null;
  let endDay: number | null = null;
  let match = /^(\d{1,2}) ([A-Z]{3})-(\d{1,2}) ([A-Z]{3})$/.exec(text);
  if (match) {
    start = day(match[2], Number(match[1]));
    endDay = day(match[4], Number(match[3]));
  } else {
    match = /^(\d{1,2})-(\d{1,2}) ([A-Z]{3})$/.exec(text);
    if (match) {
      start = day(match[3], Number(match[1]));
      endDay = day(match[3], Number(match[2]));
    } else {
      match = /^(\d{1,2}) ([A-Z]{3})$/.exec(text);
      if (!match) return null;
      start = day(match[2], Number(match[1]));
      endDay = start;
    }
  }
  if (start == null || endDay == null) return null;
  if (endDay < start) {
    const endDate = new Date(endDay);
    const shifted = Date.UTC(endDate.getUTCFullYear() + 1, endDate.getUTCMonth(), endDate.getUTCDate());
    if (shifted < start) return null;
    endDay = shifted;
  }
  return [start, endDay + 24 * 60 * 60 * 1000];
}

export function curatedInWindow(dtg: string, anchorIso: string, window: TimeWindow, now = Date.now()): boolean {
  const range = curatedRange(dtg, anchorIso);
  if (!range) return false;
  return dateOnlyInWindow(range[0], range[1], window, now);
}

/**
 * Calendar day `YYYY-MM-DD`. Invalid dates do not count. 24H includes that
 * UTC day only when it is today; 3D, 7D, and 30D use overlap.
 */
export function dayInWindow(isoDate: string, window: TimeWindow, now = Date.now()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = Number(match[3]);
  const start = Date.UTC(year, month - 1, date);
  const check = new Date(start);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== date) return false;
  return dateOnlyInWindow(start, start + 24 * 60 * 60 * 1000, window, now);
}
