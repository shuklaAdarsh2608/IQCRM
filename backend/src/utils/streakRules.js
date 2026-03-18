export const STREAK_RULES = {
  // Streak is based on calendar days in server local time.
  // You can later replace this with a DB-driven config.
  dayBoundary: "local",
  requireConsecutiveDays: true
};

export function toDateOnlyLocal(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addHours(date, hours) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

export function isWithinHours(start, end, hours) {
  const s = new Date(start);
  const e = new Date(end);
  return e.getTime() - s.getTime() <= hours * 60 * 60 * 1000;
}

