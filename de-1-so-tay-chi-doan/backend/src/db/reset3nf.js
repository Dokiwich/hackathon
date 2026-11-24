import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnv } from '../config/loadDotEnv.js';
import { createDbClient } from './client.js';

loadDotEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, '../../db/schema.sql');
const seedPath = resolve(__dirname, '../../db/seed.sql');

const databaseUrl = String(process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  console.error('[db:reset-3nf] Missing DATABASE_URL. Set Neon PostgreSQL URL in backend/.env first.');
  process.exit(1);
}
const jwtSecret = String(process.env.JWT_SECRET || 'dev-only-jwt-secret-min-32-chars-dongnai')
  .replace(/^\uFEFF/, '')
  .trim();

function buildSignedQrToken(activityId, ttlSeconds = 86400) {
  const nonce = randomBytes(4).toString('hex').toUpperCase();
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const sig = createHmac('sha256', jwtSecret)
    .update(`${activityId}:${nonce}:${expiresAt}`)
    .digest('hex')
    .slice(0, 32);
  return { token: `${activityId}.${nonce}.${expiresAt}.${sig}`, expiresAt, ttlSeconds };
}

const db = createDbClient({ databaseUrl });
try {
  await db.query(`
    DROP VIEW IF EXISTS v_branch_monthly_summary CASCADE;
    DROP VIEW IF EXISTS v_member_emulation_totals CASCADE;
    DROP TABLE IF EXISTS news CASCADE;
    DROP TABLE IF EXISTS reminder_channels CASCADE;
    DROP TABLE IF EXISTS reminders CASCADE;
    DROP TABLE IF EXISTS emulation_point_ledger CASCADE;
    DROP TABLE IF EXISTS makeup_registrations CASCADE;
    DROP TABLE IF EXISTS attendance_records CASCADE;
    DROP TABLE IF EXISTS qr_sessions CASCADE;
    DROP TABLE IF EXISTS activities CASCADE;
    DROP TABLE IF EXISTS members CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS branches CASCADE;
    DROP TABLE IF EXISTS wards CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS organizations CASCADE;
  `);
  await db.query(readFileSync(schemaPath, 'utf8'));
  await db.query(readFileSync(seedPath, 'utf8'));

  for (const actId of ['ACT-WARD-01', 'ACT-KP5-04', 'ACT-KP5-05']) {
    const qr = buildSignedQrToken(actId, 86400);
    await db.query(
      `INSERT INTO qr_sessions (token, activity_id, created_by_user_id, expires_at, ttl_seconds)
       VALUES ($1, $2, 'USR-CB-TH', $3, $4)`,
      [qr.token, actId, qr.expiresAt, qr.ttlSeconds]
    );
  }
  console.log('[db:reset-3nf] Reset legacy tables, applied 3NF schema.sql, seeded Neon DB, and issued signed QR sessions.');
} finally {
  await db.close();
}
