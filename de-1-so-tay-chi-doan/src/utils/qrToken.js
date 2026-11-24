import { CANONICAL_APP_ORIGIN } from './security';

function computeShortSig(activityId, code, issuedAt) {
  const input = `${activityId}:${code}:${issuedAt}:CHIDOAN2026`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export function createDynamicQrSession(activityId, ttlSeconds = 900, nowMs = Date.now()) {
  const randomCode = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X');
  const issuedAt = nowMs;
  const expiresAt = nowMs + ttlSeconds * 1000;
  const sig = computeShortSig(activityId, randomCode, issuedAt);

  return {
    activityId,
    code: randomCode,
    ttlSeconds,
    issuedAt,
    expiresAt,
    sig
  };
}

export function encodeQrSessionPayload(session) {
  return JSON.stringify({
    type: 'CHI_DOAN_CHECKIN_V1',
    activityId: session.activityId,
    code: session.code,
    token: session.token || session.code,
    exp: session.expiresAt,
    sig: session.sig
  });
}

export function buildAttendanceShareUrl(activityId, tokenOrCode) {
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : `${CANONICAL_APP_ORIGIN}/`;
  const raw = String(tokenOrCode || '');
  if (raw.startsWith(`${activityId}.`)) {
    return `${base}#diem-danh=${encodeURIComponent(raw)}`;
  }
  return `${base}#diem-danh=${encodeURIComponent(activityId)}.${encodeURIComponent(raw)}`;
}

export function parseAttendanceQrInput(rawText) {
  const raw = String(rawText || '').trim();
  if (!raw) return null;

  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.activityId && (parsed?.code || parsed?.token)) {
        return {
          activityId: String(parsed.activityId).trim(),
          code: String(parsed.code || '').trim().toUpperCase(),
          token: parsed.token ? String(parsed.token).trim() : null
        };
      }
    } catch {
      // fall through
    }
  }

  const hashIdx = raw.indexOf('#diem-danh=');
  if (hashIdx !== -1) {
    const rest = decodeURIComponent(raw.slice(hashIdx + '#diem-danh='.length).trim());
    const parts = rest.split('.');
    if (parts.length === 4 && /^\d+$/.test(parts[2])) {
      return {
        activityId: parts[0],
        code: parts[1].toUpperCase(),
        token: rest
      };
    }
    if (parts.length === 2) {
      return {
        activityId: parts[0],
        code: parts[1].toUpperCase(),
        token: null
      };
    }
  }

  const fullParts = raw.split('.');
  if (fullParts.length === 4 && /^\d+$/.test(fullParts[2])) {
    return {
      activityId: fullParts[0],
      code: fullParts[1].toUpperCase(),
      token: raw
    };
  }

  const pairMatch = raw.match(/^([A-Za-z0-9_-]+)\.([A-Za-z0-9]{4,12})$/);
  if (pairMatch) {
    return {
      activityId: pairMatch[1],
      code: pairMatch[2].toUpperCase(),
      token: null
    };
  }

  const cleanCode = raw.toUpperCase();
  if (/^[A-Z0-9]{4,12}$/.test(cleanCode)) {
    return {
      activityId: null,
      code: cleanCode,
      token: null
    };
  }

  return null;
}

export function verifyDynamicQrCode(inputCode, session, nowMs = Date.now()) {
  if (!session || (!session.code && !session.token)) {
    return { valid: false, reason: 'Chưa có phiên mã QR đang mở.' };
  }
  const parsed = parseAttendanceQrInput(inputCode);
  if (parsed?.activityId && parsed.activityId !== session.activityId) {
    return { valid: false, reason: 'Mã QR không khớp với sự kiện đã chọn.' };
  }

  if (nowMs > session.expiresAt) {
    const ttl = Number(session.ttlSeconds || Math.round((session.expiresAt - (session.issuedAt || 0)) / 1000));
    const ttlLabel = ttl >= 60 ? `${Math.round(ttl / 60)} phút` : `${ttl} giây`;
    return {
      valid: false,
      reason: `Mã QR đã hết hiệu lực (quá ${ttlLabel}). Vui lòng quét mã mới.`
    };
  }

  // Online server HMAC token session
  if (session.token && !session.sig) {
    const inputToken = parsed?.token || String(inputCode || '').trim();
    const inputCodeNorm = (parsed?.code || String(inputCode || '').trim()).toUpperCase();
    const sessionCode = String(session.code || '').toUpperCase();
    if (inputToken === session.token || (sessionCode && inputCodeNorm === sessionCode)) {
      return { valid: true, reason: 'Xác thực phiên QR động thành công.' };
    }
    return { valid: false, reason: 'Mã phiên điểm danh không khớp với mã QR hiện tại.' };
  }

  const normalized = (parsed?.code || String(inputCode || '').trim()).toUpperCase();
  if (!normalized) {
    return { valid: false, reason: 'Vui lòng nhập hoặc quét mã phiên điểm danh.' };
  }
  const expectedSig = computeShortSig(session.activityId, session.code, session.issuedAt);
  if (session.sig !== expectedSig) {
    return { valid: false, reason: 'Chữ ký phiên QR không hợp lệ.' };
  }
  if (normalized !== session.code) {
    return { valid: false, reason: 'Mã phiên điểm danh không khớp với mã QR hiện tại.' };
  }
  return { valid: true, reason: 'Xác thực phiên QR động thành công.' };
}
