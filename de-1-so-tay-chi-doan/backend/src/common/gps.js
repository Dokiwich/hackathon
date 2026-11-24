import { AppError, ValidationError } from './errors.js';

export function distanceMeters(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}

function validNumber(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export function verifyGpsPosition(event, position, nowMs = Date.now()) {
  const rawAcc = position && position.accuracy === 0 ? 15 : position?.accuracy;
  if (
    !position ||
    !validNumber(position.latitude, -90, 90) ||
    !validNumber(position.longitude, -180, 180) ||
    !validNumber(rawAcc, 0.5, 5000) ||
    !validNumber(position.timestamp, nowMs - 110000, nowMs + 300000)
  ) {
    throw new ValidationError('Vị trí đã cũ hoặc sai số quá lớn. Hãy lấy lại GPS.');
  }

  const eventLat = Number(event.latitude ?? 10.957412);
  const eventLon = Number(event.longitude ?? 106.842685);
  const radius = Number(event.geofenceRadiusM || 150);
  const distance = Math.round(
    distanceMeters(eventLat, eventLon, position.latitude, position.longitude)
  );
  const accuracy = Math.max(1, Math.ceil(rawAcc));
  const gpsBuffer = accuracy > 20 ? Math.min(accuracy, 120) : 0;
  const effectiveDistance = Math.max(0, distance - gpsBuffer);

  if (effectiveDistance > radius) {
    throw new AppError(
      `Ngoài bán kính sự kiện (${distance}m > ${radius}m). Hãy di chuyển gần địa điểm hơn.`,
      {
        statusCode: 422,
        code: 'OUT_OF_GEOFENCE',
        details: { distance, accuracy, radius }
      }
    );
  }

  return { distance, accuracy, radius };
}
