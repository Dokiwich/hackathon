import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import { buildApp } from './app.js';
import { parseEnv } from './config/env.js';
import { validateSchema } from './common/validate.js';
import { ValidationError } from './common/errors.js';
import { verifyPassword } from './common/password.js';
import { requireAuth, requireRoles } from './middleware/authGuard.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('so-tay-chi-doan-api 3NF 3-role RBAC & change-password flow', () => {
  let app;

  beforeAll(async () => {
    const env = parseEnv({
      NODE_ENV: 'test',
      PORT: '4001',
      API_PREFIX: '/api/v1'
    });
    app = await buildApp(env);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('serves GET /api/v1/health & /ready with standard envelope', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-request-id']).toBeTruthy();
    expect(res.json().data.service).toBe('so-tay-chi-doan-api');

    const badReady = await app.inject({ method: 'GET', url: '/api/v1/ready?verbose=invalid' });
    expect(badReady.statusCode).toBe(400);
    expect(badReady.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('enforces exact 3-role RBAC: branch_secretary (manage own branch), ward_officer (view + ward events + QR, no member write), member (read + self check-in)', async () => {
    const loginWard = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { identifier: 'canbo.tamhiep', password: '123456' }
    });
    expect(loginWard.statusCode).toBe(200);
    expect(loginWard.json().data.user.role).toBe('ward_officer');
    expect(loginWard.json().data.user.permissions.canManageMembers).toBe(false);
    expect(loginWard.json().data.user.permissions.canCreateWardEvent).toBe(true);
    const wardHeaders = { authorization: `Bearer ${loginWard.json().data.accessToken}` };

    // Ward officer CAN view all ward members and create ward event + QR
    const wardMembersRes = await app.inject({ method: 'GET', url: '/api/v1/members', headers: wardHeaders });
    expect(wardMembersRes.statusCode).toBe(200);
    expect(wardMembersRes.json().data.length).toBeGreaterThanOrEqual(4);

    // Ward officer CANNOT create/delete members (403)
    const wardAddMember = await app.inject({
      method: 'POST',
      url: '/api/v1/members',
      headers: wardHeaders,
      payload: { maDoanVien: 'DN-TEST-888', hoTen: 'Blocked Write' }
    });
    expect(wardAddMember.statusCode).toBe(403);

    const wardDeleteMember = await app.inject({
      method: 'DELETE',
      url: '/api/v1/members/DV-KP5-002',
      headers: wardHeaders
    });
    expect(wardDeleteMember.statusCode).toBe(403);

    // Ward officer CAN organize a ward event with GPS geofence and issue QR
    const wardActRes = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/activities',
      headers: wardHeaders,
      payload: {
        tenHoatDong: 'Ngày hội Thanh niên Phường Tam Hiệp',
        ngayToChuc: '2026-12-10',
        diaDiem: 'UBND Phường Tam Hiệp',
        latitude: 10.957412,
        longitude: 106.842685,
        geofenceRadiusM: 120,
        emulationPoints: 15
      }
    });
    expect(wardActRes.statusCode).toBe(201);
    const wardActId = wardActRes.json().data.id;
    expect(wardActRes.json().data.geofenceRadiusM).toBe(120);

    const wardQrRes = await app.inject({
      method: 'POST',
      url: `/api/v1/attendance/activities/${wardActId}/qr-session`,
      headers: wardHeaders,
      payload: { ttlSeconds: 900 }
    });
    expect(wardQrRes.statusCode).toBe(201);
    const wardToken = wardQrRes.json().data.token;
    expect(wardToken).toContain(wardActId);

    // Member CANNOT view all members, add members, or organize activities / issue QR
    const loginMember = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { identifier: 'DN-KP5-002', password: '123456' }
    });
    expect(loginMember.statusCode).toBe(200);
    expect(loginMember.json().data.user.role).toBe('member');
    const memberHeaders = { authorization: `Bearer ${loginMember.json().data.accessToken}` };

    const memberListBlocked = await app.inject({ method: 'GET', url: '/api/v1/members', headers: memberHeaders });
    expect(memberListBlocked.statusCode).toBe(403);
    const memberCreateActBlocked = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/activities',
      headers: memberHeaders,
      payload: { tenHoatDong: 'Blocked', ngayToChuc: '2026-12-10', diaDiem: 'KP5' }
    });
    expect(memberCreateActBlocked.statusCode).toBe(403);
    const memberQrBlocked = await app.inject({
      method: 'POST',
      url: `/api/v1/attendance/activities/${wardActId}/qr-session`,
      headers: memberHeaders,
      payload: {}
    });
    expect(memberQrBlocked.statusCode).toBe(403);

    // Member rejected when GPS is stale (400) or outside geofence (422), allowed inside geofence (200)
    const staleGpsRes = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/check-in',
      headers: memberHeaders,
      payload: {
        activityId: wardActId,
        memberId: 'DV-KP5-002',
        token: wardToken,
        position: { latitude: 10.95745, longitude: 106.8427, accuracy: 12, timestamp: Date.now() - 120000 }
      }
    });
    expect(staleGpsRes.statusCode).toBe(400);

    const farGpsRes = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/check-in',
      headers: memberHeaders,
      payload: {
        activityId: wardActId,
        memberId: 'DV-KP5-002',
        token: wardToken,
        position: { latitude: 10.9615, longitude: 106.847, accuracy: 15, timestamp: Date.now() }
      }
    });
    expect(farGpsRes.statusCode).toBe(422);

    const memberOkRes = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/check-in',
      headers: memberHeaders,
      payload: {
        activityId: wardActId,
        memberId: 'DV-KP5-002',
        token: wardToken,
        position: { latitude: 10.95749, longitude: 106.84275, accuracy: 10, timestamp: Date.now() }
      }
    });
    expect(memberOkRes.statusCode).toBe(200);
    expect(memberOkRes.json().data.distanceM).toBeLessThanOrEqual(120);
    expect(memberOkRes.json().data.accuracyM).toBe(10);

    // Member self profile & activities include real checkedInRecords + active qrSession
    const meRes = await app.inject({ method: 'GET', url: '/api/v1/members/me', headers: memberHeaders });
    expect(meRes.statusCode).toBe(200);
    expect(meRes.json().data.id).toBe('DV-KP5-002');

    const ledgerRes = await app.inject({ method: 'GET', url: '/api/v1/members/ledger', headers: memberHeaders });
    expect(ledgerRes.statusCode).toBe(200);

    const actsListRes = await app.inject({ method: 'GET', url: '/api/v1/attendance/activities', headers: memberHeaders });
    expect(actsListRes.statusCode).toBe(200);
    const syncedAct = actsListRes.json().data.find((a) => a.id === wardActId);
    expect(syncedAct.qrSession?.token).toBe(wardToken);
    expect(syncedAct.checkedInRecords.some((r) => r.memberId === 'DV-KP5-002' && r.distanceM <= 120)).toBe(true);

    // Ward officer live report summary reflects real members & checkins
    const wardReportRes = await app.inject({ method: 'GET', url: '/api/v1/reports/summary', headers: wardHeaders });
    expect(wardReportRes.statusCode).toBe(200);
    expect(wardReportRes.json().data.totalMembers).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(wardReportRes.json().data.branchSummary)).toBe(true);

    // Closed activity rejects further QR+GPS check-ins (400)
    const closeRes = await app.inject({
      method: 'POST',
      url: `/api/v1/attendance/activities/${wardActId}/close`,
      headers: wardHeaders,
      payload: {}
    });
    expect(closeRes.statusCode).toBe(200);
    expect(closeRes.json().data.isClosed).toBe(true);

    const afterCloseRes = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/check-in',
      headers: memberHeaders,
      payload: {
        activityId: wardActId,
        memberId: 'DV-KP5-002',
        token: wardToken,
        position: { latitude: 10.95749, longitude: 106.84275, accuracy: 10, timestamp: Date.now() }
      }
    });
    expect(afterCloseRes.statusCode).toBe(400);
  });

  it('serves news feed to all 3 roles and restricts news mutations strictly to ward_officer', async () => {
    const [loginWard, loginSecretary, loginMember] = await Promise.all([
      app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { identifier: 'canbo.tamhiep', password: '123456' } }),
      app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { identifier: 'bithu.kp5', password: '123456' } }),
      app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { identifier: 'doanvien.kp5', password: '123456' } })
    ]);
    expect(loginWard.statusCode).toBe(200);
    expect(loginSecretary.statusCode).toBe(200);
    expect(loginMember.statusCode).toBe(200);
    const wardH = { authorization: `Bearer ${loginWard.json().data.accessToken}` };
    const secH = { authorization: `Bearer ${loginSecretary.json().data.accessToken}` };
    const memH = { authorization: `Bearer ${loginMember.json().data.accessToken}` };

    for (const headers of [wardH, secH, memH]) {
      const listRes = await app.inject({ method: 'GET', url: '/api/v1/news', headers });
      expect(listRes.statusCode).toBe(200);
      expect(listRes.json().data.length).toBeGreaterThanOrEqual(2);
    }

    for (const headers of [secH, memH]) {
      const blockedCreate = await app.inject({
        method: 'POST',
        url: '/api/v1/news',
        headers,
        payload: {
          title: 'Tin tức không đủ quyền đăng',
          summary: 'Bí thư và Đoàn viên không được đăng tin tổng quan.'
        }
      });
      expect(blockedCreate.statusCode).toBe(403);
    }

    const createdRes = await app.inject({
      method: 'POST',
      url: '/api/v1/news',
      headers: wardH,
      payload: {
        title: 'Phát động Tháng hành động vì Thanh niên Tam Hiệp',
        category: 'Phong trào',
        summary: 'Đoàn Phường phát động đợt cao điểm tình nguyện cuối năm tại các khu phố.'
      }
    });
    expect(createdRes.statusCode).toBe(201);
    const createdId = createdRes.json().data.id;

    const patchBlocked = await app.inject({
      method: 'PATCH',
      url: `/api/v1/news/${createdId}`,
      headers: secH,
      payload: { title: 'Sửa trái phép' }
    });
    expect(patchBlocked.statusCode).toBe(403);

    const patchOk = await app.inject({
      method: 'PATCH',
      url: `/api/v1/news/${createdId}`,
      headers: wardH,
      payload: { title: 'Cập nhật Tháng hành động vì Thanh niên Tam Hiệp' }
    });
    expect(patchOk.statusCode).toBe(200);
    expect(patchOk.json().data.title).toContain('Cập nhật');

    const delBlocked = await app.inject({ method: 'DELETE', url: `/api/v1/news/${createdId}`, headers: memH });
    expect(delBlocked.statusCode).toBe(403);

    const delOk = await app.inject({ method: 'DELETE', url: `/api/v1/news/${createdId}`, headers: wardH });
    expect(delOk.statusCode).toBe(200);
    expect(delOk.json().data.deleted).toBe(true);
  });

  it('runs branch_secretary lifecycle + password change with old-password confirmation', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { identifier: '0912345001', password: '123456' }
    });
    expect(loginRes.statusCode).toBe(200);
    const authHeader = { authorization: `Bearer ${loginRes.json().data.accessToken}` };

    // Create member in KP5
    const createMemberRes = await app.inject({
      method: 'POST',
      url: '/api/v1/members',
      headers: authHeader,
      payload: {
        maDoanVien: 'DN-KP5-999',
        hoTen: 'Phạm Minh Tuấn',
        residenceStatus: 'migrant_worker',
        gioCtxh: 10
      }
    });
    expect(createMemberRes.statusCode).toBe(201);
    const memberId = createMemberRes.json().data.id;

    // branch_secretary CANNOT create events or issue QR (403); scans Ward QR + GPS for self
    const secCreateActBlocked = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/activities',
      headers: authHeader,
      payload: { tenHoatDong: 'Blocked Branch Act', ngayToChuc: '2026-12-10', diaDiem: 'KP5' }
    });
    expect(secCreateActBlocked.statusCode).toBe(403);

    const secQrBlocked = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/activities/ACT-WARD-01/qr-session',
      headers: authHeader,
      payload: {}
    });
    expect(secQrBlocked.statusCode).toBe(403);

    // Ward officer issues QR for ACT-WARD-01, branch_secretary scans QR + GPS for self (DV-KP5-001)
    const loginWard = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { identifier: 'canbo.tamhiep', password: '123456' }
    });
    const wardHeaders = { authorization: `Bearer ${loginWard.json().data.accessToken}` };
    const qrRes = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/activities/ACT-WARD-01/qr-session',
      headers: wardHeaders,
      payload: { ttlSeconds: 900 }
    });
    expect(qrRes.statusCode).toBe(201);

    const checkInOtherBlocked = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/check-in',
      headers: authHeader,
      payload: {
        activityId: 'ACT-WARD-01',
        memberId,
        token: qrRes.json().data.token,
        position: { latitude: 10.95745, longitude: 106.8427, accuracy: 12, timestamp: Date.now() }
      }
    });
    expect(checkInOtherBlocked.statusCode).toBe(403);

    const checkInOutOfRange = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/check-in',
      headers: authHeader,
      payload: {
        activityId: 'ACT-WARD-01',
        memberId: 'DV-KP5-001',
        token: qrRes.json().data.token,
        position: { latitude: 10.962, longitude: 106.847, accuracy: 12, timestamp: Date.now() }
      }
    });
    expect(checkInOutOfRange.statusCode).toBe(422);

    const checkInRes = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/check-in',
      headers: authHeader,
      payload: {
        activityId: 'ACT-WARD-01',
        memberId: 'DV-KP5-001',
        token: qrRes.json().data.token,
        position: { latitude: 10.95745, longitude: 106.8427, accuracy: 12, timestamp: Date.now() }
      }
    });
    expect(checkInRes.statusCode).toBe(200);
    expect(checkInRes.json().data.distanceM).toBeLessThanOrEqual(150);
    expect(checkInRes.json().data.totalMemberHours).toBe(45);

    // Reject wrong current password on change-password
    const badChange = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: authHeader,
      payload: {
        currentPassword: 'wrong-password',
        newPassword: 'newpass999',
        confirmNewPassword: 'newpass999'
      }
    });
    expect(badChange.statusCode).toBe(401);

    // Valid password change updates hash -> old fails, new succeeds
    const okChange = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: authHeader,
      payload: {
        currentPassword: '123456',
        newPassword: 'newpass999',
        confirmNewPassword: 'newpass999'
      }
    });
    expect(okChange.statusCode).toBe(200);
    expect(okChange.json().data.updated).toBe(true);

    const oldLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { identifier: 'bithu.kp5', password: '123456' }
    });
    expect(oldLogin.statusCode).toBe(401);

    const newLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { identifier: 'bithu.kp5', password: 'newpass999' }
    });
    expect(newLogin.statusCode).toBe(200);
  });

  it('verifies seeded Neon 3NF password hashes, guard rules, and production env validation', async () => {
    const seedSql = readFileSync(resolve(__dirname, '../db/seed.sql'), 'utf8');
    const hashes = seedSql.match(/scrypt\$[0-9a-z]+\$[0-9a-f]+/g) || [];
    expect(hashes.length).toBe(3);
    for (const h of hashes) {
      expect(verifyPassword('123456', h)).toBe(true);
    }

    await expect(requireAuth({ headers: {} })).rejects.toMatchObject({ statusCode: 401 });
    await expect(requireRoles('branch_secretary')({ user: { role: 'ward_officer' } })).rejects.toMatchObject({
      statusCode: 403
    });
    expect(() => validateSchema(z.object({ id: z.string().min(3) }), { id: 'a' })).toThrow(ValidationError);
    expect(() => parseEnv({ NODE_ENV: 'production', DATABASE_URL: '', JWT_SECRET: 'short' })).toThrow();
  });
});
