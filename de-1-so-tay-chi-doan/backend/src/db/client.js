import pg from 'pg';

const { Pool } = pg;

export function createDbClient({ databaseUrl = '' } = {}) {
  const trimmedUrl = String(databaseUrl || '').trim();
  const configured = Boolean(trimmedUrl);

  const pool = configured
    ? new Pool({
        connectionString: trimmedUrl,
        ssl: /sslmode=require|neon\.tech/i.test(trimmedUrl)
          ? { rejectUnauthorized: false }
          : undefined,
        max: 5,
        idleTimeoutMillis: 15000,
        connectionTimeoutMillis: 10000
      })
    : null;

  return {
    isConfigured: configured,
    mode: configured ? 'postgres' : 'memory',

    async query(sql, params = []) {
      if (!pool) {
        throw new Error('PostgreSQL client is not configured (running in memory mode)');
      }
      return pool.query(sql, params);
    },

    async checkHealth() {
      if (!pool) {
        return { status: 'unconfigured', mode: 'memory' };
      }
      try {
        await pool.query('SELECT 1');
        return { status: 'connected', mode: 'postgres' };
      } catch (err) {
        return { status: 'error', mode: 'postgres', message: err.message };
      }
    },

    async close() {
      if (pool) {
        await pool.end();
      }
    }
  };
}
