export interface TimeEntry {
  date?: string | null;
  time_in?: string | null;
  time_out?: string | null;
  break_time?: number | string | null;
}

export function toLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeEntryDate(value?: string | null): string | null {
  if (!value) return null;

  const raw = String(value);
  const datePrefix = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePrefix) return datePrefix;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return toLocalDateInputValue(parsed);
}

export function formatLogDate(value?: string | null): string {
  const normalized = normalizeEntryDate(value);
  if (!normalized) return "No valid logs yet";

  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function calculateEntryHours(
  timeIn?: string | null,
  timeOut?: string | null,
  breakTime?: number | string | null,
): number {
  if (!timeIn || !timeOut) return 0;

  const [inHour, inMinute] = String(timeIn).split(":").map(Number);
  const [outHour, outMinute] = String(timeOut).split(":").map(Number);
  if ([inHour, inMinute, outHour, outMinute].some(Number.isNaN)) return 0;

  const breakMinutes = Math.max(0, Number(breakTime) || 0);
  const totalMinutes =
    outHour * 60 + outMinute - (inHour * 60 + inMinute) - breakMinutes;

  return Math.max(0, totalMinutes / 60);
}

export function getEntryHours(entry: TimeEntry): number {
  return calculateEntryHours(entry.time_in, entry.time_out, entry.break_time);
}

export function getTotalLoggedHours(entries: TimeEntry[]): number {
  return entries.reduce((total, entry) => total + getEntryHours(entry), 0);
}

export function hasCompleteTime(entry: TimeEntry): boolean {
  return Boolean(entry.time_in && entry.time_out);
}

export function hasInvalidTimeRange(
  timeIn?: string | null,
  timeOut?: string | null,
  breakTime?: number | string | null,
): boolean {
  return Boolean(timeIn && timeOut && calculateEntryHours(timeIn, timeOut, breakTime) <= 0);
}

export function countIncompleteTimeEntries(entries: TimeEntry[]): number {
  return entries.filter((entry) => !entry.time_in || !entry.time_out).length;
}

export function hasEntryOnDate(entries: TimeEntry[], date: string): boolean {
  return entries.some((entry) => normalizeEntryDate(entry.date) === date);
}

export function getLatestValidLogDate(entries: TimeEntry[]): string | null {
  return entries.reduce<string | null>((latest, entry) => {
    const date = normalizeEntryDate(entry.date);
    if (!date || getEntryHours(entry) <= 0) return latest;

    return !latest || date > latest ? date : latest;
  }, null);
}

export function getLatestTimedEntry<T extends TimeEntry>(entries: T[]): T | null {
  let latestEntry: T | null = null;
  let latestDate = "";

  for (const entry of entries) {
    if (!hasCompleteTime(entry)) continue;

    const date = normalizeEntryDate(entry.date) ?? "";
    if (!latestEntry || date > latestDate) {
      latestEntry = entry;
      latestDate = date;
    }
  }

  return latestEntry;
}
