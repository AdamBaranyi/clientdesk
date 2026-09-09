import { defineConfig } from 'drizzle-kit';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL fehlt. Siehe .env.example im Projektwurzelverzeichnis.');
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: { url: connectionString },
  strict: true,
  verbose: true,
});
