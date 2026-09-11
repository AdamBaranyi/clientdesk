/**
 * Wer die Seite betreibt. Steht an genau einer Stelle, weil Impressum,
 * Datenschutzerklärung und Fusszeile darauf verweisen.
 *
 * Der Name steht im Repository, Anschrift und Kontakt nicht: das Repository
 * ist öffentlich, und seine Historie bleibt, auch nach einem Umzug oder einer
 * neuen Nummer. Die Werte kommen beim Bauen aus der Umgebung, siehe
 * vite-env.d.ts. Das Produktions-Image bricht ab, wenn sie fehlen.
 */
export const OPERATOR = {
  name: 'Adam Baranyi',
  street: import.meta.env.VITE_OPERATOR_STREET ?? '',
  postalCodeAndCity: import.meta.env.VITE_OPERATOR_CITY ?? '',
  country: 'Schweiz',
  email: import.meta.env.VITE_OPERATOR_EMAIL ?? '',
  /** Freiwillig. Fehlt sie, steht im Impressum keine Nummer. */
  phone: import.meta.env.VITE_OPERATOR_PHONE ?? '',
};

/** Stand der Datenschutzerklärung. Bei jeder inhaltlichen Änderung nachführen. */
export const PRIVACY_NOTICE_DATE = '11. September 2026';
