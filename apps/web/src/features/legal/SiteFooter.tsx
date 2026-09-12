import { useMessages } from '../../i18n/messages.ts';
import { REPOSITORY_URL } from '../../lib/site.ts';
import { legalMessages } from './legal-messages.ts';
import { LegalLinks, LINK_CLASS } from './LegalLinks.tsx';
import { OPERATOR } from './operator.ts';

/** Die Fallstudie liegt im selben öffentlichen Repository. */
const CASE_STUDY_URL = `${REPOSITORY_URL}/blob/main/docs/FALLSTUDIE.md`;

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
      {/*
        Wer hier landet, sieht zuerst das Produkt. Dass es ein Portfolio-Projekt
        ist und wo der Quelltext liegt, stand bisher nur im Impressum — dort
        sucht es niemand.
      */}
      <nav aria-label={m.projectNavigation} className="flex flex-wrap justify-center gap-x-4">
        <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className={LINK_CLASS}>
          {m.sourceCode}
        </a>
        <a href={CASE_STUDY_URL} target="_blank" rel="noreferrer" className={LINK_CLASS}>
          {m.caseStudy}
        </a>
      </nav>
    </footer>
  );
}
