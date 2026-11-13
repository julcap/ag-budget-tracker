import { formatDisplayDate, isSameMonth, parseTransactionDate, toIsoDate } from './date';

describe('date utils', () => {
  const now = new Date(2026, 10, 13);

  it('parses ISO dates as local calendar dates', () => {
    expect(toIsoDate(parseTransactionDate('2026-09-01'))).toBe('2026-09-01');
  });

  it('parses legacy "Today" and short "Sep 8" forms against the current year', () => {
    expect(toIsoDate(parseTransactionDate('Today', now))).toBe('2026-11-13');
    expect(toIsoDate(parseTransactionDate('Sep 8', now))).toBe('2026-09-08');
  });

  it('compares months including the year', () => {
    expect(isSameMonth(new Date(2026, 10, 1), now)).toBeTrue();
    expect(isSameMonth(new Date(2025, 10, 13), now)).toBeFalse();
  });

  it('formats dates for display, passing unparseable values through', () => {
    expect(formatDisplayDate('2026-09-08')).toBe('Sep 8, 2026');
    expect(formatDisplayDate('whenever')).toBe('whenever');
  });
});
