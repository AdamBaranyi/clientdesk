import { Link } from 'react-router';
import { DEMO_LIFETIME_MINUTES } from '@tallyroom/contracts';
import { useMessages } from '../../i18n/messages.ts';
import { LegalPage, LegalSection, OperatorAddress } from './LegalPage.tsx';
import { OPERATOR } from './operator.ts';
import { privacyMessages } from './privacy-messages.ts';

/**
 * Ohne hinterlegte Adresse — lokal oder in der CI — verweist der Satz aufs
 * Impressum. Ein Link mit leerem Text wäre für Screenreader stumm; genau das
 * hat die CI gefunden, als lokal eine Adresse in der .env stand und dort
 * keine. Im Produktions-Image ist die Adresse Pflicht.
 */
function ContactSentence() {
  const m = useMessages(privacyMessages);

  if (!OPERATOR.email) {
    return (
      <>
        {m.contactByImprint}{' '}
        <Link to="/impressum" className="underline underline-offset-2">
          {m.contactByImprintLink}
        </Link>{' '}
        {m.contactByImprintEnd}
      </>
    );
  }

  return (
    <>
      {m.contactByEmail}{' '}
      <a href={`mailto:${OPERATOR.email}`} className="underline underline-offset-2">
        {OPERATOR.email}
      </a>{' '}
      {m.contactByEmailEnd}
    </>
  );
}

export function PrivacyPage() {
  const m = useMessages(privacyMessages);

  return (
    <LegalPage title={m.title} path="/datenschutz">
      <p className="text-body text-muted">{m.intro(m.date)}</p>

      <LegalSection title={m.responsible}>
        <OperatorAddress />
      </LegalSection>

      <LegalSection title={m.whereTitle}>
        <p>{m.where}</p>
      </LegalSection>

      <LegalSection title={m.visitTitle}>
        <p>{m.visitAddress}</p>
        <p>{m.visitLog}</p>
      </LegalSection>

      <LegalSection title={m.cookieTitle}>
        <p>
          {m.cookieBefore} <code className="font-mono">tallyroom.sid</code>
          {m.cookieAfter}
        </p>
        <p>{m.localStorage}</p>
      </LegalSection>

      <LegalSection title={m.demoTitle}>
        <p>{m.demo(DEMO_LIFETIME_MINUTES)}</p>
      </LegalSection>

      <LegalSection title={m.accountsTitle}>
        <p>{m.accounts}</p>
      </LegalSection>

      <LegalSection title={m.notTitle}>
        <p>{m.not}</p>
      </LegalSection>

      <LegalSection title={m.backupTitle}>
        <p>{m.backup}</p>
      </LegalSection>

      <LegalSection title={m.rightsTitle}>
        <p>
          {m.rights} <ContactSentence /> {m.complaint}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
