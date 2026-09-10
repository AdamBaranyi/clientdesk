import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Database, Pool } from '@clientdesk/db';
import type { Env } from './config/env.ts';
import { createLogger, type Logger } from './lib/logger.ts';
import { createS3Storage } from './storage/s3.ts';
import type { DocumentStorage } from './storage/types.ts';
import { csrfProtection } from './middleware/csrf.ts';
import { errorHandler, notFoundHandler } from './middleware/error-handler.ts';
import { requestContext } from './middleware/request-context.ts';
import { createSessionMiddleware } from './middleware/session.ts';
import { createAuthRepository } from './modules/auth/repository.ts';
import { createAuthRouter } from './modules/auth/routes.ts';
import { createAuthService } from './modules/auth/service.ts';
import { createCustomerRepository } from './modules/customers/repository.ts';
import { createCustomerRouter } from './modules/customers/routes.ts';
import { createCustomerService } from './modules/customers/service.ts';
import { createContractRepository } from './modules/contracts/repository.ts';
import { createContractRouter } from './modules/contracts/routes.ts';
import { createContractService } from './modules/contracts/service.ts';
import { createDashboardRouter } from './modules/dashboard/routes.ts';
import { createDashboardService } from './modules/dashboard/service.ts';
import { createDemoLimits } from './modules/demo/limits.ts';
import { createDemoRepository } from './modules/demo/repository.ts';
import { createDemoRouter } from './modules/demo/routes.ts';
import { createDemoService } from './modules/demo/service.ts';
import { createDocumentRepository } from './modules/documents/repository.ts';
import { createDocumentRouter } from './modules/documents/routes.ts';
import { createDocumentService } from './modules/documents/service.ts';
import { createHealthRouter } from './modules/health/routes.ts';
import {
  createInvitationAdminRouter,
  createInvitationPublicRouter,
} from './modules/invitations/routes.ts';
import { createInvitationService } from './modules/invitations/service.ts';
import { createPortalRepository } from './modules/portal/repository.ts';
import { createPortalRouter } from './modules/portal/routes.ts';
import { createPortalService } from './modules/portal/service.ts';
import { createRequestRepository } from './modules/requests/repository.ts';
import { createRequestRouter } from './modules/requests/routes.ts';
import { createRequestService } from './modules/requests/service.ts';
import { createMilestoneService } from './modules/projects/milestone-service.ts';
import { createProjectRepository } from './modules/projects/repository.ts';
import { createProjectRouter } from './modules/projects/routes.ts';
import { createProjectService } from './modules/projects/service.ts';
import { createSearchRouter } from './modules/search/routes.ts';
import { createSearchService } from './modules/search/service.ts';
import { createWorkspaceRouter } from './modules/workspaces/routes.ts';

export interface AppDependencies {
  env: Env;
  db: Database;
  pool: Pool;
  logger?: Logger;
  /** Im Test der Speicher im Prozess, sonst der S3-kompatible Objektspeicher. */
  storage?: DocumentStorage;
}

export function createApp({ env, db, pool, logger, storage }: AppDependencies): Express {
  const log = logger ?? createLogger(env);
  const app = express();

  // Muss zur tatsächlichen Infrastruktur passen: lokal 0 Hops, hinter Caddy 1.
  app.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.disable('x-powered-by');

  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }),
  );
  app.use(requestContext(log));
  app.use(pinoHttp({ logger: log, quietReqLogger: true }));
  app.use(express.json({ limit: '256kb' }));
  app.use(createSessionMiddleware(env, pool));
  app.use(csrfProtection(env));

  const authRepository = createAuthRepository(db);
  const authService = createAuthService(authRepository);

  const demoLimits = createDemoLimits(db);

  const customerRepository = createCustomerRepository(db);
  const customerService = createCustomerService(db, customerRepository, demoLimits);

  const contractRepository = createContractRepository(db);
  const contractService = createContractService(db, contractRepository, demoLimits);
  const dashboardService = createDashboardService(db);

  const documentStorage =
    storage ??
    createS3Storage({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    });

  const demoRepository = createDemoRepository(db);
  const demoService = createDemoService(db, demoRepository, documentStorage);

  const requestRepository = createRequestRepository(db);
  const requestService = createRequestService(db, requestRepository, demoLimits);

  const documentRepository = createDocumentRepository(db);
  const documentService = createDocumentService(
    db,
    documentRepository,
    documentStorage,
    demoLimits,
  );

  const invitationService = createInvitationService(db, env.APP_ORIGIN);

  const portalRepository = createPortalRepository(db);
  const portalService = createPortalService(db, portalRepository, documentStorage, demoLimits);

  const projectRepository = createProjectRepository(db);
  const projectService = createProjectService(db, projectRepository, demoLimits);
  const milestoneService = createMilestoneService(db, projectRepository);

  app.use('/api/v1/health', createHealthRouter(pool));
  app.use(
    '/api/v1/auth',
    createAuthRouter(authService, {
      loginRateLimit: {
        windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
        max: env.LOGIN_RATE_LIMIT_MAX,
      },
    }),
  );
  app.use('/api/v1/workspaces', createWorkspaceRouter(authRepository));
  app.use(
    '/api/v1/workspaces/:workspaceId/customers',
    createCustomerRouter(customerService, authRepository),
  );
  app.use(
    '/api/v1/workspaces/:workspaceId/projects',
    createProjectRouter(projectService, milestoneService, authRepository),
  );
  app.use(
    '/api/v1/workspaces/:workspaceId/contracts',
    createContractRouter(contractService, authRepository),
  );
  app.use(
    '/api/v1/workspaces/:workspaceId/dashboard',
    createDashboardRouter(dashboardService, authRepository),
  );
  app.use(
    '/api/v1/workspaces/:workspaceId/search',
    createSearchRouter(createSearchService(db), authRepository),
  );
  app.use(
    '/api/v1/workspaces/:workspaceId/requests',
    createRequestRouter(requestService, authRepository),
  );
  app.use(
    '/api/v1/workspaces/:workspaceId/documents',
    createDocumentRouter(documentService, authRepository),
  );
  app.use(
    '/api/v1/workspaces/:workspaceId/invitations',
    createInvitationAdminRouter(invitationService, authRepository),
  );
  app.use('/api/v1/invitations', createInvitationPublicRouter(invitationService));
  app.use('/api/v1/demo', createDemoRouter(demoService, env));
  app.use('/api/v1/portal/:workspaceId', createPortalRouter(portalService, authRepository));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
