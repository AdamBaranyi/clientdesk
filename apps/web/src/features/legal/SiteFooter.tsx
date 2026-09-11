import { LegalLinks } from './LegalLinks.tsx';
import { OPERATOR } from './operator.ts';

/** Fusszeile der öffentlichen Seiten: Urheber, Hinweis zur Demo, Rechtliches. */
export function SiteFooter() {
  return (
    <footer className="text-micro flex flex-col gap-1 border-t border-line px-4 py-4 text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>© 2026 {OPERATOR.name}. Portfolio-Projekt, keine echten Kundendaten.</p>
      <LegalLinks />
    </footer>
  );
}
