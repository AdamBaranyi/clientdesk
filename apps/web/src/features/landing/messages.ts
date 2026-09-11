import { defineMessages } from '../../i18n/messages.ts';

export const landingMessages = defineMessages({
  de: {
    documentTitle: 'Tallyroom · Kundenübersicht und Kundenportal für kleine Agenturen',
    signIn: 'Anmelden',
    headline: 'Kundenübersicht und Kundenportal für kleine Agenturen',
    lead: 'Projektstände, monatliche Servicevereinbarungen, Unterlagen und Kundenanfragen an einem Ort — und ein getrenntes Portal, in dem der Kunde genau das sieht, was freigegeben ist.',
    startDemo: 'Demo starten',
    preparingDemo: 'Demo wird vorbereitet …',
    demoFailed: 'Die Demo konnte nicht gestartet werden. Bitte später erneut versuchen.',
    facts: {
      runtime: { label: 'Laufzeit', value: (minutes: number) => `${minutes} Minuten` },
      data: { label: 'Datenbestand', value: 'eigener je Besucher' },
      after: { label: 'Danach', value: 'gelöscht, samt Dateien' },
      fictional: { label: 'Firmen und Zahlen', value: 'erfunden' },
    },
    features: {
      clients: {
        title: 'Kunden, Projekte, Meilensteine',
        detail:
          'Wer wird betreut, was läuft, was ist überfällig. Fortschritt entsteht aus erledigten Meilensteinen und nicht aus einer Schätzung.',
      },
      contracts: {
        title: 'Verträge mit Preisversionen',
        detail:
          'Eine Preisänderung gilt ab ihrem Datum und lässt vergangene Monatswerte unberührt. Der monatliche Vertragswert ist zu jedem Stichtag nachvollziehbar.',
      },
      portal: {
        title: 'Getrenntes Kundenportal',
        detail:
          'Der Kunde sieht freigegebene Projekte, Unterlagen und den öffentlichen Teil des Verlaufs. Interne Notizen und Kommentare erreichen ihn nicht.',
      },
    },
  },
  en: {
    documentTitle: 'Tallyroom · Client overview and client portal for small agencies',
    signIn: 'Sign in',
    headline: 'Client overview and client portal for small agencies',
    lead: 'Project status, monthly service agreements, documents and client requests in one place — and a separate portal where each client sees exactly what has been shared with them.',
    startDemo: 'Start demo',
    preparingDemo: 'Preparing demo …',
    demoFailed: 'The demo could not be started. Please try again later.',
    facts: {
      runtime: { label: 'Runs for', value: (minutes: number) => `${minutes} minutes` },
      data: { label: 'Data', value: 'your own copy' },
      after: { label: 'Afterwards', value: 'deleted, files included' },
      fictional: { label: 'Companies and figures', value: 'fictional' },
    },
    features: {
      clients: {
        title: 'Customers, projects, milestones',
        detail:
          'Who is looked after, what is running, what is overdue. Progress comes from completed milestones, not from an estimate.',
      },
      contracts: {
        title: 'Contracts with price versions',
        detail:
          'A price change applies from its date and leaves past monthly values untouched. The monthly contract value can be traced for any reference date.',
      },
      portal: {
        title: 'A separate client portal',
        detail:
          'The client sees shared projects, documents and the public part of the history. Internal notes and comments never reach them.',
      },
    },
  },
});
