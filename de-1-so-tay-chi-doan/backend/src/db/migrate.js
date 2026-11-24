import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnv } from '../config/loadDotEnv.js';
import { createDbClient } from './client.js';

loadDotEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, '../../db/schema.sql');

const databaseUrl = String(process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  console.error('[db:migrate] Missing DATABASE_URL. Set Neon PostgreSQL URL in backend/.env first.');
  process.exit(1);
}

const db = createDbClient({ databaseUrl });
try {
  const sql = readFileSync(schemaPath, 'utf8');
  await db.query(sql);
  console.log('[db:migrate] Applied schema.sql to PostgreSQL/Neon successfully.');
} finally {
  await db.close();
}
