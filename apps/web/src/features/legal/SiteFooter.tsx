import { useMessages } from '../../i18n/messages.ts';
import { legalMessages } from './legal-messages.ts';
import { LegalLinks } from './LegalLinks.tsx';
import { OPERATOR } from './operator.ts';

/** Fusszeile der öffentlichen Seiten: Urheber, Hinweis zur Demo, Rechtliches. */
export function SiteFooter() {
  const m = useMessages(legalMessages);

  return (
    <footer className="text-micro flex flex-col gap-1 border-t border-line px-4 py-4 text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>{m.footer(OPERATOR.name)}</p>
      <LegalLinks />
    </footer>
  );
}
