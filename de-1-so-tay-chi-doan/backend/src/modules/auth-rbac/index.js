import { createAuthGuard } from '../../middleware/authGuard.js';
import { createAuthRbacRepository } from './auth-rbac.repository.js';
import { createAuthRbacService } from './auth-rbac.service.js';
import { createAuthRbacController } from './auth-rbac.controller.js';
import { registerAuthRbacRoutes } from './auth-rbac.routes.js';

export function createAuthRbacModule({ db, jwtSecret }) {
  const repository = createAuthRbacRepository({ db });
  const service = createAuthRbacService({ repository, jwtSecret });
  const controller = createAuthRbacController(service);
  const authGuard = createAuthGuard((token) => service.verifyAccessToken(token));

  return {
    authGuard,
    verifyAccessToken: (token) => service.verifyAccessToken(token),
    async register(app, { prefix }) {
      await app.register((scope) => registerAuthRbacRoutes(scope, { controller, authGuard }), {
        prefix
      });
    }
  };
}
