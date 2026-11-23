import { registerHealthModule } from './health/index.js';

export async function registerModules(app, { env, db, serviceName }) {
  await registerHealthModule(app, {
    prefix: env.API_PREFIX,
    serviceName,
    db
  });

  // Register track domain modules below under env.API_PREFIX
}
