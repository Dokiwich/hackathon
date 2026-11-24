import { requireRoles } from '../../middleware/authGuard.js';

export async function registerAttendanceRoutes(app, { controller, authGuard }) {
  const wardOfficerOnly = [authGuard, requireRoles('ward_officer')];

  app.get('/attendance/activities', { preHandler: [authGuard] }, controller.list);
  app.post('/attendance/activities', { preHandler: wardOfficerOnly }, controller.create);
  app.post('/attendance/activities/:id/qr-session', { preHandler: wardOfficerOnly }, controller.issueQrSession);
  app.post('/attendance/activities/:id/close', { preHandler: wardOfficerOnly }, controller.closeActivity);
  app.delete('/attendance/activities/:id', { preHandler: wardOfficerOnly }, controller.removeActivity);
  app.post('/attendance/check-in', { preHandler: [authGuard] }, controller.checkIn);
}
