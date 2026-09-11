import { defineMessages } from '../../i18n/messages.ts';

/**
 * Jede Aussage hier ist am laufenden Aufbau geprüft, nicht angenommen: was im
 * Log steht, wann das Cookie entsteht, wie lange eine Adresse im Speicher
 * bleibt. Ändert sich eines davon im Code, muss es hier in jeder Sprache
 * nachgezogen werden.
 */
export const privacyMessages = defineMessages({
  de: {
    title: 'Datenschutzerklärung',
    intro: (date: string) =>
      `Stand: ${date}. Diese Erklärung sagt, welche Personendaten beim Besuch und bei der Nutzung anfallen, wozu und wie lange. Sie ist kurz, weil wenig anfällt.`,
    date: '11. September 2026',
    responsible: 'Verantwortlich',
    whereTitle: 'Wo die Daten liegen',
    where:
      'Die Seite läuft auf einem Server der FSIT AG in deren Rechenzentren in der Schweiz. Webserver, Anwendung, Datenbank und Dateispeicher laufen alle auf diesem einen Server. Es werden keine Daten ins Ausland übermittelt, und kein weiterer Dienst ist eingebunden.',
    visitTitle: 'Beim Aufruf der Seite',
    visitAddress:
      'Ihr Browser übermittelt Ihre IP-Adresse, ohne sie kommt keine Verbindung zustande. Gespeichert wird sie nicht: Weder der Webserver noch die Anwendung schreibt sie in ein Protokoll. Um Anmeldeversuche und Demo-Starts zu begrenzen, hält die Anwendung sie im Arbeitsspeicher, solange ein Zeitfenster von 15 Minuten läuft, und verwirft sie spätestens eine Minute danach.',
    visitLog:
      'Protokolliert werden je Anfrage nur Zeitpunkt, Methode, Pfad, Status und Dauer, ohne IP-Adresse, ohne Browserkennung und ohne Suchbegriffe. Die Protokolle haben eine feste Höchstgrösse, ältere Einträge werden überschrieben.',
    cookieTitle: 'Cookie und lokaler Speicher',
    cookieBefore: 'Es gibt ein einziges Cookie,',
    cookieAfter:
      '. Es entsteht erst, wenn Sie sich anmelden oder die Demo starten, und enthält nur eine zufällige Kennung Ihrer Sitzung. Es ist technisch notwendig und wird nach zwei Stunden ohne Aktivität ungültig, spätestens nach zwölf Stunden.',
    localStorage:
      'Ihre Wahl von Sprache und Erscheinungsbild speichert der Browser lokal. Sie verlässt Ihr Gerät nicht.',
    demoTitle: 'Die Demo',
    demo: (minutes: number) =>
      `Beim Start entsteht ein eigener Arbeitsbereich mit erfundenen Firmen, Personen und Zahlen. Nach ${minutes} Minuten wird er gelöscht, samt allem, was Sie darin eingegeben haben, Ihrer Sitzung und den Dateien. Eigene Dateien nimmt die Demo nicht an. Bitte geben Sie in der Demo keine echten Personendaten ein.`,
    accountsTitle: 'Konten',
    accounts:
      'Ausserhalb der Demo entstehen Konten nur auf Einladung. Gespeichert werden Name, E-Mail-Adresse, das Passwort als nicht umkehrbarer Hash und die Zugehörigkeit zu Arbeitsbereichen, dazu die Inhalte und Dokumente, die dort angelegt werden. Zweck ist allein der Betrieb der Anwendung. Die Daten bleiben, bis das Konto gelöscht wird, und das geschieht auf Anfrage.',
    notTitle: 'Was es nicht gibt',
    not: 'Keine Analyse- oder Statistikdienste, keine Werbung, keine eingebetteten Inhalte Dritter, keine Schriften von fremden Servern und keine Weitergabe an Dritte.',
    backupTitle: 'Datensicherung',
    backup:
      'Der Anbieter sichert den Server wöchentlich, nach seinen Angaben ebenfalls in der Schweiz. Eine Sicherung enthält den Stand zum Zeitpunkt der Sicherung, also auch die Daten einer gerade laufenden Demo.',
    rightsTitle: 'Ihre Rechte',
    rights:
      'Sie können Auskunft über Ihre Daten verlangen, ihre Berichtigung oder Löschung, und der Bearbeitung widersprechen.',
    contactByEmail: 'Eine E-Mail an',
    contactByEmailEnd: 'genügt.',
    contactByImprint: 'Eine Nachricht an die Adresse im',
    contactByImprintLink: 'Impressum',
    contactByImprintEnd: 'genügt.',
    complaint:
      'Beschwerden können Sie an den Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) richten.',
  },
  en: {
    title: 'Privacy policy',
    intro: (date: string) =>
      `Last updated: ${date}. This policy says which personal data arise when you visit and use the site, what for and for how long. It is short because little arises.`,
    date: '11 September 2026',
    responsible: 'Responsible',
    whereTitle: 'Where the data are kept',
    where:
      'The site runs on a server operated by FSIT AG in its data centres in Switzerland. Web server, application, database and file storage all run on this one server. No data are transferred abroad, and no other service is involved.',
    visitTitle: 'When you open the site',
    visitAddress:
      'Your browser transmits your IP address; without it no connection is possible. It is not stored: neither the web server nor the application writes it to a log. To limit sign-in attempts and demo starts, the application keeps it in memory while a 15-minute window is running and discards it at most one minute afterwards.',
    visitLog:
      'For each request, only the time, method, path, status and duration are logged — no IP address, no browser identification and no search terms. The logs have a fixed maximum size; older entries are overwritten.',
    cookieTitle: 'Cookie and local storage',
    cookieBefore: 'There is a single cookie,',
    cookieAfter:
      '. It is only created when you sign in or start the demo, and it contains nothing but a random identifier of your session. It is technically necessary and expires after two hours without activity, after twelve hours at the latest.',
    localStorage:
      'Your browser stores your choice of language and appearance locally. It never leaves your device.',
    demoTitle: 'The demo',
    demo: (minutes: number) =>
      `Starting the demo creates a workspace of your own with fictional companies, people and figures. After ${minutes} minutes it is deleted, together with everything you entered, your session and the files. The demo does not accept your own files. Please do not enter real personal data in the demo.`,
    accountsTitle: 'Accounts',
    accounts:
      'Outside the demo, accounts are created by invitation only. We store the name, email address, the password as an irreversible hash and the membership of workspaces, together with the content and documents created there. The sole purpose is running the application. The data remain until the account is deleted, which happens on request.',
    notTitle: 'What there is not',
    not: 'No analytics or statistics services, no advertising, no embedded third-party content, no fonts from other servers and no disclosure to third parties.',
    backupTitle: 'Backups',
    backup:
      'The hosting provider backs up the server weekly, according to the provider also in Switzerland. A backup contains the state at the time of the backup, including the data of a demo running at that moment.',
    rightsTitle: 'Your rights',
    rights:
      'You can ask for information about your data, for its correction or deletion, and object to its processing.',
    contactByEmail: 'An email to',
    contactByEmailEnd: 'is enough.',
    contactByImprint: 'A message to the address in the',
    contactByImprintLink: 'legal notice',
    contactByImprintEnd: 'is enough.',
    complaint:
      'Complaints can be addressed to the Federal Data Protection and Information Commissioner (FDPIC).',
  },
});
