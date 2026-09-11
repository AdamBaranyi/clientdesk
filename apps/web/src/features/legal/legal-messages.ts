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
