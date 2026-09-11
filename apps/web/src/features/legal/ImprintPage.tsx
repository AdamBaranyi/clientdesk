import { REPOSITORY_URL } from '../../lib/site.ts';
import { LegalPage, LegalSection, OperatorAddress } from './LegalPage.tsx';
import { OPERATOR } from './operator.ts';

export function ImprintPage() {
  return (
    <LegalPage title="Impressum" path="/impressum">
      <LegalSection title="Verantwortlich">
        <OperatorAddress />
      </LegalSection>

      <LegalSection title="Worum es sich handelt">
        <p>
          Tallyroom ist ein Portfolio-Projekt und kein kommerzielles Angebot. Die Demo zeigt, wie
          die Anwendung arbeitet. Alle Firmen, Personen und Zahlen darin sind erfunden.
        </p>
      </LegalSection>

      <LegalSection title="Urheberrecht">
        <p>
          Gestaltung und Quelltext © 2026 {OPERATOR.name}, alle Rechte vorbehalten. Der Quelltext
          ist zur Ansicht öffentlich:{' '}
          <a href={REPOSITORY_URL} className="underline underline-offset-2">
            github.com/AdamBaranyi/tallyroom
          </a>
          .
        </p>
        <p>Schrift: IBM Plex, unter der SIL Open Font License 1.1.</p>
      </LegalSection>
    </LegalPage>
  );
}
