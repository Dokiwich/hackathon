export const DEFAULT_VENUE_COORDS = {
  latitude: 10.957412,
  longitude: 106.842685,
  label: 'Nhà văn hóa Khu phố 5'
};

export function isEmbeddedWebView() {
  if (typeof navigator === 'undefined') return false;
  const ua = String(navigator.userAgent || '');
  return /Zalo|FBAN|FBAV|FB_IAB|Instagram|BytedanceWebview|TikTok|Line\//i.test(ua);
}

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
    return {
      valid: false,
      reason: 'Vị trí GPS đã cũ hoặc sai số mạng quá lớn (>5km). Vui lòng lấy lại GPS.'
    };
  }

  const eventLat = Number(event?.latitude ?? DEFAULT_VENUE_COORDS.latitude);
  const eventLon = Number(event?.longitude ?? DEFAULT_VENUE_COORDS.longitude);
  const radius = Number(event?.geofenceRadiusM || 150);
  const distance = Math.round(
    distanceMeters(eventLat, eventLon, position.latitude, position.longitude)
  );
  const accuracy = Math.max(1, Math.ceil(rawAcc));
  const gpsBuffer = accuracy > 20 ? Math.min(accuracy, 120) : 0;
  const effectiveDistance = Math.max(0, distance - gpsBuffer);

  if (effectiveDistance > radius) {
    const distLabel =
      distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} m`;
    return {
      valid: false,
      distance,
      accuracy,
      radius,
      reason: `Ngoài bán kính sự kiện (vị trí của bạn cách tâm sự kiện ${distLabel}, bán kính cho phép ${radius} m).`
    };
  }

  return {
    valid: true,
    distance,
    accuracy,
    radius,
    reason: `Xác thực GPS hợp lệ (cách tâm ${distance} m, sai số ±${accuracy} m).`
  };
}

export function requestBrowserPosition() {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return Promise.reject(
      new Error('Trình duyệt yêu cầu kết nối HTTPS hoặc localhost để cấp quyền Vị trí GPS.')
    );
  }
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('Trình duyệt hiện tại chưa hỗ trợ định vị GPS.'));
  }

  const mapGeo = (pos) => ({
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: Math.min(4900, Math.max(1, Number(pos.coords.accuracy || 20))),
    timestamp: Date.now()
  });

  const errorText = (err) => {
    if (err?.code === 1) {
      if (isEmbeddedWebView()) {
        return 'Trình duyệt trong Zalo/Messenger chặn cấp quyền Vị trí. Hãy bấm dấu ⋯ góc phải chọn "Mở bằng trình duyệt" (Chrome/Safari).';
      }
      return 'Trình duyệt chưa thể cấp quyền Vị trí: hãy bấm biểu tượng ổ khóa trên thanh địa chỉ chọn Cho phép Vị trí (trên Android hãy đóng bong bóng chat Messenger/Zalo nổi trên màn hình rồi bấm lại).';
    }
    if (err?.code === 2) {
      return 'Thiết bị chưa bật dịch vụ Vị trí (Location/GPS) của hệ điều hành.';
    }
    if (err?.code === 3) {
      return 'Lấy tín hiệu GPS quá thời gian chờ, vui lòng thử lại.';
    }
    return 'Không lấy được tọa độ GPS hiện tại.';
  };

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(mapGeo(pos)),
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(mapGeo(pos)),
          (err) => reject(new Error(errorText(err))),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 10000 }
    );
  });
}
