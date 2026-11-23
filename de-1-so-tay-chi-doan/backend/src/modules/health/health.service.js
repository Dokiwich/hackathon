export function createHealthService({ serviceName, db }) {
  return {
    getLiveness() {
      return {
        status: 'ok',
        service: serviceName,
        uptimeSeconds: Math.floor(process.uptime())
      };
    },

    async getReadiness({ verbose = false } = {}) {
      const dbHealth = await db.checkHealth();
      return {
        status: 'ready',
        service: serviceName,
        dependencies: verbose ? { database: dbHealth } : { database: dbHealth.status }
      };
    }
  };
}
