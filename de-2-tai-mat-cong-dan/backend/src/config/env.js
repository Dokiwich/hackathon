import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().min(1).default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4002),
    API_PREFIX: z.string().startsWith('/').default('/api/v1'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176'),
    RATE_LIMIT_MAX: z.coerce.number().int().min(10).max(10000).default(120),
    DATABASE_URL: z.string().optional().default(''),
    JWT_SECRET: z.string().optional().default('')
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.DATABASE_URL.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL is required in production'
        });
      }
      if (data.JWT_SECRET.trim().length < 32 || data.JWT_SECRET.startsWith('dev-only')) {
        ctx.addIssue({
          code: 'custom',
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET must be at least 32 non-default characters in production'
        });
      }
    }
  });

export function parseEnv(rawEnv = process.env) {
  return envSchema.parse(rawEnv);
}

export function parseCorsOrigins(originsCsv) {
  return String(originsCsv || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
