import { describe, expect, it } from 'vitest';
import { outOfView, placeCard, scrollToTop, spotlightBox } from './tour-position.ts';

const desktop = { width: 1440, height: 900 };
const phone = { width: 320, height: 640 };
const card = { width: 400, height: 260 };

describe('placeCard', () => {
  it('steht ohne Ziel in der Mitte', () => {
    expect(placeCard(null, card, desktop)).toEqual({ top: 320, left: 520, covers: false });
  });

  it('steht unter dem Ziel, wenn dort Platz ist', () => {
    const target = { top: 80, left: 300, width: 800, height: 200 };
    expect(placeCard(target, card, desktop)).toEqual({ top: 292, left: 300, covers: false });
  });

  it('weicht nach oben aus, wenn unten der Platz fehlt', () => {
    const target = { top: 700, left: 300, width: 200, height: 44 };
    expect(placeCard(target, card, desktop)).toEqual({ top: 428, left: 300, covers: false });
  });

  it('steht rechts neben einem hohen, schmalen Ziel', () => {
    const navigation = { top: 100, left: 12, width: 248, height: 520 };
    const small = { width: 1024, height: 768 };
    expect(placeCard(navigation, card, small)).toEqual({ top: 100, left: 272, covers: false });
  });

  it('bleibt bei einem rechtsbündigen Ziel im Bild', () => {
    const target = { top: 10, left: 1300, width: 120, height: 44 };
    expect(placeCard(target, card, desktop).left).toBe(1440 - 400 - 12);
  });

  it('steht bei 320 Pixeln und grossem Ziel unten am Rand und meldet das', () => {
    const metrics = { top: 150, left: 12, width: 296, height: 560 };
    const narrow = { width: 296, height: 300 };
    expect(placeCard(metrics, narrow, phone)).toEqual({ top: 328, left: 12, covers: true });
  });

  it('passt unter das Ziel, nachdem es nach oben gescrollt ist', () => {
    const roles = { top: 190, left: 12, width: 296, height: 210 };
    const narrow = { width: 296, height: 290 };
    expect(placeCard(roles, narrow, phone).covers).toBe(true);

    const shift = scrollToTop(roles);
    const scrolled = { ...roles, top: roles.top - shift };
    expect(placeCard(scrolled, narrow, phone)).toEqual({ top: 234, left: 12, covers: false });
  });

  it('beginnt am oberen Rand, wenn die Karte höher als das Bild ist', () => {
    const tall = { width: 296, height: 700 };
    expect(placeCard(null, tall, phone).top).toBe(12);
  });
});

describe('spotlightBox', () => {
  it('legt einen Rand um das Ziel', () => {
    const target = { top: 100, left: 100, width: 200, height: 50 };
    expect(spotlightBox(target, desktop)).toEqual({ top: 94, left: 94, width: 212, height: 62 });
  });

  it('schneidet ab, was über den Bildrand hinausragt', () => {
    const target = { top: -40, left: 0, width: 320, height: 900 };
    expect(spotlightBox(target, phone)).toEqual({ top: 0, left: 0, width: 320, height: 640 });
  });
});

describe('outOfView', () => {
  it('erkennt ein Ziel, das oben am Rand klebt oder unten hinausragt', () => {
    expect(outOfView({ top: 2, left: 0, width: 100, height: 40 }, phone)).toBe(true);
    expect(outOfView({ top: 600, left: 0, width: 100, height: 60 }, phone)).toBe(true);
    expect(outOfView({ top: 100, left: 0, width: 100, height: 60 }, phone)).toBe(false);
  });
});
