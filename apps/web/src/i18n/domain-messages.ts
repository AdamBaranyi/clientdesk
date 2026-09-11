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
