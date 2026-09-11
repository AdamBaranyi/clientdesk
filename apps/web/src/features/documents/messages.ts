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
