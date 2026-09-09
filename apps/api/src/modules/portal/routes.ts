import { Router } from 'express';
import { z } from 'zod';
import {
  ALLOWED_DOCUMENT_MIME,
  clientRequestInputSchema,
  commentInputSchema,
} from '@clientdesk/contracts';
import type { AuthRepository } from '../auth/repository.ts';
import { getPortal, requirePortalClient } from './context.ts';
import type { PortalService } from './service.ts';

const idSchema = z.uuid();
const idempotencyKeySchema = z.string().trim().min(8).max(200);

/** Der Kunde kommentiert öffentlich; eine Sichtbarkeit schickt er nicht mit. */
const clientCommentSchema = commentInputSchema.pick({ body: true });

export function createPortalRouter(service: PortalService, authRepository: AuthRepository): Router {
  const router = Router({ mergeParams: true });
  router.use(requirePortalClient(authRepository));

  router.get('/overview', async (req, res) => {
    res.json(await service.overview(getPortal(req)));
  });

  router.get('/projects', async (req, res) => {
    res.json({ data: await service.projects(getPortal(req)) });
  });

  router.get('/contracts', async (req, res) => {
    res.json({ data: await service.contracts(getPortal(req)) });
  });

  router.get('/requests', async (req, res) => {
    res.json({ data: await service.requests(getPortal(req)) });
  });

  router.get('/requests/assignable-projects', async (req, res) => {
    res.json({ data: await service.assignableProjects(getPortal(req)) });
  });

  router.post('/requests', async (req, res) => {
    const input = clientRequestInputSchema.parse(req.body);
    const parsedKey = idempotencyKeySchema.safeParse(req.get('idempotency-key'));
    const created = await service.createRequest(
      getPortal(req),
      input,
      parsedKey.success ? parsedKey.data : undefined,
    );
    res.status(201).json(created);
  });

  router.get('/requests/:requestId', async (req, res) => {
    const requestId = idSchema.parse(req.params.requestId);
    res.json(await service.request(getPortal(req), requestId));
  });

  router.post('/requests/:requestId/comments', async (req, res) => {
    const requestId = idSchema.parse(req.params.requestId);
    const { body } = clientCommentSchema.parse(req.body);
    res.status(201).json(await service.addComment(getPortal(req), requestId, body));
  });

  router.get('/documents', async (req, res) => {
    res.json({ data: await service.documents(getPortal(req)) });
  });

  router.get('/documents/:documentId/download', async (req, res) => {
    const documentId = idSchema.parse(req.params.documentId);
    const { originalName, bytes } = await service.downloadDocument(getPortal(req), documentId);

    res.setHeader('Content-Type', ALLOWED_DOCUMENT_MIME);
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`,
    );
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.end(Buffer.from(bytes));
  });

  return router;
}
