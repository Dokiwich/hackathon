import { registerHealthModule } from './health/index.js';
import { createAuthRbacModule } from './auth-rbac/index.js';
import { createMembersModule } from './members/index.js';
import { createAttendanceModule } from './attendance/index.js';
import { createReportsModule } from './reports/index.js';
import { createRemindersModule } from './reminders/index.js';
import { createNewsModule } from './news/index.js';

export async function registerModules(app, { env, db, serviceName }) {
  await registerHealthModule(app, {
    prefix: env.API_PREFIX,
    serviceName,
    db
  });

  const authModule = createAuthRbacModule({ db, jwtSecret: env.JWT_SECRET });
  const membersModule = createMembersModule({ db, authGuard: authModule.authGuard });
  const attendanceModule = createAttendanceModule({
    db,
    authGuard: authModule.authGuard,
    membersApi: membersModule,
    qrSecret: env.JWT_SECRET
  });
  const reportsModule = createReportsModule({
    authGuard: authModule.authGuard,
    membersApi: membersModule,
    attendanceApi: attendanceModule
  });
  const remindersModule = createRemindersModule({ db, authGuard: authModule.authGuard });
  const newsModule = createNewsModule({ db, authGuard: authModule.authGuard });

  await authModule.register(app, { prefix: env.API_PREFIX });
  await membersModule.register(app, { prefix: env.API_PREFIX });
  await attendanceModule.register(app, { prefix: env.API_PREFIX });
  await reportsModule.register(app, { prefix: env.API_PREFIX });
  await remindersModule.register(app, { prefix: env.API_PREFIX });
  await newsModule.register(app, { prefix: env.API_PREFIX });
}
