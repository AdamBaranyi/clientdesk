import { hash, verify, type Algorithm } from '@node-rs/argon2';

/**
 * Argon2id. Die Bibliothek liefert den Wert über ein ambient const enum, das
 * sich mit verbatimModuleSyntax nicht importieren lässt — deshalb die
 * benannte Konstante mit satisfies statt eines nackten Zahlenwerts.
 */
const ARGON2ID = 2 satisfies Algorithm;

/**
 * Bewusst gesetzte Parameter statt Bibliotheks-Defaults, damit der
 * Kostenfaktor im Repository nachvollziehbar ist. Die Werte folgen der
 * OWASP-Empfehlung: 19 MiB Speicher, 2 Durchgänge, 1 Nebenläufigkeit.
 *
 * Das Hashing liegt im Datenbankpaket, weil sowohl die API als auch der
 * Admin-Befehl es brauchen und dieses Paket die Anmeldedaten ohnehin speichert.
 */
const OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

/**
 * Gibt false zurück statt zu werfen, wenn der gespeicherte Hash unlesbar ist.
 * Ein kaputter Datensatz darf keinen Serverfehler mit Stacktrace auslösen.
 */
export async function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  try {
    return await verify(storedHash, plain, OPTIONS);
  } catch {
    return false;
  }
}

/** Einzige Normalisierung für Anmeldung, Einladung und Eindeutigkeitsprüfung. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
