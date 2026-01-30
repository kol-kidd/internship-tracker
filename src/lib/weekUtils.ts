export interface WeekBounds {
  start: string;
  end: string;
}

export function getWeekBounds(date: Date): WeekBounds {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export function isDateInWeekBounds(dateStr: string, bounds: WeekBounds): boolean {
  return dateStr >= bounds.start && dateStr <= bounds.end;
}
