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
