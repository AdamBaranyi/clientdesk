import { randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../client.ts';
import { sessions } from '../schema/sessions.ts';
import { users } from '../schema/users.ts';
import { hashPassword, normalizeEmail } from './password.ts';

export interface PasswordReset {
  password: string;
  endedSessions: number;
}

/**
 * Der Weg für ein vergessenes Passwort. Ohne Mailversand gibt es keinen Link
 * zum Zurücksetzen; der Betreiber setzt ein neues Passwort über die
 * Kommandozeile und gibt es weiter.
 *
 * Das Passwort entsteht hier, zufällig und 24 Zeichen lang, nie als
 * Argument — sonst stünde es in der Shell-Historie des Servers. Jede
 * Sitzung des Kontos endet, auch eine, die ein Unbefugter vielleicht hält.
 */
export async function resetPassword(db: Database, email: string): Promise<PasswordReset> {
  const normalized = normalizeEmail(email);
  const password = randomBytes(18).toString('base64url');
  const passwordHash = await hashPassword(password);

  return db.transaction(async (tx) => {
    const [user] = await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.normalizedEmail, normalized))
      .returning({ id: users.id });
    if (!user) throw new Error(`Kein Konto mit der Adresse ${normalized}.`);

    const ended = await tx
      .delete(sessions)
      .where(eq(sql`${sessions.sess}->>'userId'`, user.id))
      .returning({ sid: sessions.sid });
    return { password, endedSessions: ended.length };
  });
}
