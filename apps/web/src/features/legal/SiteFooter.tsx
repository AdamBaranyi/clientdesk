import { useMessages } from '../../i18n/messages.ts';
import { legalMessages } from './legal-messages.ts';
import { LegalLinks } from './LegalLinks.tsx';
import { OPERATOR } from './operator.ts';

/**
 * Fusszeile der öffentlichen Seiten: Urheber, Hinweis zur Demo, Rechtliches.
 *
 * Alles mittig, auf jeder Breite — Wunsch des Betreibers vom 12.09.2026.
 * Vorher stand der Urheber links und das Rechtliche rechts, auf dem Telefon
 * beides untereinander am linken Rand.
 */
export function SiteFooter() {
  const m = useMessages(legalMessages);

  return (
    <footer className="text-body flex flex-col items-center gap-1 border-t border-line px-4 py-4 text-center text-muted sm:flex-row sm:justify-center sm:gap-6 sm:px-6">
      <p>{m.footer(OPERATOR.name)}</p>
      <LegalLinks className="justify-center" />
    </footer>
  );
}
