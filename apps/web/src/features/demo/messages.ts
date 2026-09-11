import { defineMessages } from '../../i18n/messages.ts';

export const demoMessages = defineMessages({
  de: {
    label: 'Demo',
    notice:
      'Alle Firmen, Personen und Zahlen sind erfunden. Diese Daten gehören nur Ihnen und werden danach gelöscht.',
    minutesLeft: (minutes: number) => `noch ${minutes} Min.`,
    view: 'Ansicht:',
    client: (name: string) => `Kunde: ${name}`,
  },
  en: {
    label: 'Demo',
    notice:
      'All companies, people and figures are fictional. This data belongs to you alone and is deleted afterwards.',
    minutesLeft: (minutes: number) => `${minutes} min left`,
    view: 'View:',
    client: (name: string) => `Customer: ${name}`,
  },
});
