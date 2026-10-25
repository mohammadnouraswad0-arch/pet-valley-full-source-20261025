export type Window = { start: number; end: number };
export type HourRow = { weekday: number; openMin: number; closeMin: number };
export type ExceptionRow = { date: string; closed: boolean; openMin: number | null; closeMin: number | null; note: string };

/** Current date (YYYY-MM-DD), weekday and minutes-since-midnight in a given IANA timezone. */
export function nowInTz(tz: string, at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: wd,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function weekdayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Working windows of a branch for a specific date, applying exceptions. */
export function branchWindows(date: string, hours: HourRow[], exceptions: ExceptionRow[]): Window[] {
  const ex = exceptions.find((e) => e.date === date);
  if (ex) {
    if (ex.closed || ex.openMin == null || ex.closeMin == null) return [];
    return [{ start: ex.openMin, end: ex.closeMin }];
  }
  const wd = weekdayOf(date);
  return hours
    .filter((h) => h.weekday === wd)
    .map((h) => ({ start: h.openMin, end: h.closeMin }))
    .sort((a, b) => a.start - b.start);
}

export function intersect(a: Window[], b: Window[]): Window[] {
  const out: Window[] = [];
  for (const x of a)
    for (const y of b) {
      const s = Math.max(x.start, y.start);
      const e = Math.min(x.end, y.end);
      if (e > s) out.push({ start: s, end: e });
    }
  return out.sort((p, q) => p.start - q.start);
}

export function isOpenAt(minutes: number, windows: Window[]) {
  return windows.some((w) => minutes >= w.start && minutes < w.end);
}
