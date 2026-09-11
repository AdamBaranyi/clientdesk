import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { LanguageToggle } from '../../components/base/LanguageToggle.tsx';
import { ThemeToggle } from '../../components/base/ThemeToggle.tsx';
import { Wordmark } from '../../components/base/Wordmark.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { SITE_URL } from '../../lib/site.ts';
import { useDocumentTitle } from '../../lib/use-document-title.ts';
import { legalMessages } from './legal-messages.ts';
import { OPERATOR } from './operator.ts';
import { SiteFooter } from './SiteFooter.tsx';

interface LegalPageProps {
  title: string;
  path: string;
  children: ReactNode;
}

/**
 * Rahmen für Impressum und Datenschutz. Beide sind ohne Anmeldung
 * erreichbar, auch aus einer laufenden Sitzung heraus.
 */
export function LegalPage({ title, path, children }: LegalPageProps) {
  useDocumentTitle(`${title} · Tallyroom`);
  const m = useMessages(legalMessages);

  return (
    <div className="flex min-h-dvh flex-col">
      <link rel="canonical" href={`${SITE_URL}${path}`} />
      <header className="flex items-end justify-between gap-3 border-b border-line px-3 sm:px-6">
        <Link to="/" aria-label={m.toHome} className="min-w-0">
          <Wordmark name="Tallyroom" />
        </Link>
        <span className="flex items-center gap-2 pb-4">
          <LanguageToggle />
          <ThemeToggle />
        </span>
      </header>

      <main id="inhalt" className="flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <article className="mx-auto flex w-full max-w-[68ch] flex-col gap-8">
          <h1 className="text-page leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
          {m.bindingVersion && <p className="text-body text-muted">{m.bindingVersion}</p>}
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="text-body flex flex-col gap-3 border-t border-line pt-5">
      <h2 className="text-section font-semibold tracking-[-0.01em]">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Die Anschrift, wie sie in Impressum und Datenschutzerklärung steht. Zeilen
 * ohne Wert fallen weg — lokal ohne Angaben in der .env steht dann nur der
 * Name, statt leerer Zeilen, die wie ein Fehler aussehen.
 */
export function OperatorAddress() {
  const { country } = useMessages(legalMessages);
  const lines = [OPERATOR.name, OPERATOR.street, OPERATOR.postalCodeAndCity, country];

  return (
    <address className="text-body flex flex-col not-italic">
      {lines.filter(Boolean).map((line) => (
        <span key={line}>{line}</span>
      ))}
      {OPERATOR.email && (
        <a
          href={`mailto:${OPERATOR.email}`}
          className="mt-2 self-start underline underline-offset-2"
        >
          {OPERATOR.email}
        </a>
      )}
      {OPERATOR.phone && (
        <a
          href={`tel:${OPERATOR.phone.replaceAll(' ', '')}`}
          className="self-start underline underline-offset-2"
        >
          {OPERATOR.phone}
        </a>
      )}
    </address>
  );
}
