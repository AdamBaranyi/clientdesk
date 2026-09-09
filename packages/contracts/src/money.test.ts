import { describe, expect, it } from 'vitest';
import { formatAmountMinor, parseAmountToMinor } from './money.ts';

describe('parseAmountToMinor', () => {
  it('liest ganze Franken', () => {
    expect(parseAmountToMinor('4850')).toBe(485_000);
  });

  it('liest Rappen', () => {
    expect(parseAmountToMinor('250.50')).toBe(25_050);
  });

  it('füllt eine einstellige Rappenangabe auf', () => {
    // 250.5 sind 250 Franken 50 Rappen, nicht 5.
    expect(parseAmountToMinor('250.5')).toBe(25_050);
  });

  it('akzeptiert Schweizer Tausendertrennung und Komma', () => {
    expect(parseAmountToMinor("4'850.00")).toBe(485_000);
    expect(parseAmountToMinor('4850,25')).toBe(485_025);
  });

  it('erlaubt null als Betrag — kostenlose Verträge sind zulässig', () => {
    expect(parseAmountToMinor('0')).toBe(0);
  });

  it('weist Unsinn zurück, statt still null zu liefern', () => {
    expect(parseAmountToMinor('')).toBeNull();
    expect(parseAmountToMinor('abc')).toBeNull();
    expect(parseAmountToMinor('-100')).toBeNull();
    expect(parseAmountToMinor('12.345')).toBeNull();
  });

  it('rechnet ohne Gleitkommafehler', () => {
    // 0.1 + 0.2 wäre in Gleitkomma nicht 0.3; in Rappen ist es schlicht 30.
    expect(parseAmountToMinor('0.10')! + parseAmountToMinor('0.20')!).toBe(30);
  });
});

describe('formatAmountMinor', () => {
  it('formatiert mit Tausendertrennung und zwei Nachkommastellen', () => {
    expect(formatAmountMinor(485_000)).toBe("4'850.00");
    expect(formatAmountMinor(25_050)).toBe('250.50');
    expect(formatAmountMinor(0)).toBe('0.00');
  });

  it('trennt erst ab vier Stellen', () => {
    expect(formatAmountMinor(99_900)).toBe('999.00');
    expect(formatAmountMinor(100_000)).toBe("1'000.00");
  });

  it('ist zur Eingabe hin verlustfrei', () => {
    for (const minor of [0, 5, 99, 100, 25_050, 485_000, 123_456_789]) {
      expect(parseAmountToMinor(formatAmountMinor(minor))).toBe(minor);
    }
  });
});
