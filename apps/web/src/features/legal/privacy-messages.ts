import { defineMessages } from '../../i18n/messages.ts';

/**
 * Jede Aussage hier ist am laufenden Aufbau geprüft, nicht angenommen: was im
 * Log steht, wann das Cookie entsteht, wie lange eine Adresse im Speicher
 * bleibt. Ändert sich eines davon im Code, muss es hier in jeder Sprache
 * nachgezogen werden.
 */
export const privacyMessages = defineMessages({
  de: {
    title: 'Datenschutzerklärung',
    intro: (date: string) =>
      `Stand: ${date}. Diese Erklärung sagt, welche Personendaten beim Besuch und bei der Nutzung anfallen, wozu und wie lange. Sie ist kurz, weil wenig anfällt.`,
    date: '11. September 2026',
    responsible: 'Verantwortlich',
    whereTitle: 'Wo die Daten liegen',
    where:
      'Die Seite läuft auf einem Server der FSIT AG in deren Rechenzentren in der Schweiz. Webserver, Anwendung, Datenbank und Dateispeicher laufen alle auf diesem einen Server. Es werden keine Daten ins Ausland übermittelt, und kein weiterer Dienst ist eingebunden.',
    visitTitle: 'Beim Aufruf der Seite',
    visitAddress:
      'Ihr Browser übermittelt Ihre IP-Adresse, ohne sie kommt keine Verbindung zustande. Gespeichert wird sie nicht: Weder der Webserver noch die Anwendung schreibt sie in ein Protokoll. Um Anmeldeversuche und Demo-Starts zu begrenzen, hält die Anwendung sie im Arbeitsspeicher, solange ein Zeitfenster von 15 Minuten läuft, und verwirft sie spätestens eine Minute danach.',
    visitLog:
      'Protokolliert werden je Anfrage nur Zeitpunkt, Methode, Pfad, Status und Dauer, ohne IP-Adresse, ohne Browserkennung und ohne Suchbegriffe. Die Protokolle haben eine feste Höchstgrösse, ältere Einträge werden überschrieben.',
    cookieTitle: 'Cookie und lokaler Speicher',
    cookieBefore: 'Es gibt ein einziges Cookie,',
    cookieAfter:
      '. Es entsteht erst, wenn Sie sich anmelden oder die Demo starten, und enthält nur eine zufällige Kennung Ihrer Sitzung. Es ist technisch notwendig und wird nach zwei Stunden ohne Aktivität ungültig, spätestens nach zwölf Stunden.',
    localStorage:
      'Ihre Wahl von Sprache und Erscheinungsbild speichert der Browser lokal. Sie verlässt Ihr Gerät nicht.',
    demoTitle: 'Die Demo',
    demo: (minutes: number) =>
      `Beim Start entsteht ein eigener Arbeitsbereich mit erfundenen Firmen, Personen und Zahlen. Nach ${minutes} Minuten wird er gelöscht, samt allem, was Sie darin eingegeben haben, Ihrer Sitzung und den Dateien. Eigene Dateien nimmt die Demo nicht an. Bitte geben Sie in der Demo keine echten Personendaten ein.`,
    accountsTitle: 'Konten',
    accounts:
      'Ausserhalb der Demo entstehen Konten nur auf Einladung. Gespeichert werden Name, E-Mail-Adresse, das Passwort als nicht umkehrbarer Hash und die Zugehörigkeit zu Arbeitsbereichen, dazu die Inhalte und Dokumente, die dort angelegt werden. Zweck ist allein der Betrieb der Anwendung. Die Daten bleiben, bis das Konto gelöscht wird, und das geschieht auf Anfrage.',
    notTitle: 'Was es nicht gibt',
    not: 'Keine Analyse- oder Statistikdienste, keine Werbung, keine eingebetteten Inhalte Dritter, keine Schriften von fremden Servern und keine Weitergabe an Dritte.',
    backupTitle: 'Datensicherung',
    backup:
      'Der Anbieter sichert den Server wöchentlich, nach seinen Angaben ebenfalls in der Schweiz. Eine Sicherung enthält den Stand zum Zeitpunkt der Sicherung, also auch die Daten einer gerade laufenden Demo.',
    rightsTitle: 'Ihre Rechte',
    rights:
      'Sie können Auskunft über Ihre Daten verlangen, ihre Berichtigung oder Löschung, und der Bearbeitung widersprechen.',
    contactByEmail: 'Eine E-Mail an',
    contactByEmailEnd: 'genügt.',
    contactByImprint: 'Eine Nachricht an die Adresse im',
    contactByImprintLink: 'Impressum',
    contactByImprintEnd: 'genügt.',
    complaint:
      'Beschwerden können Sie an den Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) richten.',
  },
  fr: {
    title: 'Déclaration de protection des données',
    intro: (date: string) =>
      `État\u00a0: ${date}. Cette déclaration indique quelles données personnelles sont traitées lors de la visite et de l'utilisation, dans quel but et pendant combien de temps. Elle est courte, car peu de données sont traitées.`,
    date: '11 septembre 2026',
    responsible: 'Responsable',
    whereTitle: 'Où se trouvent les données',
    where:
      "Le site fonctionne sur un serveur de FSIT AG, dans ses centres de données en Suisse. Serveur web, application, base de données et stockage des fichiers fonctionnent tous sur ce seul serveur. Aucune donnée n'est transmise à l'étranger et aucun autre service n'est intégré.",
    visitTitle: 'Lors de la visite du site',
    visitAddress:
      "Votre navigateur transmet votre adresse IP\u00a0; sans elle, aucune connexion n'est possible. Elle n'est pas enregistrée\u00a0: ni le serveur web ni l'application ne l'inscrivent dans un journal. Pour limiter les tentatives de connexion et les démarrages de la démo, l'application la garde en mémoire vive pendant une fenêtre de 15 minutes et l'efface au plus tard une minute après.",
    visitLog:
      "Pour chaque requête, seuls l'heure, la méthode, le chemin, le statut et la durée sont journalisés, sans adresse IP, sans identification du navigateur et sans termes de recherche. Les journaux ont une taille maximale fixe\u00a0; les entrées plus anciennes sont écrasées.",
    cookieTitle: 'Cookie et stockage local',
    cookieBefore: 'Il existe un seul cookie,',
    cookieAfter:
      ". Il n'est créé que lorsque vous vous connectez ou démarrez la démo, et ne contient qu'un identifiant aléatoire de votre session. Il est techniquement nécessaire et expire après deux heures d'inactivité, au plus tard après douze heures.",
    localStorage:
      "Votre navigateur enregistre localement votre choix de langue et d'apparence. Il ne quitte pas votre appareil.",
    demoTitle: 'La démo',
    demo: (minutes: number) =>
      `Au démarrage, un espace de travail distinct est créé avec des entreprises, des personnes et des chiffres fictifs. Il est supprimé après ${minutes} minutes, avec tout ce que vous y avez saisi, votre session et les fichiers. La démo n'accepte pas vos propres fichiers. Veuillez ne pas y saisir de données personnelles réelles.`,
    accountsTitle: 'Comptes',
    accounts:
      "En dehors de la démo, les comptes ne sont créés que sur invitation. Sont enregistrés le nom, l'adresse e-mail, le mot de passe sous forme de hachage irréversible et l'appartenance aux espaces de travail, ainsi que les contenus et documents qui y sont créés. Le seul but est l'exploitation de l'application. Les données sont conservées jusqu'à la suppression du compte, qui a lieu sur demande.",
    notTitle: "Ce qu'il n'y a pas",
    not: "Aucun service d'analyse ou de statistiques, aucune publicité, aucun contenu tiers intégré, aucune police provenant de serveurs externes et aucune transmission à des tiers.",
    backupTitle: 'Sauvegarde',
    backup:
      "L'hébergeur sauvegarde le serveur chaque semaine, selon ses indications également en Suisse. Une sauvegarde contient l'état au moment de la sauvegarde, y compris les données d'une démo en cours à ce moment-là.",
    rightsTitle: 'Vos droits',
    rights:
      'Vous pouvez demander des renseignements sur vos données, leur rectification ou leur effacement, et vous opposer à leur traitement.',
    contactByEmail: 'Un e-mail à',
    contactByEmailEnd: 'suffit.',
    contactByImprint: "Un message à l'adresse indiquée dans les",
    contactByImprintLink: 'mentions légales',
    contactByImprintEnd: 'suffit.',
    complaint:
      'Les plaintes peuvent être adressées au Préposé fédéral à la protection des données et à la transparence (PFPDT).',
  },
  it: {
    title: 'Informativa sulla protezione dei dati',
    intro: (date: string) =>
      `Stato: ${date}. Questa informativa indica quali dati personali vengono trattati durante la visita e l'uso, a quale scopo e per quanto tempo. È breve perché i dati trattati sono pochi.`,
    date: '11 settembre 2026',
    responsible: 'Responsabile',
    whereTitle: 'Dove si trovano i dati',
    where:
      "Il sito funziona su un server di FSIT AG nei suoi centri di calcolo in Svizzera. Server web, applicazione, banca dati e archivio dei file funzionano tutti su questo unico server. Nessun dato viene trasmesso all'estero e non è integrato alcun altro servizio.",
    visitTitle: 'Alla visita del sito',
    visitAddress:
      "Il Suo browser trasmette il Suo indirizzo IP; senza di esso nessuna connessione è possibile. Non viene salvato: né il server web né l'applicazione lo registrano in un protocollo. Per limitare i tentativi di accesso e gli avvii della demo, l'applicazione lo conserva nella memoria di lavoro finché è in corso una finestra di 15 minuti e lo scarta al più tardi un minuto dopo.",
    visitLog:
      'Per ogni richiesta vengono registrati soltanto ora, metodo, percorso, stato e durata, senza indirizzo IP, senza identificazione del browser e senza termini di ricerca. I protocolli hanno una dimensione massima fissa; le voci più vecchie vengono sovrascritte.',
    cookieTitle: 'Cookie e memoria locale',
    cookieBefore: 'Esiste un solo cookie,',
    cookieAfter:
      '. Viene creato solo quando accede o avvia la demo e contiene soltanto un identificativo casuale della Sua sessione. È tecnicamente necessario e scade dopo due ore di inattività, al più tardi dopo dodici ore.',
    localStorage:
      'Il browser salva localmente la Sua scelta di lingua e di aspetto. Non lascia il Suo dispositivo.',
    demoTitle: 'La demo',
    demo: (minutes: number) =>
      `All'avvio viene creata un'area di lavoro separata con aziende, persone e cifre fittizie. Dopo ${minutes} minuti viene eliminata, insieme a tutto ciò che vi ha inserito, alla Sua sessione e ai file. La demo non accetta file propri. La preghiamo di non inserirvi dati personali reali.`,
    accountsTitle: 'Account',
    accounts:
      "Al di fuori della demo gli account vengono creati solo su invito. Vengono salvati il nome, l'indirizzo e-mail, la password come hash irreversibile e l'appartenenza alle aree di lavoro, oltre ai contenuti e ai documenti creati al loro interno. Lo scopo è unicamente il funzionamento dell'applicazione. I dati restano fino all'eliminazione dell'account, che avviene su richiesta.",
    notTitle: "Che cosa non c'è",
    not: 'Nessun servizio di analisi o di statistica, nessuna pubblicità, nessun contenuto di terzi incorporato, nessun carattere da server esterni e nessuna trasmissione a terzi.',
    backupTitle: 'Backup',
    backup:
      "Il fornitore esegue ogni settimana un backup del server, secondo le sue indicazioni anch'esso in Svizzera. Un backup contiene lo stato al momento del salvataggio, compresi i dati di una demo in corso in quel momento.",
    rightsTitle: 'I Suoi diritti',
    rights:
      'Può chiedere informazioni sui Suoi dati, la loro rettifica o cancellazione e opporsi al loro trattamento.',
    contactByEmail: "Un'e-mail a",
    contactByEmailEnd: 'è sufficiente.',
    contactByImprint: "Un messaggio all'indirizzo indicato nelle",
    contactByImprintLink: 'note legali',
    contactByImprintEnd: 'è sufficiente.',
    complaint:
      "I reclami possono essere indirizzati all'Incaricato federale della protezione dei dati e della trasparenza (IFPDT).",
  },
  en: {
    title: 'Privacy policy',
    intro: (date: string) =>
      `Last updated: ${date}. This policy says which personal data arise when you visit and use the site, what for and for how long. It is short because little arises.`,
    date: '11 September 2026',
    responsible: 'Responsible',
    whereTitle: 'Where the data are kept',
    where:
      'The site runs on a server operated by FSIT AG in its data centres in Switzerland. Web server, application, database and file storage all run on this one server. No data are transferred abroad, and no other service is involved.',
    visitTitle: 'When you open the site',
    visitAddress:
      'Your browser transmits your IP address; without it no connection is possible. It is not stored: neither the web server nor the application writes it to a log. To limit sign-in attempts and demo starts, the application keeps it in memory while a 15-minute window is running and discards it at most one minute afterwards.',
    visitLog:
      'For each request, only the time, method, path, status and duration are logged — no IP address, no browser identification and no search terms. The logs have a fixed maximum size; older entries are overwritten.',
    cookieTitle: 'Cookie and local storage',
    cookieBefore: 'There is a single cookie,',
    cookieAfter:
      '. It is only created when you sign in or start the demo, and it contains nothing but a random identifier of your session. It is technically necessary and expires after two hours without activity, after twelve hours at the latest.',
    localStorage:
      'Your browser stores your choice of language and appearance locally. It never leaves your device.',
    demoTitle: 'The demo',
    demo: (minutes: number) =>
      `Starting the demo creates a workspace of your own with fictional companies, people and figures. After ${minutes} minutes it is deleted, together with everything you entered, your session and the files. The demo does not accept your own files. Please do not enter real personal data in the demo.`,
    accountsTitle: 'Accounts',
    accounts:
      'Outside the demo, accounts are created by invitation only. We store the name, email address, the password as an irreversible hash and the membership of workspaces, together with the content and documents created there. The sole purpose is running the application. The data remain until the account is deleted, which happens on request.',
    notTitle: 'What there is not',
    not: 'No analytics or statistics services, no advertising, no embedded third-party content, no fonts from other servers and no disclosure to third parties.',
    backupTitle: 'Backups',
    backup:
      'The hosting provider backs up the server weekly, according to the provider also in Switzerland. A backup contains the state at the time of the backup, including the data of a demo running at that moment.',
    rightsTitle: 'Your rights',
    rights:
      'You can ask for information about your data, for its correction or deletion, and object to its processing.',
    contactByEmail: 'An email to',
    contactByEmailEnd: 'is enough.',
    contactByImprint: 'A message to the address in the',
    contactByImprintLink: 'legal notice',
    contactByImprintEnd: 'is enough.',
    complaint:
      'Complaints can be addressed to the Federal Data Protection and Information Commissioner (FDPIC).',
  },
});
