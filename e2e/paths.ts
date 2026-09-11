export const AUTH_DIR = 'e2e/.auth';
export const STATE_FILE = `${AUTH_DIR}/state.json`;
export const WORKSPACE_FILE = `${AUTH_DIR}/workspace.json`;

/** Zweiter Zugang: der Lastdaten-Workspace für die Messungen. */
export const LOAD_STATE_FILE = `${AUTH_DIR}/load-state.json`;
export const LOAD_WORKSPACE_FILE = `${AUTH_DIR}/load-workspace.json`;

export const LOAD_ZUGANG = {
  email: 'last@tallyroom.test',
  passwort: 'Lastdaten-Passwort-2026',
};

/** Vermerk «Rundgang gesehen», wie `TOUR_STORAGE_KEY` in apps/web/src/features/tour/tour-state.ts. */
export const TOUR_KEY = 'tallyroom.tour';
