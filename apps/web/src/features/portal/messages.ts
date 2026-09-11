import { defineMessages } from '../../i18n/messages.ts';

/** Texte des Kundenportals ohne die Anfragen — die stehen in request-messages.ts. */
export const portalMessages = defineMessages({
  de: {
    shell: {
      navLabel: 'Portalnavigation',
      skipToContent: 'Zum Inhalt springen',
      wordmark: 'Kundenportal',
      yourAccess: 'Ihr Zugang',
      openNavigation: 'Navigation öffnen',
      closeNavigation: 'Navigation schliessen',
      close: 'Schliessen',
      signOut: 'Abmelden',
    },
    nav: {
      overview: 'Übersicht',
      projects: 'Projekte',
      contracts: 'Verträge',
      requests: 'Anfragen',
      documents: 'Dokumente',
      account: 'Konto',
    },
    account: {
      title: 'Konto',
      lead: 'Ihr Zugang zu diesem Kundenportal.',
    },
    overview: {
      loading: 'Übersicht wird geladen …',
      loadFailed: 'Die Übersicht konnte nicht geladen werden. Bitte Seite neu laden.',
      managedBy: (workspaceName: string) => `Betreut von ${workspaceName}`,
      yourProjects: 'Ihre Projekte',
      noProjects: 'Derzeit ist kein Projekt für Sie freigegeben.',
      yourOpenRequests: 'Ihre offenen Anfragen',
      noOpenRequests: 'Keine offene Anfrage.',
    },
    projects: {
      heading: 'Projekte',
      loading: 'Projekte werden geladen …',
      loadFailed: 'Die Projekte konnten nicht geladen werden.',
      emptyTitle: 'Kein freigegebenes Projekt',
      emptyDetail:
        'Sobald ein Projekt für Sie freigegeben ist, erscheint es hier mit seinem Stand.',
      schedule: (start: string, target: string | null) =>
        target === null ? `Start ${start}` : `Start ${start} · Ziel ${target}`,
    },
    contracts: {
      heading: 'Serviceverträge',
      loading: 'Verträge werden geladen …',
      loadFailed: 'Die Verträge konnten nicht geladen werden.',
      emptyTitle: 'Kein freigegebener Vertrag',
      emptyDetail:
        'Sobald ein Vertrag für Sie freigegeben ist, sehen Sie hier Leistung und Betrag.',
      amountPending: 'Gilt ab Vertragsbeginn',
      perMonth: (amount: string) => `CHF ${amount} pro Monat`,
      term: (start: string, end: string | null) =>
        end === null ? `Ab ${start} · unbefristet` : `Ab ${start} bis ${end}`,
      inactive: 'derzeit nicht aktiv',
    },
    documents: {
      heading: 'Dokumente',
      loading: 'Dokumente werden geladen …',
      loadFailed: 'Die Dokumente konnten nicht geladen werden.',
      emptyTitle: 'Keine freigegebenen Unterlagen',
      emptyDetail: 'Hier erscheinen die Dateien, die für Sie freigegeben wurden.',
      download: 'Herunterladen',
    },
    progress: {
      noMilestones: 'Noch keine Meilensteine',
      done: (done: number, total: number) => `${done} von ${total} erledigt`,
      nextStep: (title: string) => `Nächster Schritt: ${title}`,
    },
  },
  fr: {
    shell: {
      navLabel: 'Navigation du portail',
      skipToContent: 'Aller au contenu',
      wordmark: 'Portail client',
      yourAccess: 'Votre accès',
      openNavigation: 'Ouvrir la navigation',
      closeNavigation: 'Fermer la navigation',
      close: 'Fermer',
      signOut: 'Se déconnecter',
    },
    nav: {
      overview: 'Aperçu',
      projects: 'Projets',
      contracts: 'Contrats',
      requests: 'Demandes',
      documents: 'Documents',
      account: 'Compte',
    },
    account: {
      title: 'Compte',
      lead: 'Votre accès à ce portail client.',
    },
    overview: {
      loading: "Chargement de l'aperçu …",
      loadFailed: "L'aperçu n'a pas pu être chargé. Veuillez recharger la page.",
      managedBy: (workspaceName: string) => `Suivi assuré par ${workspaceName}`,
      yourProjects: 'Vos projets',
      noProjects: "Aucun projet n'est actuellement partagé avec vous.",
      yourOpenRequests: 'Vos demandes ouvertes',
      noOpenRequests: 'Aucune demande ouverte.',
    },
    projects: {
      heading: 'Projets',
      loading: 'Chargement des projets …',
      loadFailed: "Les projets n'ont pas pu être chargés.",
      emptyTitle: 'Aucun projet partagé',
      emptyDetail:
        "Dès qu'un projet est partagé avec vous, il apparaît ici avec son état d'avancement.",
      schedule: (start: string, target: string | null) =>
        target === null ? `Début ${start}` : `Début ${start} · Échéance ${target}`,
    },
    contracts: {
      heading: 'Contrats de service',
      loading: 'Chargement des contrats …',
      loadFailed: "Les contrats n'ont pas pu être chargés.",
      emptyTitle: 'Aucun contrat partagé',
      emptyDetail:
        "Dès qu'un contrat est partagé avec vous, vous voyez ici la prestation et le montant.",
      amountPending: 'Applicable dès le début du contrat',
      perMonth: (amount: string) => `CHF ${amount} par mois`,
      term: (start: string, end: string | null) =>
        end === null ? `Dès le ${start} · durée indéterminée` : `Du ${start} au ${end}`,
      inactive: 'actuellement inactif',
    },
    documents: {
      heading: 'Documents',
      loading: 'Chargement des documents …',
      loadFailed: "Les documents n'ont pas pu être chargés.",
      emptyTitle: 'Aucun document partagé',
      emptyDetail: 'Les fichiers partagés avec vous apparaissent ici.',
      download: 'Télécharger',
    },
    progress: {
      noMilestones: "Aucun jalon pour l'instant",
      done: (done: number, total: number) =>
        `${done} sur ${total} ${done < 2 ? 'terminé' : 'terminés'}`,
      nextStep: (title: string) => `Prochaine étape\u00a0: ${title}`,
    },
  },
  it: {
    shell: {
      navLabel: 'Navigazione del portale',
      skipToContent: 'Vai al contenuto',
      wordmark: 'Portale clienti',
      yourAccess: 'Il Suo accesso',
      openNavigation: 'Apri la navigazione',
      closeNavigation: 'Chiudi la navigazione',
      close: 'Chiudi',
      signOut: 'Esci',
    },
    nav: {
      overview: 'Panoramica',
      projects: 'Progetti',
      contracts: 'Contratti',
      requests: 'Richieste',
      documents: 'Documenti',
      account: 'Account',
    },
    account: {
      title: 'Account',
      lead: 'Il Suo accesso a questo portale clienti.',
    },
    overview: {
      loading: 'Caricamento della panoramica …',
      loadFailed: 'Non è stato possibile caricare la panoramica. Ricarichi la pagina.',
      managedBy: (workspaceName: string) => `A cura di ${workspaceName}`,
      yourProjects: 'I Suoi progetti',
      noProjects: 'Al momento nessun progetto è condiviso con Lei.',
      yourOpenRequests: 'Le Sue richieste aperte',
      noOpenRequests: 'Nessuna richiesta aperta.',
    },
    projects: {
      heading: 'Progetti',
      loading: 'Caricamento dei progetti …',
      loadFailed: 'Non è stato possibile caricare i progetti.',
      emptyTitle: 'Nessun progetto condiviso',
      emptyDetail:
        'Non appena un progetto viene condiviso con Lei, compare qui con il suo stato di avanzamento.',
      schedule: (start: string, target: string | null) =>
        target === null ? `Inizio ${start}` : `Inizio ${start} · Termine ${target}`,
    },
    contracts: {
      heading: 'Contratti di servizio',
      loading: 'Caricamento dei contratti …',
      loadFailed: 'Non è stato possibile caricare i contratti.',
      emptyTitle: 'Nessun contratto condiviso',
      emptyDetail:
        "Non appena un contratto viene condiviso con Lei, qui vede la prestazione e l'importo.",
      amountPending: "Valido dall'inizio del contratto",
      perMonth: (amount: string) => `CHF ${amount} al mese`,
      term: (start: string, end: string | null) =>
        end === null ? `Dal ${start} · a tempo indeterminato` : `Dal ${start} al ${end}`,
      inactive: 'attualmente non attivo',
    },
    documents: {
      heading: 'Documenti',
      loading: 'Caricamento dei documenti …',
      loadFailed: 'Non è stato possibile caricare i documenti.',
      emptyTitle: 'Nessun documento condiviso',
      emptyDetail: 'Qui compaiono i file condivisi con Lei.',
      download: 'Scarica',
    },
    progress: {
      noMilestones: 'Ancora nessun traguardo',
      done: (done: number, total: number) =>
        `${done} di ${total} ${done === 1 ? 'completato' : 'completati'}`,
      nextStep: (title: string) => `Prossimo passo: ${title}`,
    },
  },
  en: {
    shell: {
      navLabel: 'Portal navigation',
      skipToContent: 'Skip to content',
      wordmark: 'Client portal',
      yourAccess: 'Your access',
      openNavigation: 'Open navigation',
      closeNavigation: 'Close navigation',
      close: 'Close',
      signOut: 'Sign out',
    },
    nav: {
      overview: 'Overview',
      projects: 'Projects',
      contracts: 'Contracts',
      requests: 'Requests',
      documents: 'Documents',
      account: 'Account',
    },
    account: {
      title: 'Account',
      lead: 'Your access to this client portal.',
    },
    overview: {
      loading: 'Loading overview …',
      loadFailed: 'The overview could not be loaded. Please reload the page.',
      managedBy: (workspaceName: string) => `Looked after by ${workspaceName}`,
      yourProjects: 'Your projects',
      noProjects: 'No project is currently shared with you.',
      yourOpenRequests: 'Your open requests',
      noOpenRequests: 'No open requests.',
    },
    projects: {
      heading: 'Projects',
      loading: 'Loading projects …',
      loadFailed: 'The projects could not be loaded.',
      emptyTitle: 'No shared projects',
      emptyDetail:
        'As soon as a project is shared with you, it appears here with its current status.',
      schedule: (start: string, target: string | null) =>
        target === null ? `Start ${start}` : `Start ${start} · Target ${target}`,
    },
    contracts: {
      heading: 'Service contracts',
      loading: 'Loading contracts …',
      loadFailed: 'The contracts could not be loaded.',
      emptyTitle: 'No shared contracts',
      emptyDetail:
        'As soon as a contract is shared with you, you will see its service and amount here.',
      amountPending: 'Applies from the contract start',
      perMonth: (amount: string) => `CHF ${amount} per month`,
      term: (start: string, end: string | null) =>
        end === null ? `From ${start} · open-ended` : `From ${start} to ${end}`,
      inactive: 'not currently active',
    },
    documents: {
      heading: 'Documents',
      loading: 'Loading documents …',
      loadFailed: 'The documents could not be loaded.',
      emptyTitle: 'No shared documents',
      emptyDetail: 'Files that have been shared with you appear here.',
      download: 'Download',
    },
    progress: {
      noMilestones: 'No milestones yet',
      done: (done: number, total: number) => `${done} of ${total} done`,
      nextStep: (title: string) => `Next step: ${title}`,
    },
  },
});
