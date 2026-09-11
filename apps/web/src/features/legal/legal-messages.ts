import { defineMessages } from '../../i18n/messages.ts';

/** Was Impressum und Datenschutz teilen: Links, Fusszeile, Rahmen. */
export const legalMessages = defineMessages({
  de: {
    navigation: 'Rechtliches',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    toHome: 'Tallyroom, zur Startseite',
    footer: (name: string) => `© 2026 ${name}. Portfolio-Projekt, keine echten Kundendaten.`,
    country: 'Schweiz',
    /** Steht nur in Übersetzungen, nicht im Original. */
    bindingVersion: '',
  },
  fr: {
    navigation: 'Informations légales',
    imprint: 'Mentions légales',
    privacy: 'Protection des données',
    toHome: "Tallyroom, vers la page d'accueil",
    footer: (name: string) => `© 2026 ${name}. Projet de portfolio, aucune donnée client réelle.`,
    country: 'Suisse',
    bindingVersion: 'Ceci est une traduction. La version allemande fait foi.',
  },
  it: {
    navigation: 'Informazioni legali',
    imprint: 'Note legali',
    privacy: 'Protezione dei dati',
    toHome: 'Tallyroom, alla pagina iniziale',
    footer: (name: string) =>
      `© 2026 ${name}. Progetto di portfolio, nessun dato reale di clienti.`,
    country: 'Svizzera',
    bindingVersion: 'Questa è una traduzione. Fa fede la versione tedesca.',
  },
  en: {
    navigation: 'Legal',
    imprint: 'Legal notice',
    privacy: 'Privacy',
    toHome: 'Tallyroom, to the home page',
    footer: (name: string) => `© 2026 ${name}. Portfolio project, no real customer data.`,
    country: 'Switzerland',
    bindingVersion: 'This is a translation. The German version is binding.',
  },
});
