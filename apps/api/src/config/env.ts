import { z } from 'zod';

/**
 * Umgebungsvariablen werden beim Start einmal validiert. Ein fehlender oder
 * unbrauchbarer Wert bricht den Start ab, statt später einen Request
 * fehlschlagen zu lassen.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL fehlt'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET muss mindestens 32 Zeichen haben')
    .refine((value) => !value.startsWith('bitte-ersetzen'), {
      message: 'SESSION_SECRET ist noch der Platzhalter aus .env.example',
    }),
  APP_ORIGIN: z.url('APP_ORIGIN muss eine vollständige URL sein'),
  /** Anzahl vertrauenswürdiger Proxy-Hops. Lokal 0, hinter genau einem Caddy 1. */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  /** Anmeldeversuche je IP und Zeitfenster. Klein halten, aber testbar. */
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(5),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .default(15 * 60 * 1000),
  S3_ENDPOINT: z.url('S3_ENDPOINT muss eine vollständige URL sein'),
  S3_REGION: z.string().min(1).default('eu-central-1'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  DEMO_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (parsed.success) return parsed.data;

  const details = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Konfiguration ungültig:\n${details}`);
}

export function isProduction(env: Env): boolean {
  return env.NODE_ENV === 'production';
}
