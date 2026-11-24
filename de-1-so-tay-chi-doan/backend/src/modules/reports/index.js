import { createReportsService } from './reports.service.js';
import { createReportsController } from './reports.controller.js';
import { registerReportsRoutes } from './reports.routes.js';

export function createReportsModule({ authGuard, membersApi, attendanceApi }) {
  const service = createReportsService({ membersApi, attendanceApi });
  const controller = createReportsController(service);

  return {
    async register(app, { prefix }) {
      await app.register((scope) => registerReportsRoutes(scope, { controller, authGuard }), {
        prefix
      });
    }
  };
}
