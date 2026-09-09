import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Database, Pool } from '@clientdesk/db';
import type { Env } from './config/env.ts';
import { createLogger, type Logger } from './lib/logger.ts';
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
import { createHealthRouter } from './modules/health/routes.ts';
import { createMilestoneService } from './modules/projects/milestone-service.ts';
import { createProjectRepository } from './modules/projects/repository.ts';
import { createProjectRouter } from './modules/projects/routes.ts';
import { createProjectService } from './modules/projects/service.ts';
import { createWorkspaceRouter } from './modules/workspaces/routes.ts';

export interface AppDependencies {
  env: Env;
  db: Database;
  pool: Pool;
  logger?: Logger;
}

export function createApp({ env, db, pool, logger }: AppDependencies): Express {
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

  const customerRepository = createCustomerRepository(db);
  const customerService = createCustomerService(db, customerRepository);

  const projectRepository = createProjectRepository(db);
  const projectService = createProjectService(db, projectRepository);
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
