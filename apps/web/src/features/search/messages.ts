import { defineMessages } from '../../i18n/messages.ts';

export const searchMessages = defineMessages({
  de: {
    dialogLabel: 'Springen zu',
    inputLabel: 'Kunde, Projekt, Vertrag oder Anfrage suchen',
    placeholder: 'Kunde, Projekt, Vertrag oder Anfrage',
    resultsLabel: 'Treffer',
    tooShort: (minLength: number) => `Mindestens ${minLength} Zeichen eingeben.`,
    searching: 'Wird gesucht …',
    noResults: (term: string) => `Kein Treffer für „${term}".`,
    keys: { select: 'wählen', jump: 'springen', close: 'schliessen' },
    kind: { customer: 'Kunde', project: 'Projekt', contract: 'Vertrag', request: 'Anfrage' },
  },
  en: {
    dialogLabel: 'Jump to',
    inputLabel: 'Search for a customer, project, contract or request',
    placeholder: 'Customer, project, contract or request',
    resultsLabel: 'Results',
    tooShort: (minLength: number) =>
      `Enter at least ${minLength} ${minLength === 1 ? 'character' : 'characters'}.`,
    searching: 'Searching …',
    noResults: (term: string) => `No results for ‘${term}’.`,
    keys: { select: 'select', jump: 'jump', close: 'close' },
    kind: { customer: 'Customer', project: 'Project', contract: 'Contract', request: 'Request' },
  },
});
