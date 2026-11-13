const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SHORT_DATE = /^[A-Za-z]{3,9} \d{1,2}$/;

/**
 * Parses a stored transaction date. New records use ISO `YYYY-MM-DD`; older ones may hold
 * `Today` or a short `Sep 8` form, which is read as the current year.
 */
export function parseTransactionDate(value: string, now = new Date()): Date {
  if (value === 'Today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const iso = ISO_DATE.exec(value);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  // Guarded because Date's lenient parser turns arbitrary text into Jan 1.
  if (SHORT_DATE.test(value)) return new Date(`${value} ${now.getFullYear()}`);
  return new Date(NaN);
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatDisplayDate(value: string): string {
  const date = parseTransactionDate(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
