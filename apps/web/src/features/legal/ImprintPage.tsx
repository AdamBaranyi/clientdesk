import { useMessages } from '../../i18n/messages.ts';
import { REPOSITORY_URL } from '../../lib/site.ts';
import { imprintMessages } from './imprint-messages.ts';
import { LegalPage, LegalSection, OperatorAddress } from './LegalPage.tsx';
import { OPERATOR } from './operator.ts';

export function ImprintPage() {
  const m = useMessages(imprintMessages);

  return (
    <LegalPage title={m.title} path="/impressum">
      <LegalSection title={m.responsible}>
        <OperatorAddress />
      </LegalSection>

      <LegalSection title={m.aboutTitle}>
        <p>{m.about}</p>
      </LegalSection>

      <LegalSection title={m.copyrightTitle}>
        <p>
          {m.copyright(OPERATOR.name)}{' '}
          <a href={REPOSITORY_URL} className="underline underline-offset-2">
            github.com/AdamBaranyi/tallyroom
          </a>
          .
        </p>
        <p>{m.font}</p>
      </LegalSection>
    </LegalPage>
  );
}
