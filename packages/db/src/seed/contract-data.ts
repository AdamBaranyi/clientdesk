/**
 * Serviceverträge für den Vorführ-Seed. Reine Daten, Beträge in Rappen.
 *
 * Bewusst enthalten: ein noch nicht begonnener Vertrag, ein bereits beendeter,
 * einer mit Preisänderung, ein Entwurf und ein kostenloser — damit die
 * Kennzahlenregel an echten Daten sichtbar wird und nicht nur im Test.
 */
export interface SeedRate {
  /** Tage relativ zum Bezugsdatum. */
  effectiveInDays: number;
  amountMinor: number;
}

export interface SeedContract {
  customerName: string;
  name: string;
  startsInDays: number;
  endsInDays: number | null;
  confirmed: boolean;
  clientVisible: boolean;
  publicDescription: string | null;
  internalNote: string | null;
  amountMinor: number;
  /** Zusätzliche Preisversionen nach der ersten. */
  laterRates: SeedRate[];
}

export const SEED_CONTRACTS: SeedContract[] = [
  {
    customerName: 'Alpenblick Studio',
    name: 'Hosting und Wartung',
    startsInDays: -240,
    endsInDays: null,
    confirmed: true,
    clientVisible: true,
    publicDescription: 'Betrieb der Website, Sicherheitsaktualisierungen, monatliche Sicherung.',
    internalNote: null,
    amountMinor: 24_000,
    // Preiserhöhung vor drei Monaten: frühere Monatswerte bleiben unverändert.
    laterRates: [{ effectiveInDays: -92, amountMinor: 28_000 }],
  },
  {
    customerName: 'Alpenblick Studio',
    name: 'Redaktionsunterstützung',
    startsInDays: -120,
    endsInDays: null,
    confirmed: true,
    clientVisible: true,
    publicDescription: 'Vier Stunden redaktionelle Pflege pro Monat.',
    internalNote: 'Wird selten ausgeschöpft.',
    amountMinor: 45_000,
    laterRates: [],
  },
  {
    customerName: 'Nordlicht Architektur',
    name: 'Plattformbetrieb',
    startsInDays: -110,
    endsInDays: null,
    confirmed: true,
    clientVisible: true,
    publicDescription: 'Betrieb und Überwachung der Projektplattform.',
    internalNote: null,
    amountMinor: 89_000,
    laterRates: [],
  },
  {
    customerName: 'Seeblick Digital',
    name: 'Shop-Betrieb',
    startsInDays: -50,
    endsInDays: null,
    confirmed: true,
    clientVisible: true,
    publicDescription: 'Betrieb des Onlineshops inklusive Zahlungsanbindung.',
    internalNote: null,
    amountMinor: 65_000,
    laterRates: [],
  },
  {
    // Beginnt erst in der Zukunft: zählt heute noch nicht.
    customerName: 'Seeblick Digital',
    name: 'Erweiterte Betreuung ab nächstem Monat',
    startsInDays: 24,
    endsInDays: null,
    confirmed: true,
    clientVisible: false,
    publicDescription: 'Zusätzliche Bereitschaft ausserhalb der Bürozeiten.',
    internalNote: 'Angebot ist unterschrieben, Start bewusst später.',
    amountMinor: 35_000,
    laterRates: [],
  },
  {
    customerName: 'Talgarten Treuhand',
    name: 'Intranet-Wartung',
    startsInDays: -140,
    endsInDays: null,
    confirmed: true,
    clientVisible: true,
    publicDescription: 'Aktualisierungen und Support während der Bürozeiten.',
    internalNote: null,
    amountMinor: 52_000,
    laterRates: [],
  },
  {
    // Bereits ausgelaufen: zählt heute nicht mehr, in früheren Monaten schon.
    customerName: 'Rebberg Weinhandel',
    name: 'Katalogpflege 2025',
    startsInDays: -400,
    endsInDays: -70,
    confirmed: true,
    clientVisible: true,
    publicDescription: 'Monatliche Aktualisierung des Weinkatalogs.',
    internalNote: 'Nicht verlängert, Kunde pflegt selbst.',
    amountMinor: 30_000,
    laterRates: [],
  },
  {
    customerName: 'Bergbahn Hochmatt',
    name: 'Webcam-Betrieb',
    startsInDays: -380,
    endsInDays: null,
    confirmed: true,
    clientVisible: true,
    publicDescription: 'Betrieb der Livebilder, Austausch bei Ausfall.',
    internalNote: null,
    amountMinor: 18_000,
    laterRates: [],
  },
  {
    // Entwurf: erscheint in der Liste, zählt aber nicht in die Kennzahl.
    customerName: 'Bergbahn Hochmatt',
    name: 'Ticketsystem-Betrieb (Entwurf)',
    startsInDays: -10,
    endsInDays: null,
    confirmed: false,
    clientVisible: false,
    publicDescription: 'Betrieb des Ticketverkaufs.',
    internalNote: 'Wartet auf Entscheid des Verwaltungsrats.',
    amountMinor: 120_000,
    laterRates: [],
  },
  {
    // Kostenloser Vertrag: zulässig und zählt als Vertrag mit null.
    customerName: 'Holzwerk Sattel',
    name: 'Kulanzbetreuung',
    startsInDays: -60,
    endsInDays: null,
    confirmed: true,
    clientVisible: false,
    publicDescription: null,
    internalNote: 'Aus Kulanz nach der verspäteten Lieferung.',
    amountMinor: 0,
    laterRates: [],
  },
];
