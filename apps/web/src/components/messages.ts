import { defineMessages } from '../i18n/messages.ts';

/** Texte der App-Hülle und der Grundbausteine, die jede Seite teilt. */
export const shellMessages = defineMessages({
  de: {
    skipToContent: 'Zum Inhalt springen',
    openNavigation: 'Navigation öffnen',
    closeNavigation: 'Navigation schliessen',
    mainNavigation: 'Hauptnavigation',
    breadcrumbs: 'Brotkrumen',
    overview: 'Übersicht',
    sections: {
      dashboard: 'Dashboard',
      customers: 'Kunden',
      projects: 'Projekte',
      contracts: 'Verträge',
      requests: 'Anfragen',
      documents: 'Dokumente',
      settings: 'Einstellungen',
    },
    jumpTo: 'Springen zu',
    openSearch: 'Suche öffnen, Tastenkürzel Befehl K',
    signOut: 'Abmelden',
    signingOut: 'Abmelden …',
    close: 'Schliessen',
    loadFailed: 'Konnte nicht geladen werden',
    appearance: 'Erscheinungsbild',
    theme: { system: 'Gerät', light: 'Hell', dark: 'Dunkel' },
    pages: 'Seiten',
    pageOf: (page: number, total: number, items: number) =>
      `Seite ${page} von ${total} · ${items} Einträge`,
    previous: 'Zurück',
    next: 'Weiter',
    archived: 'Archiviert',
    loading: 'Wird geladen …',
    serverUnreachable: {
      title: 'Server nicht erreichbar',
      detail: 'Die Anwendung konnte den Anmeldestatus nicht laden. Bitte Seite neu laden.',
    },
    noWorkspace: {
      title: 'Kein Workspace zugeordnet',
      detail:
        'Dieses Konto gehört zu keinem Workspace. Ein Owner muss eine Mitgliedschaft vergeben.',
    },
    crash: {
      title: 'Hier ist etwas schiefgegangen',
      detail:
        'Die Seite konnte nicht angezeigt werden. Ihre Daten sind davon nicht betroffen. Neu laden hilft meistens.',
      reload: 'Seite neu laden',
    },
  },
  en: {
    skipToContent: 'Skip to content',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    mainNavigation: 'Main navigation',
    breadcrumbs: 'Breadcrumbs',
    overview: 'Overview',
    sections: {
      dashboard: 'Dashboard',
      customers: 'Customers',
      projects: 'Projects',
      contracts: 'Contracts',
      requests: 'Requests',
      documents: 'Documents',
      settings: 'Settings',
    },
    jumpTo: 'Jump to',
    openSearch: 'Open search, shortcut Command K',
    signOut: 'Sign out',
    signingOut: 'Signing out …',
    close: 'Close',
    loadFailed: 'Could not be loaded',
    appearance: 'Appearance',
    theme: { system: 'Device', light: 'Light', dark: 'Dark' },
    pages: 'Pages',
    pageOf: (page: number, total: number, items: number) =>
      `Page ${page} of ${total} · ${items} ${items === 1 ? 'entry' : 'entries'}`,
    previous: 'Previous',
    next: 'Next',
    archived: 'Archived',
    loading: 'Loading …',
    serverUnreachable: {
      title: 'Server not reachable',
      detail: 'The app could not load your sign-in status. Please reload the page.',
    },
    noWorkspace: {
      title: 'No workspace assigned',
      detail: 'This account does not belong to any workspace. An owner has to add a membership.',
    },
    crash: {
      title: 'Something went wrong here',
      detail:
        'The page could not be displayed. Your data is not affected. Reloading usually helps.',
      reload: 'Reload page',
    },
  },
});
