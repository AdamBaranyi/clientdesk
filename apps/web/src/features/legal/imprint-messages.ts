import { defineMessages } from '../../i18n/messages.ts';

export const imprintMessages = defineMessages({
  de: {
    title: 'Impressum',
    responsible: 'Verantwortlich',
    aboutTitle: 'Worum es sich handelt',
    about:
      'Tallyroom ist ein Portfolio-Projekt und kein kommerzielles Angebot. Die Demo zeigt, wie die Anwendung arbeitet. Alle Firmen, Personen und Zahlen darin sind erfunden.',
    copyrightTitle: 'Urheberrecht',
    copyright: (name: string) =>
      `Gestaltung und Quelltext © 2026 ${name}, alle Rechte vorbehalten. Der Quelltext ist zur Ansicht öffentlich:`,
    font: 'Schrift: IBM Plex, unter der SIL Open Font License 1.1.',
  },
  en: {
    title: 'Legal notice',
    responsible: 'Responsible',
    aboutTitle: 'What this is',
    about:
      'Tallyroom is a portfolio project, not a commercial offer. The demo shows how the application works. All companies, people and figures in it are fictional.',
    copyrightTitle: 'Copyright',
    copyright: (name: string) =>
      `Design and source code © 2026 ${name}, all rights reserved. The source code is public for viewing:`,
    font: 'Typeface: IBM Plex, under the SIL Open Font License 1.1.',
  },
});
