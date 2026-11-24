import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import { changePasswordSchema, identifySchema, loginSchema } from './auth-rbac.schema.js';

export function createAuthRbacController(service) {
  return {
    async identify(request) {
      const body = validateSchema(identifySchema, request.body || {});
      const data = await service.identify(body.identifier);
      return okResponse(request, data);
    },

    async login(request) {
      const body = validateSchema(loginSchema, request.body || {});
      const data = await service.login(body);
      return okResponse(request, data);
    },

    async getMe(request) {
      return okResponse(request, request.user);
    },

    async changePassword(request) {
      const body = validateSchema(changePasswordSchema, request.body || {});
      const data = await service.changePassword(request.user.id, body);
      return okResponse(request, data);
    }
  };
}
