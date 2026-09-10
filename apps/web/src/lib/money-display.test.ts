import { describe, expect, it } from 'vitest';
import { splitAmountForDisplay } from './money-display.ts';

describe('splitAmountForDisplay', () => {
  it('lässt glatte Beträge ohne Rappen', () => {
    expect(splitAmountForDisplay(297_000)).toEqual({ francs: "2'970", cents: null });
  });

  it('behält krumme Rappen, statt sie zu runden', () => {
    expect(splitAmountForDisplay(297_040)).toEqual({ francs: "2'970", cents: '40' });
  });

  it('behält die Schweizer Tausendertrennung', () => {
    expect(splitAmountForDisplay(1_234_567_00)).toEqual({
      francs: "1'234'567",
      cents: null,
    });
  });

  it('zeigt null Franken als Zahl, nicht als leere Zelle', () => {
    expect(splitAmountForDisplay(0)).toEqual({ francs: '0', cents: null });
  });

  it('verwechselt fünf Rappen nicht mit fünfzig', () => {
    expect(splitAmountForDisplay(297_005)).toEqual({ francs: "2'970", cents: '05' });
  });
});
