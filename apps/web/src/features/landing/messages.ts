import { defineMessages } from '../../i18n/messages.ts';

export const landingMessages = defineMessages({
  de: {
    documentTitle: 'Tallyroom · Kundenübersicht und Kundenportal für kleine Agenturen',
    signIn: 'Anmelden',
    headline: 'Kundenübersicht und Kundenportal für kleine Agenturen',
    lead: 'Projektstände, monatliche Servicevereinbarungen, Unterlagen und Kundenanfragen an einem Ort — und ein getrenntes Portal, in dem der Kunde genau das sieht, was freigegeben ist.',
    startDemo: 'Demo starten',
    preparingDemo: 'Demo wird vorbereitet …',
    demoFailed: 'Die Demo konnte nicht gestartet werden. Bitte später erneut versuchen.',
    motionToggle: 'Bewegung anhalten',
    facts: {
      runtime: { label: 'Laufzeit', value: (minutes: number) => `${minutes} Minuten` },
      data: { label: 'Datenbestand', value: 'eigener je Besucher' },
      after: { label: 'Danach', value: 'gelöscht, samt Dateien' },
      fictional: { label: 'Firmen und Zahlen', value: 'erfunden' },
    },
    features: {
      clients: {
        title: 'Kunden, Projekte, Meilensteine',
        detail:
          'Wer wird betreut, was läuft, was ist überfällig. Fortschritt entsteht aus erledigten Meilensteinen und nicht aus einer Schätzung.',
      },
      contracts: {
        title: 'Verträge mit Preisversionen',
        detail:
          'Eine Preisänderung gilt ab ihrem Datum und lässt vergangene Monatswerte unberührt. Der monatliche Vertragswert ist zu jedem Stichtag nachvollziehbar.',
      },
      portal: {
        title: 'Getrenntes Kundenportal',
        detail:
          'Der Kunde sieht freigegebene Projekte, Unterlagen und den öffentlichen Teil des Verlaufs. Interne Notizen und Kommentare erreichen ihn nicht.',
      },
    },
  },
  fr: {
    documentTitle: "Tallyroom · Vue d'ensemble des clients et portail client pour petites agences",
    signIn: 'Se connecter',
    headline: "Vue d'ensemble des clients et portail client pour petites agences",
    lead: 'Avancement des projets, contrats de service mensuels, documents et demandes des clients au même endroit — et un portail séparé où le client voit exactement ce qui a été partagé.',
    startDemo: 'Démarrer la démo',
    preparingDemo: 'Préparation de la démo …',
    demoFailed: "La démo n'a pas pu être démarrée. Veuillez réessayer plus tard.",
    motionToggle: 'Arrêter le mouvement',
    facts: {
      runtime: { label: 'Durée', value: (minutes: number) => `${minutes} minutes` },
      data: { label: 'Jeu de données', value: 'un par visiteur' },
      after: { label: 'Ensuite', value: 'supprimé, fichiers compris' },
      fictional: { label: 'Entreprises et chiffres', value: 'fictifs' },
    },
    features: {
      clients: {
        title: 'Clients, projets, jalons',
        detail:
          "Qui est suivi, ce qui est en cours, ce qui est en retard. L'avancement découle des jalons terminés et non d'une estimation.",
      },
      contracts: {
        title: 'Contrats avec versions de prix',
        detail:
          "Un changement de prix s'applique à partir de sa date et ne touche pas les valeurs mensuelles passées. La valeur mensuelle du contrat est traçable à toute date de référence.",
      },
      portal: {
        title: 'Portail client séparé',
        detail:
          "Le client voit les projets et documents partagés ainsi que la partie publique de l'historique. Les notes et commentaires internes ne lui parviennent pas.",
      },
    },
  },
  it: {
    documentTitle: 'Tallyroom · Panoramica dei clienti e portale clienti per piccole agenzie',
    signIn: 'Accedi',
    headline: 'Panoramica dei clienti e portale clienti per piccole agenzie',
    lead: 'Stato dei progetti, contratti di servizio mensili, documenti e richieste dei clienti in un unico posto — e un portale separato in cui il cliente vede esattamente ciò che è stato condiviso.',
    startDemo: 'Avvia la demo',
    preparingDemo: 'Preparazione della demo …',
    demoFailed: 'Non è stato possibile avviare la demo. Riprovi più tardi.',
    motionToggle: 'Ferma il movimento',
    facts: {
      runtime: { label: 'Durata', value: (minutes: number) => `${minutes} minuti` },
      data: { label: 'Set di dati', value: 'uno per visitatore' },
      after: { label: 'Al termine', value: 'eliminato, file inclusi' },
      fictional: { label: 'Aziende e numeri', value: 'fittizi' },
    },
    features: {
      clients: {
        title: 'Clienti, progetti, traguardi',
        detail:
          "Chi viene seguito, cosa è in corso, cosa è in ritardo. L'avanzamento deriva dai traguardi completati, non da una stima.",
      },
      contracts: {
        title: 'Contratti con versioni di prezzo',
        detail:
          'Una modifica di prezzo vale dalla sua data e lascia invariati i valori mensili passati. Il valore mensile del contratto è tracciabile per ogni data di riferimento.',
      },
      portal: {
        title: 'Portale clienti separato',
        detail:
          'Il cliente vede i progetti e i documenti condivisi e la parte pubblica della cronologia. Note e commenti interni non lo raggiungono.',
      },
    },
  },
  en: {
    documentTitle: 'Tallyroom · Client overview and client portal for small agencies',
    signIn: 'Sign in',
    headline: 'Client overview and client portal for small agencies',
    lead: 'Project status, monthly service agreements, documents and client requests in one place — and a separate portal where each client sees exactly what has been shared with them.',
    startDemo: 'Start demo',
    preparingDemo: 'Preparing demo …',
    demoFailed: 'The demo could not be started. Please try again later.',
    motionToggle: 'Pause motion',
    facts: {
      runtime: { label: 'Runs for', value: (minutes: number) => `${minutes} minutes` },
      data: { label: 'Data', value: 'your own copy' },
      after: { label: 'Afterwards', value: 'deleted, files included' },
      fictional: { label: 'Companies and figures', value: 'fictional' },
    },
    features: {
      clients: {
        title: 'Customers, projects, milestones',
        detail:
          'Who is looked after, what is running, what is overdue. Progress comes from completed milestones, not from an estimate.',
      },
      contracts: {
        title: 'Contracts with price versions',
        detail:
          'A price change applies from its date and leaves past monthly values untouched. The monthly contract value can be traced for any reference date.',
      },
      portal: {
        title: 'A separate client portal',
        detail:
          'The client sees shared projects, documents and the public part of the history. Internal notes and comments never reach them.',
      },
    },
  },
});
