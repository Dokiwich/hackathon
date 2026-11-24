import { createNewsRepository } from './news.repository.js';
import { createNewsService } from './news.service.js';
import { createNewsController } from './news.controller.js';
import { registerNewsRoutes } from './news.routes.js';

export function createNewsModule({ db, authGuard }) {
  const repository = createNewsRepository({ db });
  const service = createNewsService({ repository });
  const controller = createNewsController(service);

  return {
    async register(app, { prefix }) {
      await app.register((scope) => registerNewsRoutes(scope, { controller, authGuard }), {
        prefix
      });
    }
  };
}
