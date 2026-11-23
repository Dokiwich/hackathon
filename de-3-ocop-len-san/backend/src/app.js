import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { parseCorsOrigins, parseEnv } from './config/env.js';
import { createDbClient } from './db/client.js';
import { registerErrorHandlers } from './middleware/errorHandler.js';
import { registerRequestIdHook } from './middleware/requestId.js';
import { registerModules } from './modules/index.js';

export async function buildApp(customEnv) {
  const env = customEnv || parseEnv();
  const isProd = env.NODE_ENV === 'production';

  const app = Fastify({
    logger:
      env.NODE_ENV === 'test'
        ? false
        : {
            level: isProd ? 'info' : 'debug',
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.jwtSecret'],
              censor: '[REDACTED]'
            }
          },
    genReqId: () => randomUUID()
  });

  const allowedOrigins = new Set(parseCorsOrigins(env.CORS_ORIGINS));

  await app.register(helmet);
  await app.register(cors, {
    origin(origin, cb) {
      if (!origin || allowedOrigins.has(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Origin not allowed by CORS'), false);
      }
    }
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: '1 minute'
  });

  registerRequestIdHook(app);
  registerErrorHandlers(app, { isProd });

  const db = createDbClient({ databaseUrl: env.DATABASE_URL });
  app.addHook('onClose', async () => {
    await db.close();
  });

  await registerModules(app, {
    env,
    db,
    serviceName: 'ocop-dong-nai-api'
  });

  return app;
}
