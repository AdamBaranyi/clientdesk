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
  fr: {
    label: 'Démo',
    notice:
      "Toutes les entreprises, personnes et chiffres sont fictifs. Ces données n'appartiennent qu'à vous et seront ensuite supprimées.",
    minutesLeft: (minutes: number) => `il reste ${minutes} min`,
    view: 'Vue\u00a0:',
    client: (name: string) => `Client\u00a0: ${name}`,
  },
  it: {
    label: 'Demo',
    notice:
      'Tutte le aziende, le persone e i numeri sono fittizi. Questi dati appartengono solo a Lei e saranno poi eliminati.',
    minutesLeft: (minutes: number) => `ancora ${minutes} min`,
    view: 'Vista:',
    client: (name: string) => `Cliente: ${name}`,
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
