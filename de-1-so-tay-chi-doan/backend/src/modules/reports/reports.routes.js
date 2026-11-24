import { requireRoles } from '../../middleware/authGuard.js';

export async function registerReportsRoutes(app, { controller, authGuard }) {
  const reportRoles = [authGuard, requireRoles('branch_secretary', 'ward_officer')];

  app.get('/reports/summary', { preHandler: reportRoles }, controller.getSummary);
  app.get('/reports/export.csv', { preHandler: reportRoles }, controller.exportCsv);
}
