import { ALLOWED_DOCUMENT_MIME, MAX_DOCUMENT_BYTES } from '@clientdesk/contracts';
import { validationFailed } from '../../lib/http-error.ts';

/** %PDF- als Bytefolge. Jede gültige PDF-Datei beginnt damit. */
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

export function looksLikePdf(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_MAGIC.length) return false;
  return PDF_MAGIC.every((byte, index) => bytes[index] === byte);
}

/**
 * Prüft Typ, tatsächliches Format und Grösse serverseitig. Der vom Aufrufer
 * angegebene Content-Type allein ist keine Aussage über den Inhalt — deshalb
 * wird zusätzlich der Dateianfang gelesen.
 */
export function assertAcceptablePdf(bytes: Uint8Array, declaredType: string | undefined): void {
  if (declaredType !== ALLOWED_DOCUMENT_MIME) {
    throw validationFailed('Nur PDF-Dateien sind erlaubt.', {
      file: [`Content-Type muss ${ALLOWED_DOCUMENT_MIME} sein`],
    });
  }
  if (bytes.length === 0) {
    throw validationFailed('Die Datei ist leer.', { file: ['Keine Daten empfangen'] });
  }
  if (bytes.length > MAX_DOCUMENT_BYTES) {
    throw validationFailed('Die Datei ist zu gross.', {
      file: [`Höchstens ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MiB`],
    });
  }
  if (!looksLikePdf(bytes)) {
    // Eine als PDF deklarierte Datei, die keine ist — hier endet der Versuch.
    throw validationFailed('Der Dateiinhalt ist kein PDF.', {
      file: ['Dateianfang entspricht keinem PDF'],
    });
  }
}

function isPrintable(character: string): boolean {
  const code = character.codePointAt(0) ?? 0;
  // Steuerzeichen und das Löschzeichen fallen weg; sie hätten im
  // Download-Header nichts zu suchen.
  return code >= 0x20 && code !== 0x7f;
}

/**
 * Der Originalname ist reines Metadatum und wird nie zum Objektschlüssel.
 * Pfadanteile und Steuerzeichen werden entfernt, damit er sich weder im
 * Speicher noch in einem Antwort-Header auswirken kann.
 */
export function sanitizeFileName(raw: string): string {
  const withoutPath = raw.split(/[/\\]/).pop() ?? '';
  const cleaned = [...withoutPath]
    .filter(isPrintable)
    .join('')
    .replace(/"/g, '')
    .trim()
    .slice(0, 200);
  return cleaned === '' ? 'dokument.pdf' : cleaned;
}
