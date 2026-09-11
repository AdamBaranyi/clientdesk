import { defineMessages } from '../../i18n/messages.ts';

export const settingsMessages = defineMessages({
  de: {
    heading: 'Einstellungen',
    workspaceFacts: (name: string, timezone: string, currency: string) =>
      `${name} · Zeitzone ${timezone} · Währung ${currency}`,
    invite: {
      title: 'Einladen',
      validity: 'Der Link gilt sieben Tage und genau einmal',
      email: 'E-Mail',
      role: 'Rolle',
      customer: 'Zugeordneter Kunde',
      chooseCustomer: 'Bitte wählen',
      clientHint:
        'Ein Kundenzugang sieht ausschliesslich freigegebene Inhalte dieses einen Kunden.',
      creating: 'Wird erstellt …',
      submit: 'Einladung erstellen',
      createFailed: 'Die Einladung konnte nicht erstellt werden.',
    },
    /** Hinter dem Rollennamen aus domainMessages, getrennt durch einen Gedankenstrich. */
    roleDescription: {
      owner: 'verwaltet Workspace und Mitgliedschaften',
      member: 'arbeitet an Kunden, Projekten und Anfragen',
      client: 'sieht nur freigegebene Inhalte eines Kunden',
    },
    created: {
      linkFor: (email: string) => `Link für ${email}`,
      shownOnce:
        'Dieser Link wird nur jetzt angezeigt. Gespeichert ist nur sein Hash — er lässt sich später nicht erneut aufrufen.',
      copy: 'Kopieren',
      copied: 'Kopiert',
    },
    list: {
      title: 'Offene Einladungen',
      loading: 'Einladungen werden geladen …',
      loadFailed: 'Die Einladungen konnten nicht geladen werden.',
      emptyTitle: 'Keine Einladungen',
      emptyDetail:
        'Erstellte Einladungen erscheinen hier, bis sie angenommen werden oder ablaufen.',
      unknownCustomer: 'unbekannt',
      acceptedOn: (date: string) => `angenommen am ${date}`,
      validUntil: (date: string) => `gültig bis ${date}`,
      revoke: (email: string) => `Einladung für ${email} zurückziehen`,
    },
  },
  en: {
    heading: 'Settings',
    workspaceFacts: (name: string, timezone: string, currency: string) =>
      `${name} · Time zone ${timezone} · Currency ${currency}`,
    invite: {
      title: 'Invite',
      validity: 'The link is valid for seven days and works only once',
      email: 'Email',
      role: 'Role',
      customer: 'Assigned customer',
      chooseCustomer: 'Please select',
      clientHint: 'A client login sees only the shared content of this one customer.',
      creating: 'Creating …',
      submit: 'Create invitation',
      createFailed: 'The invitation could not be created.',
    },
    roleDescription: {
      owner: 'manages the workspace and memberships',
      member: 'works on customers, projects and requests',
      client: 'sees only the shared content of one customer',
    },
    created: {
      linkFor: (email: string) => `Link for ${email}`,
      shownOnce:
        'This link is shown only now. Only its hash is stored — it cannot be retrieved again later.',
      copy: 'Copy',
      copied: 'Copied',
    },
    list: {
      title: 'Open invitations',
      loading: 'Loading invitations …',
      loadFailed: 'The invitations could not be loaded.',
      emptyTitle: 'No invitations',
      emptyDetail: 'Invitations you create appear here until they are accepted or expire.',
      unknownCustomer: 'unknown',
      acceptedOn: (date: string) => `accepted on ${date}`,
      validUntil: (date: string) => `valid until ${date}`,
      revoke: (email: string) => `Revoke invitation for ${email}`,
    },
  },
});
