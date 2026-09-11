import { describe, expect, it } from 'vitest';
import { findSmallFonts, stripComments } from './check-font-floor.mjs';

const found = (content) => findSmallFonts(content).map((f) => [f.line, f.text]);

describe('findSmallFonts', () => {
  it('findet Tailwinds kleine Grössen, auch hinter einem Präfix', () => {
    expect(found('<p className="text-sm">\n<span className="md:text-xs">')).toEqual([
      [1, 'text-sm'],
      [2, 'text-xs'],
    ]);
  });

  it('misst Grössen in Klammern in px und rem', () => {
    expect(found('text-[13px] text-[0.75rem] text-[16px] text-[20px] text-[1rem]')).toEqual([
      [1, 'text-[13px]'],
      [1, 'text-[0.75rem]'],
    ]);
  });

  it('liest fontSize in Objekten und JSX-Attributen', () => {
    const code = "tick={{ fontSize: 11 }}\n<text fontSize={12} />\nstyle={{ fontSize: '14px' }}";
    expect(found(code).map(([line]) => line)).toEqual([1, 2, 3]);
    expect(found('fontSize: 16\nfontSize: CHART_TEXT')).toEqual([]);
  });

  it('prüft font-size in CSS und die Grössen-Tokens', () => {
    expect(found('a { font-size: 12px; }\n:root { --text-micro: 11px; }')).toEqual([
      [1, 'font-size: 12px'],
      [2, '--text-micro: 11px'],
    ]);
    expect(found('html { font-size: 100%; }\n--text-body: 16px;\n--text-xs: initial;')).toEqual([]);
  });

  it('nimmt bei clamp() die Untergrenze', () => {
    expect(found('text-[length:clamp(12px,4vw,20px)]')).toEqual([[1, 'clamp(12px']]);
    expect(found('text-[length:clamp(16px,5vw,20px)]')).toEqual([]);
  });

  it('übergeht Kommentare und Namen, die nur ähnlich klingen', () => {
    const code = [
      '/* text-sm war hier */',
      '// text-xs auch',
      '{/* fontSize: 11 */}',
      'className="sm:text-body text-small context-sm"',
    ].join('\n');
    expect(found(code)).toEqual([]);
  });
});

describe('stripComments', () => {
  it('lässt Zeilen und Adressen stehen', () => {
    const code = "a /* x\ny */ b\nconst url = 'https://example.test'; // weg";
    const stripped = stripComments(code);
    expect(stripped.split('\n')).toHaveLength(3);
    expect(stripped).toContain('https://example.test');
    expect(stripped).not.toContain('weg');
  });
});
