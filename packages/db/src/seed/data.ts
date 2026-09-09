/**
 * Reine Daten für den Vorführ-Seed. Ausschliesslich erfundene Schweizer
 * Firmennamen — keine echten Kunden, keine Daten eines Arbeitgebers.
 *
 * Termine stehen als Abstand in Tagen zum Bezugsdatum, damit der Seed auch in
 * einem halben Jahr noch sinnvolle Fristen erzeugt.
 */

export interface SeedMilestone {
  title: string;
  /** Tage relativ zum Bezugsdatum. Negativ heisst überfällig. */
  dueInDays: number | null;
  done: boolean;
}

export interface SeedProject {
  name: string;
  description: string;
  internalNote: string | null;
  status: 'planned' | 'active' | 'paused' | 'completed';
  startsInDays: number;
  targetInDays: number | null;
  clientVisible: boolean;
  milestones: SeedMilestone[];
}

export interface SeedCustomer {
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  internalNote: string | null;
  archived?: boolean;
  projects: SeedProject[];
}

export const SEED_CUSTOMERS: SeedCustomer[] = [
  {
    name: 'Alpenblick Studio',
    contactName: 'Rahel Steiner',
    email: 'rahel.steiner@alpenblick.example',
    phone: '+41 41 511 22 33',
    website: 'https://alpenblick.example',
    internalNote: 'Antwortet meist erst am Folgetag. Rechnungen bitte auf die Buchhaltung.',
    projects: [
      {
        name: 'Website-Relaunch',
        description: 'Neuer Auftritt mit eigenem Redaktionsbereich.',
        internalNote: 'Bildmaterial fehlt noch, mehrfach angemahnt.',
        status: 'active',
        startsInDays: -84,
        targetInDays: 40,
        clientVisible: true,
        milestones: [
          { title: 'Konzept abgenommen', dueInDays: -60, done: true },
          { title: 'Entwurf abgenommen', dueInDays: -30, done: true },
          // Der überfällige Meilenstein für die Vorführung.
          { title: 'Design-Freigabe', dueInDays: -3, done: false },
          { title: 'Inhalte eingepflegt', dueInDays: 21, done: false },
          { title: 'Aufschaltung', dueInDays: 38, done: false },
        ],
      },
      {
        name: 'Wartung 2026',
        description: 'Laufende Pflege von Auftritt und Redaktionssystem.',
        internalNote: null,
        status: 'active',
        startsInDays: -240,
        targetInDays: null,
        clientVisible: true,
        milestones: [],
      },
    ],
  },
  {
    name: 'Nordlicht Architektur',
    contactName: 'Tobias Marti',
    email: 'tobias.marti@nordlicht.example',
    phone: '+41 31 744 18 90',
    website: 'https://nordlicht.example',
    internalNote: 'Entscheidungen laufen immer über die Geschäftsleitung.',
    projects: [
      {
        name: 'Projektplattform',
        description: 'Interne Ablage für Baupläne und Fristen.',
        internalNote: 'Zugriffsrechte sind fachlich noch nicht geklärt.',
        status: 'active',
        startsInDays: -120,
        targetInDays: 70,
        clientVisible: true,
        milestones: [
          { title: 'Anforderungen aufgenommen', dueInDays: -95, done: true },
          { title: 'Datenmodell steht', dueInDays: -40, done: true },
          { title: 'Testphase starten', dueInDays: 2, done: false },
          { title: 'Schulung Team', dueInDays: 45, done: false },
        ],
      },
    ],
  },
  {
    name: 'Seeblick Digital',
    contactName: 'Marina Hug',
    email: 'marina.hug@seeblick.example',
    phone: '+41 44 202 77 41',
    website: 'https://seeblick.example',
    internalNote: null,
    projects: [
      {
        name: 'Onlineshop',
        description: 'Verkaufsplattform mit Anbindung an die Warenwirtschaft.',
        internalNote: 'Zahlungsanbieter ist noch nicht ausgewählt.',
        status: 'active',
        startsInDays: -60,
        targetInDays: 90,
        clientVisible: true,
        milestones: [
          { title: 'Sortiment übernommen', dueInDays: -30, done: true },
          { title: 'Zahlungsanbindung', dueInDays: 6, done: false },
          { title: 'Testbestellungen', dueInDays: 55, done: false },
        ],
      },
      {
        name: 'Newsletter-Anbindung',
        description: 'Automatischer Versand nach Bestellabschluss.',
        internalNote: null,
        status: 'paused',
        startsInDays: -45,
        targetInDays: null,
        clientVisible: false,
        milestones: [{ title: 'Anbieter evaluieren', dueInDays: null, done: false }],
      },
    ],
  },
  {
    name: 'Talgarten Treuhand',
    contactName: 'Peter Ammann',
    email: 'p.ammann@talgarten.example',
    phone: '+41 41 630 55 12',
    website: null,
    internalNote: 'Sehr auf Datenschutz bedacht, alles schriftlich festhalten.',
    projects: [
      {
        name: 'Mandantenportal',
        description: 'Ablage für Jahresabschlüsse, je Mandant getrennt.',
        internalNote: 'Zugriffskonzept muss vor dem Start schriftlich vorliegen.',
        status: 'planned',
        startsInDays: 14,
        targetInDays: 180,
        clientVisible: false,
        milestones: [{ title: 'Zugriffskonzept abnehmen', dueInDays: 28, done: false }],
      },
      {
        name: 'Intranet',
        description: 'Interne Wissensablage für 14 Mitarbeitende.',
        internalNote: null,
        status: 'active',
        startsInDays: -150,
        targetInDays: 25,
        clientVisible: true,
        milestones: [
          { title: 'Struktur festgelegt', dueInDays: -110, done: true },
          { title: 'Inhalte übergeben', dueInDays: 11, done: false },
        ],
      },
    ],
  },
  {
    name: 'Rebberg Weinhandel',
    contactName: 'Céline Brunner',
    email: 'celine@rebberg.example',
    phone: '+41 27 480 31 08',
    website: 'https://rebberg.example',
    internalNote: null,
    projects: [
      {
        name: 'Katalog 2026',
        description: 'Digitaler Weinkatalog mit Filterfunktion.',
        internalNote: null,
        status: 'completed',
        startsInDays: -300,
        targetInDays: -60,
        clientVisible: true,
        milestones: [
          { title: 'Daten aufbereitet', dueInDays: -200, done: true },
          { title: 'Katalog aufgeschaltet', dueInDays: -65, done: true },
        ],
      },
    ],
  },
  {
    name: 'Bergbahn Hochmatt',
    contactName: 'Andrea Zumbrunn',
    email: 'a.zumbrunn@hochmatt.example',
    phone: '+41 33 855 90 04',
    website: 'https://hochmatt.example',
    internalNote: 'Saisonbetrieb — von Mai bis Oktober kaum erreichbar.',
    projects: [
      {
        name: 'Ticketsystem',
        description: 'Onlineverkauf von Tageskarten.',
        internalNote: 'Wartet auf Entscheid des Verwaltungsrats.',
        status: 'planned',
        startsInDays: 20,
        targetInDays: 160,
        clientVisible: false,
        milestones: [{ title: 'Anforderungen klären', dueInDays: 30, done: false }],
      },
      {
        name: 'Webcam-Einbindung',
        description: 'Livebilder der Bergstation auf der Startseite.',
        internalNote: null,
        status: 'completed',
        startsInDays: -420,
        targetInDays: -380,
        clientVisible: true,
        milestones: [{ title: 'Kameras angebunden', dueInDays: -385, done: true }],
      },
    ],
  },
  {
    name: 'Holzwerk Sattel',
    contactName: 'Marco Bühler',
    email: 'buehler@holzwerk-sattel.example',
    phone: null,
    website: null,
    internalNote: null,
    projects: [
      {
        name: 'Ersatzteilliste',
        description: 'Durchsuchbare Liste mit Bestellformular.',
        internalNote: null,
        status: 'active',
        startsInDays: -30,
        targetInDays: 60,
        clientVisible: true,
        milestones: [
          { title: 'Datenbestand geliefert', dueInDays: -10, done: true },
          { title: 'Suche umgesetzt', dueInDays: 25, done: false },
        ],
      },
      {
        name: 'Produktkonfigurator',
        description: 'Konfigurator für Massmöbel mit Preisvorschau.',
        internalNote: 'Preislogik ist fachlich anspruchsvoll, Aufwand grosszügig schätzen.',
        status: 'planned',
        startsInDays: 35,
        targetInDays: 200,
        clientVisible: false,
        milestones: [],
      },
    ],
  },
  {
    // Der leere Kunde: angelegt, aber noch ohne Projekt. Zeigt den Leerzustand.
    name: 'Uferpark Gastro',
    contactName: 'Silvia Renggli',
    email: null,
    phone: '+41 41 340 12 76',
    website: null,
    internalNote: 'Erstgespräch geführt, Angebot noch offen.',
    projects: [],
  },
];
