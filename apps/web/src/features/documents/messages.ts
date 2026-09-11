import { defineMessages } from '../../i18n/messages.ts';

export const documentMessages = defineMessages({
  de: {
    title: 'Dokumente',
    leadDemo:
      'In der Demo werden keine eigenen Dateien angenommen. Das enthaltene Beispieldokument zeigt den Ablauf.',
    lead: (maxMib: number) =>
      `PDF bis ${maxMib} MiB. Neu hochgeladene Dateien sind intern, bis sie ausdrücklich freigegeben werden.`,
    creating: 'Wird angelegt …',
    createSample: 'Beispieldokument anlegen',
    uploading: 'Wird hochgeladen …',
    upload: 'PDF hochladen',
    chooseFile: 'PDF-Datei auswählen',
    uploadFailed: 'Der Upload ist fehlgeschlagen. Bitte erneut versuchen.',
    customer: 'Kunde',
    allCustomers: 'Alle Kunden',
    uploadTarget: (customerName: string) =>
      `Hochgeladen wird für ${customerName}. Zum Wechseln zuerst den Kunden wählen.`,
    loading: 'Dokumente werden geladen …',
    loadFailed: 'Die Dokumentenliste konnte nicht geladen werden. Bitte Seite neu laden.',
    empty: 'Noch keine Dokumente',
    emptyNoCustomers: 'Ein Dokument gehört immer zu einem Kunden. Lege zuerst einen Kunden an.',
    emptyDetail:
      'Hochgeladene PDF liegen zuerst intern. Erst eine Freigabe zeigt sie im Kundenportal.',
    visibleInPortal: 'Im Portal sichtbar',
    internalOnly: 'Nur intern',
    open: 'Öffnen',
    stopSharing: 'Freigabe zurücknehmen',
    share: 'Für Kunden freigeben',
    delete: (fileName: string) => `${fileName} löschen`,
  },
  fr: {
    title: 'Documents',
    leadDemo:
      "La démo n'accepte pas vos propres fichiers. Le document d'exemple inclus montre le déroulement.",
    lead: (maxMib: number) =>
      `PDF jusqu'à ${maxMib} Mio. Les fichiers téléversés restent internes jusqu'à ce qu'ils soient explicitement partagés.`,
    creating: 'Création …',
    createSample: "Créer un document d'exemple",
    uploading: 'Téléversement …',
    upload: 'Téléverser un PDF',
    chooseFile: 'Choisir un fichier PDF',
    uploadFailed: 'Le téléversement a échoué. Veuillez réessayer.',
    customer: 'Client',
    allCustomers: 'Tous les clients',
    uploadTarget: (customerName: string) =>
      `Le fichier est téléversé pour ${customerName}. Pour changer, choisissez d'abord le client.`,
    loading: 'Chargement des documents …',
    loadFailed: "La liste des documents n'a pas pu être chargée. Veuillez recharger la page.",
    empty: "Aucun document pour l'instant",
    emptyNoCustomers: "Un document appartient toujours à un client. Créez d'abord un client.",
    emptyDetail:
      "Les PDF téléversés restent d'abord internes. Ils n'apparaissent dans le portail client qu'après un partage.",
    visibleInPortal: 'Visible dans le portail',
    internalOnly: 'Interne uniquement',
    open: 'Ouvrir',
    stopSharing: 'Retirer le partage',
    share: 'Partager avec le client',
    delete: (fileName: string) => `Supprimer ${fileName}`,
  },
  it: {
    title: 'Documenti',
    leadDemo:
      'La demo non accetta file propri. Il documento di esempio incluso mostra la procedura.',
    lead: (maxMib: number) =>
      `PDF fino a ${maxMib} MiB. I file caricati restano interni finché non vengono condivisi esplicitamente.`,
    creating: 'Creazione …',
    createSample: 'Crea documento di esempio',
    uploading: 'Caricamento del file …',
    upload: 'Carica PDF',
    chooseFile: 'Scegli un file PDF',
    uploadFailed: 'Il caricamento non è riuscito. Riprovi.',
    customer: 'Cliente',
    allCustomers: 'Tutti i clienti',
    uploadTarget: (customerName: string) =>
      `Il file viene caricato per ${customerName}. Per cambiare, scelga prima il cliente.`,
    loading: 'Caricamento dei documenti …',
    loadFailed: "Non è stato possibile caricare l'elenco dei documenti. Ricarichi la pagina.",
    empty: 'Ancora nessun documento',
    emptyNoCustomers: 'Un documento appartiene sempre a un cliente. Crei prima un cliente.',
    emptyDetail:
      'I PDF caricati restano inizialmente interni. Compaiono nel portale clienti solo dopo una condivisione.',
    visibleInPortal: 'Visibile nel portale',
    internalOnly: 'Solo interno',
    open: 'Apri',
    stopSharing: 'Annulla la condivisione',
    share: 'Condividi con il cliente',
    delete: (fileName: string) => `Elimina ${fileName}`,
  },
  en: {
    title: 'Documents',
    leadDemo:
      'The demo does not accept your own files. The included sample document shows how it works.',
    lead: (maxMib: number) =>
      `PDF up to ${maxMib} MiB. Newly uploaded files stay internal until they are explicitly shared with the customer.`,
    creating: 'Creating …',
    createSample: 'Create sample document',
    uploading: 'Uploading …',
    upload: 'Upload PDF',
    chooseFile: 'Choose a PDF file',
    uploadFailed: 'The upload failed. Please try again.',
    customer: 'Customer',
    allCustomers: 'All customers',
    uploadTarget: (customerName: string) =>
      `Files are uploaded for ${customerName}. To switch, choose the customer first.`,
    loading: 'Loading documents …',
    loadFailed: 'The document list could not be loaded. Please reload the page.',
    empty: 'No documents yet',
    emptyNoCustomers: 'A document always belongs to a customer. Create a customer first.',
    emptyDetail:
      'Uploaded PDFs stay internal at first. They only appear in the client portal once shared.',
    visibleInPortal: 'Visible in the portal',
    internalOnly: 'Internal only',
    open: 'Open',
    stopSharing: 'Stop sharing',
    share: 'Share with the customer',
    delete: (fileName: string) => `Delete ${fileName}`,
  },
});
