import { createMembersRepository } from './members.repository.js';
import { createMembersService } from './members.service.js';
import { createMembersController } from './members.controller.js';
import { registerMembersRoutes } from './members.routes.js';

export function createMembersModule({ db, authGuard }) {
  const repository = createMembersRepository({ db });
  const service = createMembersService({ repository });
  const controller = createMembersController(service);

  return {
    getMembersList: (user, query = { q: '', status: 'all' }) => service.listMembers(user, query),
    addSocialHours: (user, memberId, deltaHours, meta) =>
      service.addSocialHours(user, memberId, deltaHours, meta),
    async register(app, { prefix }) {
      await app.register((scope) => registerMembersRoutes(scope, { controller, authGuard }), {
        prefix
      });
    }
  };
}
