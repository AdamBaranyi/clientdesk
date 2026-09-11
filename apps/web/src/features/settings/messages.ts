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
  fr: {
    heading: 'Paramètres',
    workspaceFacts: (name: string, timezone: string, currency: string) =>
      `${name} · Fuseau horaire ${timezone} · Devise ${currency}`,
    invite: {
      title: 'Inviter',
      validity: 'Le lien est valable sept jours, pour une seule utilisation',
      email: 'E-mail',
      role: 'Rôle',
      customer: 'Client attribué',
      chooseCustomer: 'Veuillez choisir',
      clientHint: 'Un accès client voit exclusivement les contenus partagés de ce seul client.',
      creating: 'Création …',
      submit: "Créer l'invitation",
      createFailed: "L'invitation n'a pas pu être créée.",
    },
    roleDescription: {
      owner: "gère l'espace de travail et les membres",
      member: 'travaille sur les clients, les projets et les demandes',
      client: "voit uniquement les contenus partagés d'un client",
    },
    created: {
      linkFor: (email: string) => `Lien pour ${email}`,
      shownOnce:
        "Ce lien n'est affiché que maintenant. Seul son hash est enregistré — il ne peut pas être récupéré plus tard.",
      copy: 'Copier',
      copied: 'Copié',
    },
    list: {
      title: 'Invitations en cours',
      loading: 'Chargement des invitations …',
      loadFailed: "Les invitations n'ont pas pu être chargées.",
      emptyTitle: 'Aucune invitation',
      emptyDetail:
        "Les invitations créées apparaissent ici jusqu'à ce qu'elles soient acceptées ou expirent.",
      unknownCustomer: 'inconnu',
      acceptedOn: (date: string) => `acceptée le ${date}`,
      validUntil: (date: string) => `valable jusqu'au ${date}`,
      revoke: (email: string) => `Révoquer l'invitation pour ${email}`,
    },
  },
  it: {
    heading: 'Impostazioni',
    workspaceFacts: (name: string, timezone: string, currency: string) =>
      `${name} · Fuso orario ${timezone} · Valuta ${currency}`,
    invite: {
      title: 'Invitare',
      validity: 'Il link è valido sette giorni, per un solo utilizzo',
      email: 'E-mail',
      role: 'Ruolo',
      customer: 'Cliente assegnato',
      chooseCustomer: 'Selezionare',
      clientHint:
        'Un accesso cliente vede esclusivamente i contenuti condivisi di questo unico cliente.',
      creating: 'Creazione …',
      submit: 'Crea invito',
      createFailed: "Non è stato possibile creare l'invito.",
    },
    roleDescription: {
      owner: "gestisce l'area di lavoro e i membri",
      member: 'lavora su clienti, progetti e richieste',
      client: 'vede solo i contenuti condivisi di un cliente',
    },
    created: {
      linkFor: (email: string) => `Link per ${email}`,
      shownOnce:
        'Questo link viene mostrato solo ora. Viene salvato solo il suo hash — in seguito non sarà più possibile recuperarlo.',
      copy: 'Copia',
      copied: 'Copiato',
    },
    list: {
      title: 'Inviti aperti',
      loading: 'Caricamento degli inviti …',
      loadFailed: 'Non è stato possibile caricare gli inviti.',
      emptyTitle: 'Nessun invito',
      emptyDetail: 'Gli inviti creati compaiono qui finché non vengono accettati o scadono.',
      unknownCustomer: 'sconosciuto',
      acceptedOn: (date: string) => `accettato il ${date}`,
      validUntil: (date: string) => `valido fino al ${date}`,
      revoke: (email: string) => `Revoca l'invito per ${email}`,
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
