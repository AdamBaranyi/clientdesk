import { Link } from 'react-router';
import { useMessages } from '../../i18n/messages.ts';
import { legalMessages } from './legal-messages.ts';

/** Auch die Fusszeile setzt ihn für die Verweise auf Quelltext und Fallstudie. */
export const LINK_CLASS = 'inline-flex min-h-11 items-center hover:text-ink';

/**
 * Impressum und Datenschutz, von jeder Seite aus erreichbar: auf den
 * öffentlichen Seiten in der Fusszeile, in Team- und Kundenansicht unten in
 * der Seitenleiste. 44 Pixel hoch wie jedes andere Bedienelement, auch wenn
 * die Schrift klein ist.
 */
export function LegalLinks({ className = '' }: { className?: string }) {
  const m = useMessages(legalMessages);

  return (
    <nav
      aria-label={m.navigation}
      className={`text-body flex flex-wrap gap-x-4 text-muted ${className}`}
    >
      <Link to="/impressum" className={LINK_CLASS}>
        {m.imprint}
      </Link>
      <Link to="/datenschutz" className={LINK_CLASS}>
        {m.privacy}
      </Link>
    </nav>
  );
}
