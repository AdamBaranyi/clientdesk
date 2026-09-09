import { describe, expect, it } from 'vitest';
import { lastDayOfMonth, monthEndPoints, todayInTimezone } from './workspace-date.ts';

describe('todayInTimezone', () => {
  it('nimmt das Kalenderdatum der Workspace-Zeitzone, nicht das des Servers', () => {
    // Winterzeit, UTC+1: 23:30 UTC ist in Zürich bereits 00:30 des Folgetags.
    const winter = new Date('2026-03-15T23:30:00Z');
    expect(todayInTimezone('Europe/Zurich', winter)).toBe('2026-03-16');
    expect(todayInTimezone('UTC', winter)).toBe('2026-03-15');
  });

  it('berücksichtigt die Sommerzeit', () => {
    // Sommerzeit, UTC+2: schon 22:30 UTC ist in Zürich der Folgetag.
    const sommer = new Date('2026-07-15T22:30:00Z');
    expect(todayInTimezone('Europe/Zurich', sommer)).toBe('2026-07-16');
    expect(todayInTimezone('UTC', sommer)).toBe('2026-07-15');
  });

  it('liefert das Format JJJJ-MM-TT', () => {
    expect(todayInTimezone('Europe/Zurich', new Date('2026-01-05T10:00:00Z'))).toBe('2026-01-05');
  });
});

describe('lastDayOfMonth', () => {
  it('kennt kurze Monate', () => {
    expect(lastDayOfMonth(2026, 4)).toBe(30);
    expect(lastDayOfMonth(2026, 2)).toBe(28);
  });

  it('kennt Schaltjahre', () => {
    expect(lastDayOfMonth(2028, 2)).toBe(29);
  });
});

describe('monthEndPoints', () => {
  it('liefert sechs Stichtage, den letzten als laufenden Monat', () => {
    const points = monthEndPoints('2026-09-09', 6);
    expect(points).toHaveLength(6);
    expect(points.map((point) => point.date)).toEqual([
      '2026-04-30',
      '2026-05-31',
      '2026-06-30',
      '2026-07-31',
      '2026-08-31',
      '2026-09-09',
    ]);
    expect(points.at(-1)?.isCurrentMonth).toBe(true);
    expect(points.slice(0, -1).every((point) => !point.isCurrentMonth)).toBe(true);
  });

  it('rechnet über den Jahreswechsel zurück', () => {
    const points = monthEndPoints('2026-02-10', 4);
    expect(points.map((point) => `${point.label} ${point.date}`)).toEqual([
      'Nov 2025-11-30',
      'Dez 2025-12-31',
      'Jan 2026-01-31',
      'Feb 2026-02-10',
    ]);
  });

  it('nimmt für den laufenden Monat das heutige Datum, nicht das Monatsende', () => {
    const points = monthEndPoints('2026-09-09', 1);
    expect(points[0]?.date).toBe('2026-09-09');
  });
});
