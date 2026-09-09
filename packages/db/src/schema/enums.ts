import { pgEnum } from 'drizzle-orm/pg-core';

/** Rollen innerhalb eines Workspace. Client ist immer genau einem Kunden zugeordnet. */
export const membershipRole = pgEnum('membership_role', ['owner', 'member', 'client']);

export const projectStatus = pgEnum('project_status', [
  'planned',
  'active',
  'paused',
  'completed',
  'archived',
]);

export const milestoneStatus = pgEnum('milestone_status', ['open', 'done']);

/** Ein Vertrag zählt erst als bestätigt in die Kennzahlen. */
export const contractConfirmation = pgEnum('contract_confirmation', ['draft', 'confirmed']);

export const requestPriority = pgEnum('request_priority', ['normal', 'high']);

export const requestStatus = pgEnum('request_status', [
  'open',
  'in_progress',
  'waiting_customer',
  'resolved',
]);

/** Interne Kommentare verlassen niemals die Server-Grenze zum Client. */
export const commentVisibility = pgEnum('comment_visibility', ['public', 'internal']);

/**
 * Ein fehlgeschlagenes Löschen im Objektspeicher darf die Sichtbarkeit nicht
 * zurückholen: die Datei ist sofort unsichtbar und bleibt zur Wiederholung offen.
 */
export const documentDeletion = pgEnum('document_deletion', [
  'active',
  'pending_deletion',
  'deleted',
]);
