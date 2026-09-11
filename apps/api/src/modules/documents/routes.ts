import { Router, raw } from 'express';
import { z } from 'zod';
import {
  ALLOWED_DOCUMENT_MIME,
  documentListQuerySchema,
  documentVisibilitySchema,
  MAX_DOCUMENT_BYTES,
} from '@tallyroom/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import {
  getWorkspace,
  requireAuth,
  requireInternal,
  requireWorkspace,
} from '../workspaces/context.ts';
import type { DocumentService } from './service.ts';

const idSchema = z.uuid();

const uploadQuerySchema = z.object({
  customerId: z.uuid(),
  projectId: z.uuid().optional(),
  filename: z.string().trim().min(1).max(300),
});

export function createDocumentRouter(
  service: DocumentService,
  authRepository: AuthRepository,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuth, requireWorkspace(authRepository), requireInternal);

  router.get('/', async (req, res) => {
    const query = documentListQuerySchema.parse(req.query);
    const { workspaceId } = getWorkspace(req);
    res.json({ data: await service.list(workspaceId, query) });
  });

  router.post(
    '/',
    // Rohes PDF im Body statt Multipart: eine Abhängigkeit weniger, und die
    // Grenze greift, bevor Daten im Speicher landen.
    raw({ type: ALLOWED_DOCUMENT_MIME, limit: MAX_DOCUMENT_BYTES }),
    async (req, res) => {
      const query = uploadQuerySchema.parse(req.query);
      const { workspaceId, userId } = getWorkspace(req);
      const body = Buffer.isBuffer(req.body) ? new Uint8Array(req.body) : new Uint8Array();

      const created = await service.upload(workspaceId, userId, {
        customerId: query.customerId,
        projectId: query.projectId,
        fileName: query.filename,
        contentType: req.get('content-type')?.split(';')[0]?.trim(),
        bytes: body,
      });
      res.status(201).json(created);
    },
  );

  /** Nur in der Demo sinnvoll, aber überall erlaubt — es legt nichts Fremdes ab. */
  router.post('/sample', async (req, res) => {
    const { customerId } = z.object({ customerId: z.uuid() }).parse(req.query);
    const { workspaceId, userId } = getWorkspace(req);
    res.status(201).json(await service.addSample(workspaceId, userId, customerId));
  });

  router.get('/:documentId', async (req, res) => {
    const documentId = idSchema.parse(req.params.documentId);
    const { workspaceId } = getWorkspace(req);
    res.json(await service.get(workspaceId, documentId));
  });

  /**
   * Der Download antwortet immer als Anhang und mit einer Richtlinie, die
   * jede Ausführung im Dokument unterbindet. Ein PDF kann aktive Inhalte
   * enthalten; sie sollen weder im Browser noch im Ursprung der Anwendung laufen.
   */
  router.get('/:documentId/download', async (req, res) => {
    const documentId = idSchema.parse(req.params.documentId);
    const { workspaceId } = getWorkspace(req);
    const { document, bytes } = await service.read(workspaceId, documentId);

    res.setHeader('Content-Type', ALLOWED_DOCUMENT_MIME);
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
    );
    // Kein Einbetten, keine Ausführung, kein Erraten des Typs.
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.end(Buffer.from(bytes));
  });

  router.patch('/:documentId/visibility', async (req, res) => {
    const documentId = idSchema.parse(req.params.documentId);
    const { clientVisible } = documentVisibilitySchema.parse(req.body);
    const { workspaceId, userId } = getWorkspace(req);
    res.json(await service.setVisibility(workspaceId, userId, documentId, clientVisible));
  });

  router.delete('/:documentId', async (req, res) => {
    const documentId = idSchema.parse(req.params.documentId);
    const { workspaceId, userId } = getWorkspace(req);
    await service.remove(workspaceId, userId, documentId);
    res.status(204).end();
  });

  return router;
}
