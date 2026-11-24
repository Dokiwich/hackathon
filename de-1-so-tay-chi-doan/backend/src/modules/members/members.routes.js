import { requireRoles } from '../../middleware/authGuard.js';

export async function registerMembersRoutes(app, { controller, authGuard }) {
  const viewerRoles = [authGuard, requireRoles('branch_secretary', 'ward_officer')];
  const branchSecretaryOnly = [authGuard, requireRoles('branch_secretary')];

  app.get('/members', { preHandler: viewerRoles }, controller.list);
  app.get('/members/me', { preHandler: [authGuard] }, controller.getMe);
  app.get('/members/ledger', { preHandler: [authGuard] }, controller.getLedger);
  app.post('/members', { preHandler: branchSecretaryOnly }, controller.create);
  app.post('/members/import', { preHandler: branchSecretaryOnly }, controller.importBatch);
  app.patch('/members/:id', { preHandler: branchSecretaryOnly }, controller.update);
  app.delete('/members/:id', { preHandler: branchSecretaryOnly }, controller.remove);
}
