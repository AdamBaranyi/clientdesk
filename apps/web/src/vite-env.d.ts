/// <reference types="vite/client" />

/**
 * Kontaktangaben für Impressum und Datenschutz. Sie stehen nicht im
 * Repository, sondern kommen beim Bauen aus der Umgebung: lokal aus der
 * .env im Wurzelverzeichnis, auf dem Server aus infra/.env.production.
 */
interface ImportMetaEnv {
  readonly VITE_OPERATOR_STREET?: string;
  readonly VITE_OPERATOR_CITY?: string;
  readonly VITE_OPERATOR_EMAIL?: string;
  readonly VITE_OPERATOR_PHONE?: string;
}
