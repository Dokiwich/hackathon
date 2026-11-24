import { describe, it, expect } from 'vitest';
import { DEFAULT_VENUE_COORDS, distanceMeters, verifyGpsPosition } from './gpsVerify';
import { buildAttendanceShareUrl, parseAttendanceQrInput } from './qrToken';

describe('GPS geofence & QR link parser', () => {
  it('computes distanceMeters and enforces radius + timestamp freshness', () => {
    const event = {
      latitude: DEFAULT_VENUE_COORDS.latitude,
      longitude: DEFAULT_VENUE_COORDS.longitude,
      geofenceRadiusM: 150
    };
    const now = 1732440000000;

    expect(
      distanceMeters(event.latitude, event.longitude, event.latitude, event.longitude)
    ).toBe(0);

    const inside = verifyGpsPosition(
      event,
      {
        latitude: event.latitude + 0.00008,
        longitude: event.longitude + 0.00008,
        accuracy: 12,
        timestamp: now - 5000
      },
      now
    );
    expect(inside.valid).toBe(true);
    expect(inside.distance).toBeLessThanOrEqual(150);
    expect(inside.accuracy).toBe(12);

    const outside = verifyGpsPosition(
      event,
      {
        latitude: event.latitude + 0.0035,
        longitude: event.longitude + 0.0035,
        accuracy: 15,
        timestamp: now
      },
      now
    );
    expect(outside.valid).toBe(false);
    expect(outside.distance).toBeGreaterThan(150);
    expect(outside.reason).toContain('Ngoài bán kính');

    const stale = verifyGpsPosition(
      event,
      {
        latitude: event.latitude,
        longitude: event.longitude,
        accuracy: 10,
        timestamp: now - 120000
      },
      now
    );
    expect(stale.valid).toBe(false);
    expect(stale.reason).toContain('cũ');

    const bufferedIndoor = verifyGpsPosition(
      event,
      {
        latitude: event.latitude + 0.0017,
        longitude: event.longitude,
        accuracy: 65,
        timestamp: now + 90000
      },
      now
    );
    expect(bufferedIndoor.valid).toBe(true);
  });

  it('parses #diem-danh URL, JSON payload, and raw codes cleanly', () => {
    const shareUrl = buildAttendanceShareUrl('ACT-WARD-01', 'AB12CD');
    expect(parseAttendanceQrInput(shareUrl)).toMatchObject({
      activityId: 'ACT-WARD-01',
      code: 'AB12CD'
    });

    const jsonPayload = JSON.stringify({
      type: 'CHI_DOAN_CHECKIN_V1',
      activityId: 'ACT-WARD-02',
      code: 'xy98zt'
    });
    expect(parseAttendanceQrInput(jsonPayload)).toMatchObject({
      activityId: 'ACT-WARD-02',
      code: 'XY98ZT'
    });

    expect(parseAttendanceQrInput('k9m2p4')).toMatchObject({
      activityId: null,
      code: 'K9M2P4'
    });
  });
});
