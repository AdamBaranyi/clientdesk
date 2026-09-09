/**
 * Anfragen und Kommentare für den Vorführ-Seed. Reine Daten.
 *
 * Enthält bewusst mindestens einen internen Kommentar: er ist das Gegenstück
 * zur öffentlichen Antwort und macht in der Vorführung sichtbar, dass die
 * Kundenansicht ihn nicht kennt.
 */
export interface SeedComment {
  /** true = vom Team, false = vom Kundenzugang. */
  fromTeam: boolean;
  visibility: 'public' | 'internal';
  body: string;
}

export interface SeedRequest {
  customerName: string;
  subject: string;
  body: string;
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved';
  priority: 'normal' | 'high';
  assigned: boolean;
  comments: SeedComment[];
}

export const SEED_REQUESTS: SeedRequest[] = [
  {
    customerName: 'Alpenblick Studio',
    subject: 'SSL-Zertifikat erneuern',
    body: 'Das Zertifikat läuft Ende Monat ab. Bitte rechtzeitig erneuern.',
    status: 'in_progress',
    priority: 'high',
    assigned: true,
    comments: [
      {
        fromTeam: true,
        visibility: 'internal',
        body: 'Automatische Erneuerung war fehlgeschlagen, Ursache war ein alter DNS-Eintrag. Kunde muss das nicht wissen.',
      },
      {
        fromTeam: true,
        visibility: 'public',
        body: 'Wir kümmern uns darum, das Zertifikat ist bis Ende Woche erneuert.',
      },
    ],
  },
  {
    customerName: 'Seeblick Digital',
    subject: 'Neue Nutzerkonten anlegen',
    body: 'Wir haben drei neue Mitarbeitende. Bitte Zugänge einrichten.',
    status: 'waiting_customer',
    priority: 'normal',
    assigned: true,
    comments: [
      {
        fromTeam: true,
        visibility: 'public',
        body: 'Gerne. Bitte senden Sie uns die vollständigen Namen und E-Mail-Adressen.',
      },
    ],
  },
  {
    customerName: 'Nordlicht Architektur',
    subject: 'Backup-Zeitplan anpassen',
    body: 'Die Sicherung soll künftig nachts um 02:00 laufen statt um 22:00.',
    status: 'open',
    priority: 'normal',
    assigned: false,
    comments: [],
  },
  {
    customerName: 'Talgarten Treuhand',
    subject: 'Domain auf uns übertragen',
    body: 'Wir möchten die Domain künftig selbst verwalten.',
    status: 'resolved',
    priority: 'normal',
    assigned: true,
    comments: [
      {
        fromTeam: true,
        visibility: 'public',
        body: 'Die Übertragung ist abgeschlossen. Der Auth-Code wurde separat zugestellt.',
      },
    ],
  },
  {
    customerName: 'Seeblick Digital',
    subject: 'Zahlungsanbindung testen',
    body: 'Können wir vor dem Start Testbestellungen durchführen?',
    status: 'open',
    priority: 'normal',
    assigned: false,
    comments: [
      { fromTeam: false, visibility: 'public', body: 'Gerne auch mit mehreren Zahlungsarten.' },
    ],
  },
  {
    customerName: 'Rebberg Weinhandel',
    subject: 'Katalog-Bilder austauschen',
    body: 'Die Bilder der Jahrgänge 2024 sind veraltet.',
    status: 'resolved',
    priority: 'normal',
    assigned: true,
    comments: [],
  },
  {
    customerName: 'Bergbahn Hochmatt',
    subject: 'Webcam liefert kein Bild',
    body: 'Seit gestern Abend ist die Bergstation schwarz.',
    status: 'in_progress',
    priority: 'high',
    assigned: true,
    comments: [
      {
        fromTeam: true,
        visibility: 'internal',
        body: 'Stromausfall an der Bergstation. Vor Ort meldet sich niemand.',
      },
    ],
  },
  {
    customerName: 'Alpenblick Studio',
    subject: 'Formular sendet keine Bestätigung',
    body: 'Nach dem Absenden bekommt niemand eine E-Mail.',
    status: 'resolved',
    priority: 'high',
    assigned: true,
    comments: [
      {
        fromTeam: true,
        visibility: 'public',
        body: 'Der Versand läuft wieder. Ursache war ein abgelaufener Zugang beim Mailanbieter.',
      },
    ],
  },
  {
    customerName: 'Alpenblick Studio',
    subject: 'Schriftart auf der Startseite',
    body: 'Kann die Überschrift etwas grösser sein?',
    status: 'resolved',
    priority: 'normal',
    assigned: true,
    comments: [],
  },
  {
    customerName: 'Nordlicht Architektur',
    subject: 'Zusätzlicher Zugang für Praktikantin',
    body: 'Ab nächstem Monat für sechs Monate.',
    status: 'open',
    priority: 'normal',
    assigned: false,
    comments: [],
  },
  {
    customerName: 'Nordlicht Architektur',
    subject: 'Export der Fristenliste',
    body: 'Wir bräuchten die Liste einmal als Tabelle.',
    status: 'waiting_customer',
    priority: 'normal',
    assigned: true,
    comments: [
      { fromTeam: true, visibility: 'public', body: 'Welche Spalten brauchen Sie genau?' },
    ],
  },
  {
    customerName: 'Seeblick Digital',
    subject: 'Versandkosten anpassen',
    body: 'Ab CHF 100 soll der Versand kostenlos sein.',
    status: 'in_progress',
    priority: 'normal',
    assigned: true,
    comments: [],
  },
  {
    customerName: 'Talgarten Treuhand',
    subject: 'Passwortregeln verschärfen',
    body: 'Unsere Revision verlangt mindestens zwölf Zeichen.',
    status: 'open',
    priority: 'normal',
    assigned: false,
    comments: [],
  },
  {
    customerName: 'Talgarten Treuhand',
    subject: 'Schulungstermin verschieben',
    body: 'Der geplante Termin passt uns leider nicht.',
    status: 'resolved',
    priority: 'normal',
    assigned: true,
    comments: [],
  },
  {
    customerName: 'Rebberg Weinhandel',
    subject: 'Filter nach Rebsorte',
    body: 'Im Katalog fehlt der Filter nach Rebsorte.',
    status: 'open',
    priority: 'normal',
    assigned: false,
    comments: [],
  },
  {
    customerName: 'Bergbahn Hochmatt',
    subject: 'Öffnungszeiten aktualisieren',
    body: 'Die Wintersaison beginnt zwei Wochen früher.',
    status: 'resolved',
    priority: 'normal',
    assigned: true,
    comments: [],
  },
  {
    customerName: 'Holzwerk Sattel',
    subject: 'Referenzbilder liefern',
    body: 'Wir haben neue Fotos der Ausstellung.',
    status: 'open',
    priority: 'normal',
    assigned: false,
    comments: [],
  },
  {
    customerName: 'Holzwerk Sattel',
    subject: 'Aufwandschätzung Konfigurator',
    body: 'Wir bräuchten eine grobe Schätzung für das Budget.',
    status: 'waiting_customer',
    priority: 'normal',
    assigned: true,
    comments: [],
  },
];

/** Dokumente für den Vorführ-Seed, inklusive eines nicht freigegebenen. */
export interface SeedDocument {
  customerName: string;
  fileName: string;
  clientVisible: boolean;
  title: string;
}

export const SEED_DOCUMENTS: SeedDocument[] = [
  {
    customerName: 'Alpenblick Studio',
    fileName: 'Wartungsbericht-August.pdf',
    clientVisible: true,
    title: 'Wartungsbericht August',
  },
  {
    customerName: 'Alpenblick Studio',
    fileName: 'Interne-Aufwandsuebersicht.pdf',
    clientVisible: false,
    title: 'Interne Aufwandsuebersicht — nicht freigegeben',
  },
  {
    customerName: 'Nordlicht Architektur',
    fileName: 'Konzept-Projektplattform.pdf',
    clientVisible: true,
    title: 'Konzept Projektplattform',
  },
  {
    customerName: 'Seeblick Digital',
    fileName: 'Shop-Abnahmeprotokoll.pdf',
    clientVisible: true,
    title: 'Abnahmeprotokoll Onlineshop',
  },
  {
    customerName: 'Seeblick Digital',
    fileName: 'Preisverhandlung-Notizen.pdf',
    clientVisible: false,
    title: 'Notizen zur Preisverhandlung — nicht freigegeben',
  },
  {
    customerName: 'Talgarten Treuhand',
    fileName: 'Zugriffskonzept.pdf',
    clientVisible: true,
    title: 'Zugriffskonzept Intranet',
  },
];
