import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnv } from '../config/loadDotEnv.js';
import { createDbClient } from './client.js';

loadDotEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(__dirname, '../../db/seed.sql');

const databaseUrl = String(process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  console.error('[db:seed] Missing DATABASE_URL. Set Neon PostgreSQL URL in backend/.env first.');
  process.exit(1);
}

const db = createDbClient({ databaseUrl });
try {
  const sql = readFileSync(seedPath, 'utf8');
  await db.query(sql);
  console.log('[db:seed] Seeded Neon PostgreSQL database with Chi doan KP2 data successfully.');
} finally {
  await db.close();
}
