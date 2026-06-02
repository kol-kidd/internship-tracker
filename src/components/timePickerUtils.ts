// Clamp minute to a valid 0-59 range. Kept (as a pass-through) so existing
// callers compile; the time picker now supports every minute, no 5-min snapping.
export function snapMinute(m: number): number {
  if (Number.isNaN(m)) return 0;
  return Math.min(59, Math.max(0, Math.round(m)));
}

/** Returns default time_in (now) and time_out (now + 8h) in "HH:MM" format. */
export function getDefaultTimes(): { timeIn: string; timeOut: string } {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  const timeIn = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const outDate = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const oh = outDate.getHours();
  const om = outDate.getMinutes();
  const timeOut = `${String(oh).padStart(2, "0")}:${String(om).padStart(2, "0")}`;

  return { timeIn, timeOut };
}
