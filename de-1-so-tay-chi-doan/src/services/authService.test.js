import { describe, it, expect, beforeEach } from 'vitest';
import {
  authenticateUser,
  canManageMembers,
  canManageNews,
  canOrganizeEventsAndQr,
  canResetDemoData,
  canScanQrGps,
  canViewBranchAttendanceProgress,
  canViewReports,
  canViewWardSummary,
  changePasswordByCredentials,
  changeUserPassword,
  hasCapability,
  identifyAccountLocally,
  resetLocalPasswordOverrides
} from './authService';

describe('authService 3-role RBAC & change password', () => {
  beforeEach(() => {
    resetLocalPasswordOverrides();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('auto-detects branch_secretary, ward_officer, and member and applies strict role permissions', async () => {
    expect(identifyAccountLocally('bithu.kp5')).toMatchObject({
      found: true,
      role: 'branch_secretary'
    });
    expect(identifyAccountLocally('0912 345 900')).toMatchObject({
      found: true,
      role: 'ward_officer'
    });
    expect(identifyAccountLocally('dn-kp5-002')).toMatchObject({
      found: true,
      role: 'member'
    });

    const bt = await authenticateUser({ identifier: 'bithu.kp5', password: '123456' });
    expect(canManageMembers(bt.user)).toBe(true);
    expect(canManageNews(bt.user)).toBe(false);
    expect(canOrganizeEventsAndQr(bt.user)).toBe(false);
    expect(canScanQrGps(bt.user)).toBe(true);
    expect(canViewBranchAttendanceProgress(bt.user)).toBe(true);
    expect(canViewReports(bt.user)).toBe(true);
    expect(canViewWardSummary(bt.user)).toBe(false);
    expect(canResetDemoData(bt.user)).toBe(true);
    expect(hasCapability(bt.user, 'news:read')).toBe(true);
    expect(hasCapability(bt.user, 'attendance:scan_qr_gps')).toBe(true);

    const cb = await authenticateUser({ identifier: 'canbo.tamhiep', password: '123456' });
    expect(cb.user.role).toBe('ward_officer');
    expect(canManageMembers(cb.user)).toBe(false);
    expect(canManageNews(cb.user)).toBe(true);
    expect(canOrganizeEventsAndQr(cb.user)).toBe(true);
    expect(canViewReports(cb.user)).toBe(true);
    expect(canViewWardSummary(cb.user)).toBe(true);
    expect(canResetDemoData(cb.user)).toBe(false);
    expect(hasCapability(cb.user, 'news:read')).toBe(true);
    expect(hasCapability(cb.user, 'members:read_ward')).toBe(true);

    const dv = await authenticateUser({ identifier: 'doanvien.kp5', password: '123456' });
    expect(dv.user.role).toBe('member');
    expect(canManageMembers(dv.user)).toBe(false);
    expect(canManageNews(dv.user)).toBe(false);
    expect(canOrganizeEventsAndQr(dv.user)).toBe(false);
    expect(canScanQrGps(dv.user)).toBe(true);
    expect(canViewReports(dv.user)).toBe(false);
    expect(canViewWardSummary(dv.user)).toBe(false);
    expect(canResetDemoData(dv.user)).toBe(false);
    expect(hasCapability(dv.user, 'news:read')).toBe(true);
    expect(hasCapability(dv.user, 'hours:read_self')).toBe(true);
  });

  it('requires confirming current password before updating to a new password', async () => {
    const bt = await authenticateUser({ identifier: 'bithu.kp5', password: '123456' });

    await expect(
      changeUserPassword({
        currentPassword: 'sai',
        newPassword: 'newpass123',
        confirmNewPassword: 'newpass123',
        userId: bt.user.id
      })
    ).rejects.toThrow(/hiện tại không chính xác/i);

    const res = await changeUserPassword({
      currentPassword: '123456',
      newPassword: 'newpass123',
      confirmNewPassword: 'newpass123',
      userId: bt.user.id
    });
    expect(res.updated).toBe(true);

    await expect(authenticateUser({ identifier: 'bithu.kp5', password: '123456' })).rejects.toThrow();
    const relogin = await authenticateUser({ identifier: 'bithu.kp5', password: 'newpass123' });
    expect(relogin.user.id).toBe(bt.user.id);
  });

  it('supports credential-based password change directly from Login screen', async () => {
    await expect(
      changePasswordByCredentials({
        identifier: 'canbo.tamhiep',
        currentPassword: 'wrong',
        newPassword: 'wardpass2026',
        confirmNewPassword: 'wardpass2026'
      })
    ).rejects.toThrow(/không chính xác/i);

    const ok = await changePasswordByCredentials({
      identifier: '0912345900',
      currentPassword: '123456',
      newPassword: 'wardpass2026',
      confirmNewPassword: 'wardpass2026'
    });
    expect(ok.updated).toBe(true);

    const session = await authenticateUser({ identifier: 'canbo.tamhiep', password: 'wardpass2026' });
    expect(session.user.role).toBe('ward_officer');
  });
});
