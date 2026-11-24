import { createAttendanceRepository } from './attendance.repository.js';
import { createAttendanceService } from './attendance.service.js';
import { createAttendanceController } from './attendance.controller.js';
import { registerAttendanceRoutes } from './attendance.routes.js';

export function createAttendanceModule({ db, authGuard, membersApi, qrSecret }) {
  const repository = createAttendanceRepository({ db });
  const service = createAttendanceService({ repository, membersApi, qrSecret });
  const controller = createAttendanceController(service);

  return {
    getActivitiesList: (user) => service.listActivities(user),
    async register(app, { prefix }) {
      await app.register((scope) => registerAttendanceRoutes(scope, { controller, authGuard }), {
        prefix
      });
    }
  };
}
