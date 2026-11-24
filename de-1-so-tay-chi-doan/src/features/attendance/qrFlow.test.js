import { describe, it, expect } from 'vitest';
import { getUserCapabilities, hasCapability } from '../auth/permissions';
import {
  buildAttendanceShareUrl,
  createDynamicQrSession,
  parseAttendanceQrInput,
  verifyDynamicQrCode
} from '../../utils/qrToken';
import { DEFAULT_VENUE_COORDS, verifyGpsPosition } from '../../utils/gpsVerify';

describe('End-to-end 3-role QR & GPS attendance flows', () => {
  const wardOfficer = {
    id: 'USR-CB-TH',
    role: 'ward_officer',
    permissions: {
      canManageMembers: false,
      canCreateWardEvent: true,
      canCreateQr: true,
      canViewWardSummary: true
    }
  };
  const branchSecretary = {
    id: 'USR-BT-KP5',
    role: 'branch_secretary',
    memberId: 'DV-KP5-001',
    permissions: {
      canManageMembers: true,
      canCreateBranchEvent: false,
      canCreateWardEvent: false,
      canCreateQr: false,
      canViewWardSummary: false
    }
  };
  const member = {
    id: 'USR-DV-KP5',
    role: 'member',
    memberId: 'DV-KP5-002',
    permissions: {
      canManageMembers: false,
      canCreateWardEvent: false,
      canCreateQr: false
    }
  };

  it('enforces exact QR creation vs QR+GPS scan capabilities across 3 roles', () => {
    expect(hasCapability(wardOfficer, 'events:create_ward')).toBe(true);
    expect(hasCapability(wardOfficer, 'qr:issue_ward')).toBe(true);
    expect(hasCapability(wardOfficer, 'news:write')).toBe(true);
    expect(hasCapability(wardOfficer, 'members:write_branch')).toBe(false);

    expect(hasCapability(branchSecretary, 'members:write_branch')).toBe(true);
    expect(hasCapability(branchSecretary, 'attendance:scan_qr_gps')).toBe(true);
    expect(hasCapability(branchSecretary, 'attendance:view_branch_progress')).toBe(true);
    expect(hasCapability(branchSecretary, 'events:create_ward')).toBe(false);
    expect(hasCapability(branchSecretary, 'qr:issue_ward')).toBe(false);

    expect(hasCapability(member, 'attendance:scan_qr_gps')).toBe(true);
    expect(hasCapability(member, 'news:read')).toBe(true);
    expect(hasCapability(member, 'members:read_branch')).toBe(false);
    expect(hasCapability(member, 'qr:issue_ward')).toBe(false);
    expect(getUserCapabilities(member).length).toBeLessThan(getUserCapabilities(branchSecretary).length);
  });

  it('verifies full QR + link + GPS geofence pass/fail paths for secretary and member', () => {
    const now = 1732450000000;
    const event = {
      id: 'ACT-WARD-99',
      latitude: DEFAULT_VENUE_COORDS.latitude,
      longitude: DEFAULT_VENUE_COORDS.longitude,
      geofenceRadiusM: 150
    };
    const qr = createDynamicQrSession(event.id, 900, now);
    const link = buildAttendanceShareUrl(event.id, qr.code);
    const parsed = parseAttendanceQrInput(link);

    expect(parsed).toEqual({ activityId: event.id, code: qr.code, token: null });
    expect(verifyDynamicQrCode(parsed.code, qr, now + 60_000).valid).toBe(true);
    expect(verifyDynamicQrCode(parsed.code, qr, now + 901_000).valid).toBe(false);
    expect(verifyDynamicQrCode('WRONGCODE', qr, now + 60_000).valid).toBe(false);

    const inRadiusGps = verifyGpsPosition(
      event,
      {
        latitude: event.latitude + 0.00008,
        longitude: event.longitude + 0.00008,
        accuracy: 12,
        timestamp: now + 60_000
      },
      now + 60_000
    );
    expect(inRadiusGps.valid).toBe(true);
    expect(inRadiusGps.distance).toBeLessThanOrEqual(150);

    const outOfRadiusGps = verifyGpsPosition(
      event,
      {
        latitude: event.latitude + 0.0035,
        longitude: event.longitude + 0.0035,
        accuracy: 15,
        timestamp: now + 60_000
      },
      now + 60_000
    );
    expect(outOfRadiusGps.valid).toBe(false);

    const staleGps = verifyGpsPosition(
      event,
      {
        latitude: event.latitude,
        longitude: event.longitude,
        accuracy: 10,
        timestamp: now - 100_000
      },
      now + 60_000
    );
    expect(staleGps.valid).toBe(false);

    // Server HMAC token link format parsing
    const hmacToken = `${event.id}.AB12CD34.${now + 900_000}.0123456789abcdef`;
    const hmacUrl = buildAttendanceShareUrl(event.id, hmacToken);
    expect(parseAttendanceQrInput(hmacUrl)).toEqual({
      activityId: event.id,
      code: 'AB12CD34',
      token: hmacToken
    });
  });
});
