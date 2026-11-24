import { requireRoles } from '../../middleware/authGuard.js';

export async function registerNewsRoutes(app, { controller, authGuard }) {
  const officerRoles = [authGuard, requireRoles('ward_officer')];

  app.get('/news', { preHandler: [authGuard] }, controller.list);
  app.post('/news', { preHandler: officerRoles }, controller.create);
  app.patch('/news/:id', { preHandler: officerRoles }, controller.update);
  app.delete('/news/:id', { preHandler: officerRoles }, controller.remove);
}
