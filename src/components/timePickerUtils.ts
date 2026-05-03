// Round minute to nearest 5-min increment for display.
export function snapMinute(m: number): number {
  return Math.round(m / 5) * 5 === 60 ? 55 : Math.round(m / 5) * 5;
}

/** Returns default time_in (now) and time_out (now + 8h) in "HH:MM" format. */
export function getDefaultTimes(): { timeIn: string; timeOut: string } {
  const now = new Date();
  const h = now.getHours();
  const m = snapMinute(now.getMinutes());

  const timeIn = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const outDate = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const oh = outDate.getHours();
  const om = snapMinute(outDate.getMinutes());
  const timeOut = `${String(oh).padStart(2, "0")}:${String(om).padStart(2, "0")}`;

  return { timeIn, timeOut };
}
