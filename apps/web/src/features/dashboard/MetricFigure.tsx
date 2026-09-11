import type { CSSProperties } from 'react';
import { Link } from 'react-router';

interface Props {
  label: string;
  /** Einheit über der Zahl, zum Beispiel `CHF`. Zähler haben keine. */
  unit?: string;
  /** Die Zahl selbst, bereits formatiert. */
  figure: string;
  /** Rappen, falls der Betrag krumm ist. Werden kleiner gesetzt. */
  cents?: string | null;
  note: string;
  to: string;
  /** Stellung im Band. Bestimmt, wann die Zelle im Kielwasser der Messlatte erscheint. */
  index: number;
  /** Die Leitzahl steht grösser und breiter als die Zähler. */
  lead?: boolean;
}

const zustandswechsel = 'transition-colors ease-state duration-[var(--dur-snap)]';

/**
 * Eine Zelle im Kennzahlband, gebaut wie ein Feld auf einem Datenblatt:
 * Teilstrich, Bezeichnung, Einheit, Messwert, Fussnote.
 *
 * Der eigentliche Effekt ist der Dichtekontrast — 72 Pixel Zahl gegen 16 Pixel
 * Einheit, also 4,5:1. Nicht die Bewegung.
 */
export function MetricFigure({ label, unit, figure, cents, note, to, index, lead = false }: Props) {
  return (
    <Link
      to={to}
      style={{ '--motion-index': index } as CSSProperties}
      className="motion-figure group flex flex-col text-ink"
    >
      <span aria-hidden className={`mb-3 h-2 w-px bg-line ${zustandswechsel} group-hover:bg-ink`} />
      <span
        className={`font-condensed text-body font-semibold tracking-[0.06em] uppercase text-muted ${zustandswechsel} group-hover:text-ink`}
      >
        {label}
      </span>

      {unit ? (
        <span className="mt-1 font-condensed text-body tracking-[0.06em] uppercase text-muted">
          {unit}
        </span>
      ) : null}

      <span
        className={[
          'mt-2 font-mono leading-none font-medium tabular-nums',
          // Unter 768 Pixeln eine Stufe kleiner, sonst sprengt ein Betrag mit
          // Rappen die 320-Pixel-Ansicht. Und ein Betrag jenseits der Million
          // geht auch auf dem Desktop eine Stufe zurück: bei 72 Pixeln braucht
          // `10'000'000` mehr Platz, als die Zelle hat.
          lead && figure.length <= 9 ? 'text-figure md:text-hero' : 'text-page md:text-figure',
        ].join(' ')}
      >
        {figure}
        {cents ? <span className="text-section text-muted">.{cents}</span> : null}
      </span>

      <span className="mt-3 text-body leading-snug text-muted">{note}</span>
    </Link>
  );
}
