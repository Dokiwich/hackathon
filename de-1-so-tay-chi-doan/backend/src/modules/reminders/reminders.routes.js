import { requireRoles } from '../../middleware/authGuard.js';

export async function registerRemindersRoutes(app, { controller, authGuard }) {
  const managerRoles = [authGuard, requireRoles('branch_secretary', 'ward_officer')];

  app.get('/reminders', { preHandler: [authGuard] }, controller.list);
  app.post('/reminders', { preHandler: managerRoles }, controller.create);
  app.patch('/reminders/:id', { preHandler: managerRoles }, controller.update);
}
