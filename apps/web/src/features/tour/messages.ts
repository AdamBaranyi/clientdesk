import { defineMessages } from '../../i18n/messages.ts';

/**
 * Die Bereichsnamen selbst kommen aus `shellMessages.sections`, damit der
 * Rundgang genau die Wörter der Navigation benutzt. Hier steht nur, wozu
 * jeder Bereich da ist.
 */
export const tourMessages = defineMessages({
  de: {
    dialogLabel: 'Rundgang durch die Demo',
    progress: (step: number, total: number) => `Schritt ${step} von ${total}`,
    next: 'Weiter',
    back: 'Zurück',
    finish: 'Loslegen',
    skip: 'Rundgang beenden',
    restart: 'Rundgang starten',
    steps: {
      welcome: {
        title: 'Willkommen in Tallyroom',
        body: 'Tallyroom bündelt für kleine Agenturen Kunden, Projekte, Verträge, Anfragen und Dokumente an einem Ort. Dazu gehört ein Portal, in dem jeder Kunde nur sieht, was für ihn freigegeben ist. Dieser Rundgang zeigt, wo was steht.',
      },
      metrics: {
        title: 'Die Übersicht',
        body: 'Vier Kennzahlen zeigen den Stand der Agentur: monatlicher Vertragswert, aktive Kunden, laufende Projekte und bestätigte Verträge. Ein Klick auf eine Zahl öffnet die passende, schon gefilterte Liste. Berechnet wird alles aus den Daten dieser Demo.',
      },
      navigation: {
        title: 'Die Bereiche',
        body: 'Über die Navigation erreichen Sie jeden Bereich:',
      },
      palette: {
        title: 'Schnell springen',
        body: '«Springen zu» durchsucht Kunden, Projekte, Verträge und Anfragen. Per Tastatur geht es mit ⌘K oder Ctrl+K.',
      },
      roles: {
        title: 'Mit den Augen des Kunden',
        body: 'Hier wechseln Sie zwischen den Personen dieser Demo: Owner, Teammitglied oder Kunde im Portal. So sehen Sie selbst, was ein Kunde zu sehen bekommt und was intern bleibt.',
      },
      done: {
        title: 'Jetzt selbst ausprobieren',
        body: 'Legen Sie Kunden an, ändern Sie Verträge oder schreiben Sie als Kunde eine Anfrage. Die Demo gehört nur Ihnen und wird danach gelöscht. Den Rundgang starten Sie hier jederzeit neu.',
      },
    },
    sections: {
      customers: 'Firmen mit Ansprechperson, Kontaktdaten und internen Notizen.',
      projects:
        'Laufende Arbeit mit Meilensteinen. Der Fortschritt ergibt sich aus den erledigten.',
      contracts: 'Monatliche Serviceverträge. Eine Preisänderung gilt ab ihrem Datum.',
      requests: 'Anliegen der Kunden aus dem Portal, mit Verlauf und internen Kommentaren.',
      documents: 'PDFs zu Kunden und Projekten. Intern, bis Sie sie freigeben.',
      settings: 'Teammitglieder und Kunden einladen, Rollen vergeben.',
    },
  },
  fr: {
    dialogLabel: 'Visite guidée de la démo',
    progress: (step: number, total: number) => `Étape ${step} sur ${total}`,
    next: 'Suivant',
    back: 'Retour',
    finish: 'Commencer',
    skip: 'Terminer la visite',
    restart: 'Lancer la visite',
    steps: {
      welcome: {
        title: 'Bienvenue dans Tallyroom',
        body: "Tallyroom réunit pour les petites agences clients, projets, contrats, demandes et documents au même endroit. S'y ajoute un portail où chaque client ne voit que ce qui a été partagé avec lui. Cette visite montre où se trouve quoi.",
      },
      metrics: {
        title: "La vue d'ensemble",
        body: "Quatre indicateurs montrent l'état de l'agence\u00a0: valeur contractuelle mensuelle, clients actifs, projets en cours et contrats confirmés. Un clic sur un chiffre ouvre la liste correspondante, déjà filtrée. Tout est calculé à partir des données de cette démo.",
      },
      navigation: {
        title: 'Les rubriques',
        body: 'La navigation mène à chaque rubrique\u00a0:',
      },
      palette: {
        title: 'Aller plus vite',
        body: '«\u00a0Aller à\u00a0» recherche parmi les clients, projets, contrats et demandes. Au clavier\u00a0: ⌘K ou Ctrl+K.',
      },
      roles: {
        title: 'Avec les yeux du client',
        body: "Ici, vous passez d'une personne de cette démo à l'autre\u00a0: propriétaire, membre de l'équipe ou client dans le portail. Vous voyez ainsi vous-même ce que le client voit et ce qui reste interne.",
      },
      done: {
        title: 'À vous de jouer',
        body: "Créez des clients, modifiez des contrats ou écrivez une demande en tant que client. La démo n'appartient qu'à vous et sera ensuite supprimée. Vous pouvez relancer la visite ici à tout moment.",
      },
    },
    sections: {
      customers: 'Entreprises avec personne de contact, coordonnées et notes internes.',
      projects: "Travail en cours avec jalons. L'avancement découle des jalons terminés.",
      contracts:
        "Contrats de service mensuels. Un changement de prix s'applique à partir de sa date.",
      requests: 'Demandes des clients depuis le portail, avec historique et commentaires internes.',
      documents: "PDF liés aux clients et aux projets. Internes jusqu'à ce que vous les partagiez.",
      settings: "Inviter des membres de l'équipe et des clients, attribuer des rôles.",
    },
  },
  it: {
    dialogLabel: 'Visita guidata della demo',
    progress: (step: number, total: number) => `Passo ${step} di ${total}`,
    next: 'Avanti',
    back: 'Indietro',
    finish: 'Inizia',
    skip: 'Termina la visita',
    restart: 'Avvia la visita',
    steps: {
      welcome: {
        title: 'Benvenuto in Tallyroom',
        body: 'Tallyroom riunisce per le piccole agenzie clienti, progetti, contratti, richieste e documenti in un unico posto. A questo si aggiunge un portale in cui ogni cliente vede solo ciò che è stato condiviso con lui. Questa visita mostra dove si trova cosa.',
      },
      metrics: {
        title: 'La panoramica',
        body: "Quattro indicatori mostrano lo stato dell'agenzia: valore contrattuale mensile, clienti attivi, progetti in corso e contratti confermati. Un clic su un numero apre l'elenco corrispondente, già filtrato. Tutto è calcolato dai dati di questa demo.",
      },
      navigation: {
        title: 'Le sezioni',
        body: 'Dalla navigazione raggiunge ogni sezione:',
      },
      palette: {
        title: 'Salti rapidi',
        body: '«Vai a» cerca tra clienti, progetti, contratti e richieste. Da tastiera: ⌘K o Ctrl+K.',
      },
      roles: {
        title: 'Con gli occhi del cliente',
        body: "Qui passa da una persona di questa demo all'altra: proprietario, membro del team o cliente nel portale. Così vede di persona che cosa vede un cliente e che cosa resta interno.",
      },
      done: {
        title: 'Ora tocca a Lei',
        body: 'Crei clienti, modifichi contratti o scriva una richiesta come cliente. La demo appartiene solo a Lei e sarà poi eliminata. Può riavviare la visita qui in qualsiasi momento.',
      },
    },
    sections: {
      customers: 'Aziende con persona di contatto, recapiti e note interne.',
      projects: "Lavori in corso con traguardi. L'avanzamento risulta dai traguardi completati.",
      contracts: 'Contratti di servizio mensili. Una modifica di prezzo vale dalla sua data.',
      requests: 'Richieste dei clienti dal portale, con cronologia e commenti interni.',
      documents: 'PDF legati a clienti e progetti. Interni finché non li condivide.',
      settings: 'Invitare membri del team e clienti, assegnare ruoli.',
    },
  },
  en: {
    dialogLabel: 'Tour of the demo',
    progress: (step: number, total: number) => `Step ${step} of ${total}`,
    next: 'Next',
    back: 'Back',
    finish: 'Get started',
    skip: 'End tour',
    restart: 'Start tour',
    steps: {
      welcome: {
        title: 'Welcome to Tallyroom',
        body: 'Tallyroom brings customers, projects, contracts, requests and documents together in one place for small agencies. It comes with a portal in which each customer sees only what has been shared with them. This tour shows where everything is.',
      },
      metrics: {
        title: 'The overview',
        body: "Four figures show where the agency stands: monthly contract value, active customers, ongoing projects and confirmed contracts. Clicking a figure opens the matching list, already filtered. Everything is calculated from this demo's data.",
      },
      navigation: {
        title: 'The sections',
        body: 'The navigation leads to every section:',
      },
      palette: {
        title: 'Jump quickly',
        body: '"Jump to" searches customers, projects, contracts and requests. From the keyboard: ⌘K or Ctrl+K.',
      },
      roles: {
        title: "Through the customer's eyes",
        body: 'Here you switch between the people in this demo: owner, team member or customer in the portal. That way you see for yourself what a customer gets to see and what stays internal.',
      },
      done: {
        title: 'Now try it yourself',
        body: 'Create customers, change contracts or write a request as a customer. The demo belongs to you alone and is deleted afterwards. You can restart the tour here at any time.',
      },
    },
    sections: {
      customers: 'Companies with contact person, contact details and internal notes.',
      projects: 'Ongoing work with milestones. Progress follows from the completed ones.',
      contracts: 'Monthly service contracts. A price change applies from its date.',
      requests: 'Customer requests from the portal, with history and internal comments.',
      documents: 'PDFs for customers and projects. Internal until you share them.',
      settings: 'Invite team members and customers, assign roles.',
    },
  },
});
