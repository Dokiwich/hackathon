import { createRemindersRepository } from './reminders.repository.js';
import { createRemindersService } from './reminders.service.js';
import { createRemindersController } from './reminders.controller.js';
import { registerRemindersRoutes } from './reminders.routes.js';

export function createRemindersModule({ db, authGuard }) {
  const repository = createRemindersRepository({ db });
  const service = createRemindersService({ repository });
  const controller = createRemindersController(service);

  return {
    async register(app, { prefix }) {
      await app.register((scope) => registerRemindersRoutes(scope, { controller, authGuard }), {
        prefix
      });
    }
  };
}
