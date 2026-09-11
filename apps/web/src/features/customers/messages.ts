import { defineMessages } from '../../i18n/messages.ts';

/** Texte des Kundenbereichs: Liste, Detailseite, Formular und Archivieren. */
export const customerMessages = defineMessages({
  de: {
    createCustomer: 'Kunde anlegen',
    editCustomer: 'Kunde bearbeiten',
    runningProjectCount: (count: number) =>
      count === 1 ? '1 laufendes Projekt' : `${count} laufende Projekte`,
    status: { active: 'Aktiv', archived: 'Archiviert', all: 'Alle' },
    fields: {
      name: 'Name',
      mainContact: 'Hauptkontakt',
      email: 'E-Mail',
      phone: 'Telefon',
      website: 'Webseite',
      internalNote: 'Interne Notiz',
      runningProjects: 'Laufende Projekte',
      status: 'Status',
    },
    list: {
      title: 'Kunden',
      lead: 'Alle Kunden dieser Agentur.',
      searchPlaceholder: 'Name, Kontakt oder E-Mail',
      searchLabel: 'Kunden durchsuchen',
      loading: 'Kunden werden geladen …',
      loadFailed: 'Die Kundenliste konnte nicht geladen werden. Bitte Seite neu laden.',
      noMatch: 'Kein Treffer',
      noMatchDetail: (search: string) =>
        `Zu „${search}" gibt es in dieser Ansicht keinen Kunden. Suchbegriff ändern oder den Statusfilter erweitern.`,
      empty: 'Noch keine Kunden',
      emptyDetail:
        'Sobald der erste Kunde angelegt ist, erscheint er hier mit seinen laufenden Projekten.',
    },
    detail: {
      loading: 'Kunde wird geladen …',
      notFound: 'Dieser Kunde existiert nicht oder gehört zu einem anderen Workspace.',
      back: 'Alle Kunden',
      edit: 'Bearbeiten',
      overview: 'Übersicht',
      notRecorded: 'Nicht erfasst',
      projects: 'Projekte',
      projectsLoading: 'Projekte werden geladen …',
      noProjects: 'Für diesen Kunden gibt es noch kein Projekt.',
    },
    form: {
      saveFailed: 'Speichern derzeit nicht möglich. Bitte später erneut versuchen.',
      optional: 'Optional',
      websiteHint: 'Optional, mit https:// beginnen',
      internalNoteHint: 'Nur für das Team sichtbar, nie im Kundenportal',
      cancel: 'Abbrechen',
      saving: 'Wird gespeichert …',
      saveChanges: 'Änderungen speichern',
    },
    archive: {
      archivedDetail:
        'Dieser Kunde ist archiviert. Die Daten bleiben vollständig lesbar und können zurückgeholt werden.',
      restoring: 'Wird zurückgeholt …',
      restore: 'Kunde zurückholen',
      title: 'Archivieren',
      checking: 'Wird geprüft …',
      blocked: 'Noch nicht möglich',
      activeContracts: (count: number) =>
        count === 1 ? '1 aktiver Vertrag' : `${count} aktive Verträge`,
      openRequests: (count: number) =>
        count === 1 ? '1 offene Anfrage' : `${count} offene Anfragen`,
      nothingBlocks:
        'Nichts steht entgegen. Archivierte Kunden verschwinden aus der Standardliste, bleiben aber lesbar und können jederzeit zurückgeholt werden.',
      failed:
        'Archivieren nicht möglich. Möglicherweise ist inzwischen neue Arbeit dazugekommen — bitte Seite neu laden.',
      archiving: 'Wird archiviert …',
      archive: 'Kunde archivieren',
    },
  },
  fr: {
    createCustomer: 'Créer un client',
    editCustomer: 'Modifier le client',
    runningProjectCount: (count: number) =>
      count < 2 ? `${count} projet en cours` : `${count} projets en cours`,
    status: { active: 'Actif', archived: 'Archivé', all: 'Tous' },
    fields: {
      name: 'Nom',
      mainContact: 'Contact principal',
      email: 'E-mail',
      phone: 'Téléphone',
      website: 'Site web',
      internalNote: 'Note interne',
      runningProjects: 'Projets en cours',
      status: 'Statut',
    },
    list: {
      title: 'Clients',
      lead: 'Tous les clients de cette agence.',
      searchPlaceholder: 'Nom, contact ou e-mail',
      searchLabel: 'Rechercher des clients',
      loading: 'Chargement des clients …',
      loadFailed: "La liste des clients n'a pas pu être chargée. Veuillez recharger la page.",
      noMatch: 'Aucun résultat',
      noMatchDetail: (search: string) =>
        `Aucun client ne correspond à «\u00a0${search}\u00a0» dans cette vue. Modifiez le terme de recherche ou élargissez le filtre de statut.`,
      empty: "Aucun client pour l'instant",
      emptyDetail: 'Dès que le premier client est créé, il apparaît ici avec ses projets en cours.',
    },
    detail: {
      loading: 'Chargement du client …',
      notFound: "Ce client n'existe pas ou appartient à un autre espace de travail.",
      back: 'Tous les clients',
      edit: 'Modifier',
      overview: 'Aperçu',
      notRecorded: 'Non renseigné',
      projects: 'Projets',
      projectsLoading: 'Chargement des projets …',
      noProjects: "Ce client n'a encore aucun projet.",
    },
    form: {
      saveFailed: 'Enregistrement impossible pour le moment. Veuillez réessayer plus tard.',
      optional: 'Facultatif',
      websiteHint: 'Facultatif, doit commencer par https://',
      internalNoteHint: "Visible uniquement par l'équipe, jamais dans le portail client",
      cancel: 'Annuler',
      saving: 'Enregistrement …',
      saveChanges: 'Enregistrer les modifications',
    },
    archive: {
      archivedDetail:
        'Ce client est archivé. Les données restent entièrement lisibles et peuvent être restaurées.',
      restoring: 'Restauration …',
      restore: 'Restaurer le client',
      title: 'Archivage',
      checking: 'Vérification …',
      blocked: 'Pas encore possible',
      activeContracts: (count: number) =>
        count < 2 ? `${count} contrat actif` : `${count} contrats actifs`,
      openRequests: (count: number) =>
        count < 2 ? `${count} demande ouverte` : `${count} demandes ouvertes`,
      nothingBlocks:
        "Rien ne s'y oppose. Les clients archivés disparaissent de la liste standard, mais restent lisibles et peuvent être restaurés à tout moment.",
      failed:
        'Archivage impossible. Du nouveau travail a peut-être été ajouté entre-temps — veuillez recharger la page.',
      archiving: 'Archivage …',
      archive: 'Archiver le client',
    },
  },
  it: {
    createCustomer: 'Crea cliente',
    editCustomer: 'Modifica cliente',
    runningProjectCount: (count: number) =>
      count === 1 ? '1 progetto in corso' : `${count} progetti in corso`,
    status: { active: 'Attivo', archived: 'Archiviato', all: 'Tutti' },
    fields: {
      name: 'Nome',
      mainContact: 'Contatto principale',
      email: 'E-mail',
      phone: 'Telefono',
      website: 'Sito web',
      internalNote: 'Nota interna',
      runningProjects: 'Progetti in corso',
      status: 'Stato',
    },
    list: {
      title: 'Clienti',
      lead: 'Tutti i clienti di questa agenzia.',
      searchPlaceholder: 'Nome, contatto o e-mail',
      searchLabel: 'Cerca clienti',
      loading: 'Caricamento dei clienti …',
      loadFailed: "Non è stato possibile caricare l'elenco dei clienti. Ricarichi la pagina.",
      noMatch: 'Nessun risultato',
      noMatchDetail: (search: string) =>
        `Nessun cliente corrisponde a «${search}» in questa vista. Modifichi il termine di ricerca o estenda il filtro di stato.`,
      empty: 'Ancora nessun cliente',
      emptyDetail:
        'Non appena viene creato il primo cliente, compare qui con i suoi progetti in corso.',
    },
    detail: {
      loading: 'Caricamento del cliente …',
      notFound: "Questo cliente non esiste o appartiene a un'altra area di lavoro.",
      back: 'Tutti i clienti',
      edit: 'Modifica',
      overview: 'Panoramica',
      notRecorded: 'Non indicato',
      projects: 'Progetti',
      projectsLoading: 'Caricamento dei progetti …',
      noProjects: "Per questo cliente non c'è ancora nessun progetto.",
    },
    form: {
      saveFailed: 'Al momento non è possibile salvare. Riprovi più tardi.',
      optional: 'Facoltativo',
      websiteHint: 'Facoltativo, deve iniziare con https://',
      internalNoteHint: 'Visibile solo al team, mai nel portale clienti',
      cancel: 'Annulla',
      saving: 'Salvataggio …',
      saveChanges: 'Salva modifiche',
    },
    archive: {
      archivedDetail:
        'Questo cliente è archiviato. I dati restano interamente consultabili e possono essere ripristinati.',
      restoring: 'Ripristino …',
      restore: 'Ripristina cliente',
      title: 'Archiviazione',
      checking: 'Verifica in corso …',
      blocked: 'Non ancora possibile',
      activeContracts: (count: number) =>
        count === 1 ? '1 contratto attivo' : `${count} contratti attivi`,
      openRequests: (count: number) =>
        count === 1 ? '1 richiesta aperta' : `${count} richieste aperte`,
      nothingBlocks:
        "Nulla lo impedisce. I clienti archiviati scompaiono dall'elenco standard, ma restano consultabili e possono essere ripristinati in qualsiasi momento.",
      failed:
        'Archiviazione non possibile. Nel frattempo potrebbe essere stato aggiunto nuovo lavoro — ricarichi la pagina.',
      archiving: 'Archiviazione …',
      archive: 'Archivia cliente',
    },
  },
  en: {
    createCustomer: 'Create customer',
    editCustomer: 'Edit customer',
    runningProjectCount: (count: number) =>
      count === 1 ? '1 ongoing project' : `${count} ongoing projects`,
    status: { active: 'Active', archived: 'Archived', all: 'All' },
    fields: {
      name: 'Name',
      mainContact: 'Main contact',
      email: 'Email',
      phone: 'Phone',
      website: 'Website',
      internalNote: 'Internal note',
      runningProjects: 'Ongoing projects',
      status: 'Status',
    },
    list: {
      title: 'Customers',
      lead: 'All customers of this agency.',
      searchPlaceholder: 'Name, contact or email',
      searchLabel: 'Search customers',
      loading: 'Loading customers …',
      loadFailed: 'The customer list could not be loaded. Please reload the page.',
      noMatch: 'No matches',
      noMatchDetail: (search: string) =>
        `No customer matches ‘${search}’ in this view. Change the search term or widen the status filter.`,
      empty: 'No customers yet',
      emptyDetail:
        'Once the first customer has been created, it appears here with its ongoing projects.',
    },
    detail: {
      loading: 'Loading customer …',
      notFound: 'This customer does not exist or belongs to another workspace.',
      back: 'All customers',
      edit: 'Edit',
      overview: 'Overview',
      notRecorded: 'Not recorded',
      projects: 'Projects',
      projectsLoading: 'Loading projects …',
      noProjects: 'There are no projects for this customer yet.',
    },
    form: {
      saveFailed: 'Saving is not possible right now. Please try again later.',
      optional: 'Optional',
      websiteHint: 'Optional, start with https://',
      internalNoteHint: 'Visible to the team only, never in the client portal',
      cancel: 'Cancel',
      saving: 'Saving …',
      saveChanges: 'Save changes',
    },
    archive: {
      archivedDetail: 'This customer is archived. All data remains readable and can be restored.',
      restoring: 'Restoring …',
      restore: 'Restore customer',
      title: 'Archive',
      checking: 'Checking …',
      blocked: 'Not possible yet',
      activeContracts: (count: number) =>
        count === 1 ? '1 active contract' : `${count} active contracts`,
      openRequests: (count: number) => (count === 1 ? '1 open request' : `${count} open requests`),
      nothingBlocks:
        'Nothing stands in the way. Archived customers disappear from the default list but remain readable and can be restored at any time.',
      failed:
        'Archiving is not possible. New work may have been added in the meantime — please reload the page.',
      archiving: 'Archiving …',
      archive: 'Archive customer',
    },
  },
});
