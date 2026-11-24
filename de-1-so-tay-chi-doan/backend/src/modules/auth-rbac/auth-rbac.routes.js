export async function registerAuthRbacRoutes(app, { controller, authGuard }) {
  app.post('/auth/identify', controller.identify);
  app.post('/auth/login', controller.login);
  app.get('/auth/me', { preHandler: [authGuard] }, controller.getMe);
  app.post('/auth/change-password', { preHandler: [authGuard] }, controller.changePassword);
}
