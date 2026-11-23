export function createDbClient({ databaseUrl = '' } = {}) {
  const configured = Boolean(String(databaseUrl).trim());

  return {
    isConfigured: configured,
    async checkHealth() {
      return configured ? { status: 'configured' } : { status: 'unconfigured' };
    },
    async close() {}
  };
}
