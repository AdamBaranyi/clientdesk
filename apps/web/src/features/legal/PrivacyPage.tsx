import { Link } from 'react-router';
import { DEMO_LIFETIME_MINUTES } from '@tallyroom/contracts';
import { LegalPage, LegalSection, OperatorAddress } from './LegalPage.tsx';
import { OPERATOR, PRIVACY_NOTICE_DATE } from './operator.ts';

/**
 * Ohne hinterlegte Adresse — lokal oder in der CI — verweist der Satz aufs
 * Impressum. Ein Link mit leerem Text wäre für Screenreader stumm; genau das
 * hat die CI gefunden, als lokal eine Adresse in der .env stand und dort
 * keine. Im Produktions-Image ist die Adresse Pflicht.
 */
function ContactSentence() {
  if (!OPERATOR.email) {
    return (
      <>
        Eine Nachricht an die Adresse im{' '}
        <Link to="/impressum" className="underline underline-offset-2">
          Impressum
        </Link>{' '}
        genügt.
      </>
    );
  }

  return (
    <>
      Eine E-Mail an{' '}
      <a href={`mailto:${OPERATOR.email}`} className="underline underline-offset-2">
        {OPERATOR.email}
      </a>{' '}
      genügt.
    </>
  );
}

/**
 * Jede Aussage hier ist am laufenden Aufbau geprüft, nicht angenommen: was im
 * Log steht, wann das Cookie entsteht, wie lange eine Adresse im Speicher
 * bleibt. Ändert sich eines davon im Code, muss es hier nachgezogen werden.
 */
export function PrivacyPage() {
  return (
    <LegalPage title="Datenschutzerklärung" path="/datenschutz">
      <p className="text-body text-muted">
        Stand: {PRIVACY_NOTICE_DATE}. Diese Erklärung sagt, welche Personendaten beim Besuch und bei
        der Nutzung anfallen, wozu und wie lange. Sie ist kurz, weil wenig anfällt.
      </p>

      <LegalSection title="Verantwortlich">
        <OperatorAddress />
      </LegalSection>

      <LegalSection title="Wo die Daten liegen">
        <p>
          Die Seite läuft auf einem Server der FSIT AG in deren Rechenzentren in der Schweiz.
          Webserver, Anwendung, Datenbank und Dateispeicher laufen alle auf diesem einen Server. Es
          werden keine Daten ins Ausland übermittelt, und kein weiterer Dienst ist eingebunden.
        </p>
      </LegalSection>

      <LegalSection title="Beim Aufruf der Seite">
        <p>
          Ihr Browser übermittelt Ihre IP-Adresse, ohne sie kommt keine Verbindung zustande.
          Gespeichert wird sie nicht: Weder der Webserver noch die Anwendung schreibt sie in ein
          Protokoll. Um Anmeldeversuche und Demo-Starts zu begrenzen, hält die Anwendung sie im
          Arbeitsspeicher, solange ein Zeitfenster von 15 Minuten läuft, und verwirft sie spätestens
          eine Minute danach.
        </p>
        <p>
          Protokolliert werden je Anfrage nur Zeitpunkt, Methode, Pfad, Status und Dauer, ohne
          IP-Adresse, ohne Browserkennung und ohne Suchbegriffe. Die Protokolle haben eine feste
          Höchstgrösse, ältere Einträge werden überschrieben.
        </p>
      </LegalSection>

      <LegalSection title="Cookie und lokaler Speicher">
        <p>
          Es gibt ein einziges Cookie, <code className="font-mono">tallyroom.sid</code>. Es entsteht
          erst, wenn Sie sich anmelden oder die Demo starten, und enthält nur eine zufällige Kennung
          Ihrer Sitzung. Es ist technisch notwendig und wird nach zwei Stunden ohne Aktivität
          ungültig, spätestens nach zwölf Stunden.
        </p>
        <p>
          Ihre Wahl des Erscheinungsbilds speichert der Browser lokal. Sie verlässt Ihr Gerät nicht.
        </p>
      </LegalSection>

      <LegalSection title="Die Demo">
        <p>
          Beim Start entsteht ein eigener Arbeitsbereich mit erfundenen Firmen, Personen und Zahlen.
          Nach {DEMO_LIFETIME_MINUTES} Minuten wird er gelöscht, samt allem, was Sie darin
          eingegeben haben, Ihrer Sitzung und den Dateien. Eigene Dateien nimmt die Demo nicht an.
          Bitte geben Sie in der Demo keine echten Personendaten ein.
        </p>
      </LegalSection>

      <LegalSection title="Konten">
        <p>
          Ausserhalb der Demo entstehen Konten nur auf Einladung. Gespeichert werden Name,
          E-Mail-Adresse, das Passwort als nicht umkehrbarer Hash und die Zugehörigkeit zu
          Arbeitsbereichen, dazu die Inhalte und Dokumente, die dort angelegt werden. Zweck ist
          allein der Betrieb der Anwendung. Die Daten bleiben, bis das Konto gelöscht wird, und das
          geschieht auf Anfrage.
        </p>
      </LegalSection>

      <LegalSection title="Was es nicht gibt">
        <p>
          Keine Analyse- oder Statistikdienste, keine Werbung, keine eingebetteten Inhalte Dritter,
          keine Schriften von fremden Servern und keine Weitergabe an Dritte.
        </p>
      </LegalSection>

      <LegalSection title="Datensicherung">
        <p>
          Der Anbieter sichert den Server wöchentlich, nach seinen Angaben ebenfalls in der Schweiz.
          Eine Sicherung enthält den Stand zum Zeitpunkt der Sicherung, also auch die Daten einer
          gerade laufenden Demo.
        </p>
      </LegalSection>

      <LegalSection title="Ihre Rechte">
        <p>
          Sie können Auskunft über Ihre Daten verlangen, ihre Berichtigung oder Löschung, und der
          Bearbeitung widersprechen. <ContactSentence /> Beschwerden können Sie an den
          Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) richten.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
