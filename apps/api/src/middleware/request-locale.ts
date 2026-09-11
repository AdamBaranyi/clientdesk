import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';
import {
  DEFAULT_LOCALE,
  negotiateLocale,
  setLocaleResolver,
  type Locale,
} from '@tallyroom/contracts';

const storage = new AsyncLocalStorage<Locale>();

/**
 * Die Sprache der Meldungen, je Request aus Accept-Language. Die Oberfläche
 * setzt den Header ausdrücklich auf die gewählte Sprache, ohne ihn gilt
 * Deutsch.
 *
 * Gehalten in AsyncLocalStorage statt als Parameter: Fehler entstehen tief in
 * Services und Schemas, und jede Funktion bis dorthin müsste die Sprache
 * sonst nur durchreichen. Ausserhalb eines Requests, etwa im Aufräumlauf,
 * gilt die Vorgabe.
 */
export function requestLocale() {
  setLocaleResolver(() => storage.getStore() ?? DEFAULT_LOCALE);

  return (req: Request, res: Response, next: NextFunction): void => {
    const locale = negotiateLocale((req.get('accept-language') ?? '').split(','));
    res.setHeader('Content-Language', locale);
    res.vary('Accept-Language');
    storage.run(locale, next);
  };
}
