import { describe, expect, it } from 'vitest';
import { countLines } from './check-file-length.mjs';

/**
 * @param {number} count
 * @param {boolean} trailingNewline
 */
function lines(count, trailingNewline) {
  const body = Array.from({ length: count }, (_, i) => `Zeile ${i + 1}`).join('\n');
  return trailingNewline ? `${body}\n` : body;
}

describe('countLines', () => {
  it('zählt eine leere Datei als null Zeilen', () => {
    expect(countLines('')).toBe(0);
  });

  it('zählt eine Datei ohne abschliessenden Zeilenumbruch', () => {
    expect(countLines('a\nb\nc')).toBe(3);
  });

  it('wertet genau einen abschliessenden Zeilenumbruch nicht als weitere Zeile', () => {
    expect(countLines('a\nb\nc\n')).toBe(3);
  });

  it('zählt einen zweiten abschliessenden Zeilenumbruch als Leerzeile', () => {
    expect(countLines('a\nb\nc\n\n')).toBe(4);
  });

  it('zählt Leerzeilen und Kommentare mit', () => {
    expect(countLines('const a = 1;\n\n// Kommentar\n\nconst b = 2;\n')).toBe(5);
  });

  it.each([
    [399, false],
    [399, true],
    [400, false],
    [400, true],
    [401, false],
    [401, true],
  ])('trifft die Grenzfälle: %i Zeilen, abschliessender Umbruch %s', (count, trailingNewline) => {
    expect(countLines(lines(count, trailingNewline))).toBe(count);
  });

  it('schlägt erst ab 401 Zeilen an', () => {
    expect(countLines(lines(400, true)) > 400).toBe(false);
    expect(countLines(lines(401, true)) > 400).toBe(true);
  });
});
