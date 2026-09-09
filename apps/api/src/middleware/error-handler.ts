import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { ApiError } from '@clientdesk/contracts';
import { HttpError, type FieldErrors } from '../lib/http-error.ts';

function fieldErrorsFromZod(error: ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '(root)';
    (result[path] ??= []).push(issue.message);
  }
  return result;
}

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiError = {
    error: { code: 'NOT_FOUND', message: 'Route nicht gefunden.', requestId: _req.requestId },
  };
  res.status(404).json(body);
}

/**
 * Letzte Station. Antworten enthalten niemals SQL-Details oder Stacktraces —
 * unerwartete Fehler werden geloggt und als INTERNAL ausgegeben.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  // body-parser wirft bei überschrittener Grösse oder unlesbarem Body einen
  // eigenen Fehler. Ohne Zuordnung landete er als INTERNAL — ein Serverfehler
  // für etwas, das der Aufrufer falsch gemacht hat.
  const parserType = (error as { type?: string } | null)?.type;
  if (parserType === 'entity.too.large') {
    respond(res, req, 'VALIDATION_FAILED', 413, 'Die Datei ist zu gross.', {
      file: ['Grössengrenze überschritten'],
    });
    return;
  }
  if (parserType === 'entity.parse.failed' || parserType === 'encoding.unsupported') {
    respond(res, req, 'VALIDATION_FAILED', 422, 'Der Anfrageinhalt ist unlesbar.', undefined);
    return;
  }

  if (error instanceof ZodError) {
    respond(res, req, 'VALIDATION_FAILED', 422, 'Eingabe ungültig.', fieldErrorsFromZod(error));
    return;
  }

  if (error instanceof HttpError) {
    if (error.status >= 500) req.log.error({ err: error }, 'Serverfehler');
    respond(res, req, error.code, error.status, error.message, error.fieldErrors);
    return;
  }

  req.log.error({ err: error }, 'Unbehandelter Fehler');
  respond(res, req, 'INTERNAL', 500, 'Unerwarteter Serverfehler.', undefined);
}

function respond(
  res: Response,
  req: Request,
  code: ApiError['error']['code'],
  status: number,
  message: string,
  fieldErrors: FieldErrors | undefined,
): void {
  const body: ApiError = {
    error: { code, message, requestId: req.requestId, ...(fieldErrors ? { fieldErrors } : {}) },
  };
  res.status(status).json(body);
}
