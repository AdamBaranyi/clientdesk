import { defineMessages } from './messages.ts';

/**
 * Begriffe, die in mehreren Bereichen vorkommen: Zustände, Prioritäten,
 * Rollen. Sie stehen einmal hier, damit „In Arbeit" in der Liste, im Detail
 * und im Kundenportal dasselbe Wort bleibt — in jeder Sprache.
 */
export const domainMessages = defineMessages({
  de: {
    requestStatus: {
      open: 'Offen',
      in_progress: 'In Arbeit',
      waiting_customer: 'Wartet auf Kunde',
      resolved: 'Erledigt',
    },
    requestPriority: { normal: 'Normal', high: 'Hoch' },
    contractStatus: { draft: 'Entwurf', planned: 'Geplant', active: 'Aktiv', ended: 'Beendet' },
    projectStatus: {
      planned: 'Geplant',
      active: 'Aktiv',
      paused: 'Pausiert',
      completed: 'Abgeschlossen',
      archived: 'Archiviert',
    },
    role: { owner: 'Owner', member: 'Mitglied', client: 'Kundenzugang' },
  },
  fr: {
    requestStatus: {
      open: 'Ouverte',
      in_progress: 'En cours',
      waiting_customer: 'En attente du client',
      resolved: 'Résolue',
    },
    requestPriority: { normal: 'Normale', high: 'Haute' },
    contractStatus: { draft: 'Brouillon', planned: 'Planifié', active: 'Actif', ended: 'Terminé' },
    projectStatus: {
      planned: 'Planifié',
      active: 'Actif',
      paused: 'En pause',
      completed: 'Terminé',
      archived: 'Archivé',
    },
    role: { owner: 'Propriétaire', member: 'Membre', client: 'Accès client' },
  },
  it: {
    requestStatus: {
      open: 'Aperta',
      in_progress: 'In corso',
      waiting_customer: 'In attesa del cliente',
      resolved: 'Risolta',
    },
    requestPriority: { normal: 'Normale', high: 'Alta' },
    contractStatus: {
      draft: 'Bozza',
      planned: 'Pianificato',
      active: 'Attivo',
      ended: 'Terminato',
    },
    projectStatus: {
      planned: 'Pianificato',
      active: 'Attivo',
      paused: 'In pausa',
      completed: 'Completato',
      archived: 'Archiviato',
    },
    role: { owner: 'Proprietario', member: 'Membro', client: 'Accesso cliente' },
  },
  en: {
    requestStatus: {
      open: 'Open',
      in_progress: 'In progress',
      waiting_customer: 'Waiting for customer',
      resolved: 'Resolved',
    },
    requestPriority: { normal: 'Normal', high: 'High' },
    contractStatus: { draft: 'Draft', planned: 'Planned', active: 'Active', ended: 'Ended' },
    projectStatus: {
      planned: 'Planned',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      archived: 'Archived',
    },
    role: { owner: 'Owner', member: 'Member', client: 'Client login' },
  },
});
