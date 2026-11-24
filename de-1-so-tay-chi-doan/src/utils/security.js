export const CANONICAL_APP_ORIGIN = 'https://sotaychidoan.pages.dev';

const SCRIPT_BLOCK_RE = /<\s*(script|iframe|object|embed|applet|meta|link|style|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
const DANGEROUS_PROTO_RE = /\b(?:javascript|vbscript|file)\s*:/gi;
const DANGEROUS_DATA_RE = /\bdata\s*:\s*(?:text\/html|application\/javascript|image\/svg\+xml)/gi;
const INLINE_HANDLER_RE = /\bon[a-z]{2,24}\s*=/gi;

const SAFE_RASTER_DATA_IMAGE_RE = /^data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/i;
const SAFE_RELATIVE_ASSET_RE = /^[a-zA-Z0-9_./-]+$/;
const MEMBER_CODE_RE = /^[A-Za-z0-9_-]{3,32}$/;
const PHONE_CLEAN_RE = /^[0-9+]{0,15}$/;

function stripControlChars(str, keepNewline = false) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code === 127) continue;
    if (code < 32) {
      if (keepNewline && code === 10) out += '\n';
      else if (code === 9 || code === 10 || code === 13) out += ' ';
      continue;
    }
    out += str[i];
  }
  return out;
}

export function containsMaliciousPayload(raw) {
  const str = String(raw ?? '');
  if (!str) return false;
  return (
    /<\s*(script|iframe|object|embed|svg)/i.test(str) ||
    /\b(?:javascript|vbscript)\s*:/i.test(str) ||
    /\bdata\s*:\s*(?:text\/html|image\/svg\+xml)/i.test(str) ||
    /\bon(?:error|load|click|mouseover|focus)\s*=/i.test(str)
  );
}

export function sanitizePlainText(input, maxLen = 300) {
  const cleaned = stripControlChars(String(input ?? ''), false)
    .replace(SCRIPT_BLOCK_RE, ' ')
    .replace(HTML_TAG_RE, ' ')
    .replace(DANGEROUS_PROTO_RE, '')
    .replace(DANGEROUS_DATA_RE, '')
    .replace(INLINE_HANDLER_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, maxLen);
}

export function sanitizeMultilineText(input, maxLen = 5000) {
  const cleaned = stripControlChars(String(input ?? '').replace(/\r\n/g, '\n'), true)
    .replace(SCRIPT_BLOCK_RE, '')
    .replace(HTML_TAG_RE, '')
    .replace(DANGEROUS_PROTO_RE, '')
    .replace(DANGEROUS_DATA_RE, '')
    .replace(INLINE_HANDLER_RE, '')
    .trim();
  return cleaned.slice(0, maxLen);
}

export function sanitizeSafeImageSrc(image, fallback = 'news/ra-quan.jpg') {
  const raw = String(image ?? '').trim();
  if (!raw) return fallback;
  if (raw.includes('..') || containsMaliciousPayload(raw)) return fallback;

  if (raw.startsWith('data:')) {
    return SAFE_RASTER_DATA_IMAGE_RE.test(raw) ? raw : fallback;
  }

  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.href;
      }
    } catch {
      return fallback;
    }
    return fallback;
  }

  const normalized = raw.replace(/^\/+/, '');
  if (SAFE_RELATIVE_ASSET_RE.test(normalized) && !normalized.includes('..')) {
    return normalized;
  }
  return fallback;
}

export function stripDangerousObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map(stripDangerousObjectKeys);
  }
  if (value && typeof value === 'object') {
    const safeObj = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      safeObj[k] = stripDangerousObjectKeys(v);
    }
    return safeObj;
  }
  return value;
}

export function isJwtTokenExpired(token, skewSeconds = 15) {
  const raw = String(token || '').trim();
  if (!raw || raw.startsWith('local-session-')) return false;
  const parts = raw.split('.');
  if (parts.length !== 3) return true;
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (parts[1].length % 4)) % 4);
    const json = globalThis.atob(padded);
    const payload = JSON.parse(json);
    if (!payload?.exp) return false;
    return Math.floor(Date.now() / 1000) + skewSeconds >= Number(payload.exp);
  } catch {
    return true;
  }
}

export function validateMemberInput(raw) {
  const maDoanVien = sanitizePlainText(raw?.maDoanVien, 32).toUpperCase();
  const hoTen = sanitizePlainText(raw?.hoTen, 80);
  const sdtRaw = sanitizePlainText(raw?.sdt, 20);
  const sdtDigits = sdtRaw.replace(/[\s.-]/g, '');

  if (!MEMBER_CODE_RE.test(maDoanVien)) {
    throw new Error('Mã đoàn viên phải từ 3–32 ký tự (chữ, số, gạch ngang).');
  }
  if (hoTen.length < 2) {
    throw new Error('Họ và tên đoàn viên phải có ít nhất 2 ký tự hợp lệ.');
  }
  if (sdtDigits && !PHONE_CLEAN_RE.test(sdtDigits)) {
    throw new Error('Số điện thoại chỉ được chứa chữ số hợp lệ.');
  }

  const gioCtxh = Math.max(0, Math.min(500, Math.round(Number(raw?.gioCtxh || 0))));
  const validShifts = ['day', 'rotating_shift', 'night', 'student'];
  const workShift = validShifts.includes(raw?.workShift) ? raw.workShift : 'day';

  return {
    ...stripDangerousObjectKeys(raw || {}),
    maDoanVien,
    hoTen,
    sdt: sdtRaw,
    chucVu: sanitizePlainText(raw?.chucVu || 'Đoàn viên', 50) || 'Đoàn viên',
    congViec: sanitizePlainText(raw?.congViec || '', 120),
    trangThai: sanitizePlainText(raw?.trangThai || 'Đang ở địa phương', 40),
    workShift,
    gioCtxh: Number.isFinite(gioCtxh) ? gioCtxh : 0,
    daDongDoanPhi: Boolean(raw?.daDongDoanPhi ?? true)
  };
}

export function validateActivityInput(raw) {
  const tenHoatDong = sanitizePlainText(raw?.tenHoatDong, 180);
  const diaDiem = sanitizePlainText(raw?.diaDiem, 180);
  if (tenHoatDong.length < 3 || diaDiem.length < 2) {
    throw new Error('Tên sự kiện và địa điểm phải hợp lệ, không chứa mã lạ.');
  }
  const latitude = Number(raw?.latitude ?? 10.957412);
  const longitude = Number(raw?.longitude ?? 106.842685);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('Vĩ độ GPS không hợp lệ.');
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Kinh độ GPS không hợp lệ.');
  }
  const geofenceRadiusM = Math.min(5000, Math.max(25, Math.round(Number(raw?.geofenceRadiusM || 150))));
  const gioCongTacXaHoi = Math.min(48, Math.max(1, Math.round(Number(raw?.gioCongTacXaHoi || 4))));
  const validTypes = ['regular_meeting', 'makeup_meeting', 'volunteer'];
  const activityType = validTypes.includes(raw?.activityType) ? raw.activityType : 'volunteer';

  return {
    ...stripDangerousObjectKeys(raw || {}),
    tenHoatDong,
    diaDiem,
    activityType,
    latitude,
    longitude,
    geofenceRadiusM,
    gioCongTacXaHoi
  };
}

export function validateNewsInput(raw) {
  if (containsMaliciousPayload(raw?.title) || containsMaliciousPayload(raw?.summary) || containsMaliciousPayload(raw?.content)) {
    throw new Error('Nội dung bản tin chứa thẻ thực thi không được phép.');
  }
  const title = sanitizePlainText(raw?.title, 200);
  const summary = sanitizeMultilineText(raw?.summary, 600);
  const content = sanitizeMultilineText(raw?.content || summary, 6000);
  if (title.length < 4 || summary.length < 6) {
    throw new Error('Tiêu đề và tóm tắt bản tin quá ngắn hoặc không hợp lệ.');
  }
  return {
    title,
    category: sanitizePlainText(raw?.category || 'Phong trào', 40) || 'Phong trào',
    source: sanitizePlainText(raw?.source || 'Đoàn Phường Tam Hiệp', 80) || 'Đoàn Phường Tam Hiệp',
    location: sanitizePlainText(raw?.location || 'Phường Tam Hiệp, TP. Biên Hòa', 120),
    publishedAt: sanitizePlainText(raw?.publishedAt || new Date().toLocaleDateString('vi-VN'), 30),
    image: sanitizeSafeImageSrc(raw?.image, 'news/ra-quan.jpg'),
    summary,
    content: content || summary,
    featured: Boolean(raw?.featured)
  };
}
