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
  fr: {
    title: 'Mentions légales',
    responsible: 'Responsable',
    aboutTitle: "De quoi s'agit-il",
    about:
      "Tallyroom est un projet de portfolio et non une offre commerciale. La démo montre le fonctionnement de l'application. Toutes les entreprises, personnes et chiffres qu'elle contient sont fictifs.",
    copyrightTitle: "Droit d'auteur",
    copyright: (name: string) =>
      `Conception et code source © 2026 ${name}, tous droits réservés. Le code source est public en consultation\u00a0:`,
    font: 'Police\u00a0: IBM Plex, sous licence SIL Open Font License 1.1.',
  },
  it: {
    title: 'Note legali',
    responsible: 'Responsabile',
    aboutTitle: 'Di che cosa si tratta',
    about:
      "Tallyroom è un progetto di portfolio e non un'offerta commerciale. La demo mostra come funziona l'applicazione. Tutte le aziende, le persone e le cifre che contiene sono fittizie.",
    copyrightTitle: "Diritto d'autore",
    copyright: (name: string) =>
      `Design e codice sorgente © 2026 ${name}, tutti i diritti riservati. Il codice sorgente è pubblico in consultazione:`,
    font: 'Carattere: IBM Plex, con licenza SIL Open Font License 1.1.',
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
