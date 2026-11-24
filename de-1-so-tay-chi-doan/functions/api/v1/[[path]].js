import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const STATUS_LABEL = {
  local: 'Đang ở địa phương',
  migrant_worker: 'Đi làm xa',
  transferred: 'Chuyển sinh hoạt'
};

const RECURRENCE_TO_DB = {
  'Hàng tuần': 'weekly',
  'Hàng tháng': 'monthly',
  'Một lần': 'once',
  weekly: 'weekly',
  monthly: 'monthly',
  once: 'once'
};

const DB_TO_RECURRENCE = {
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
  once: 'Một lần'
};

const CHANNEL_TO_LABEL = {
  zalo_oa: 'Zalo OA',
  zalo_group: 'Zalo Nhóm',
  web_push: 'Web Push',
  sms: 'SMS'
};

const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const SCRIPT_BLOCK_RE = /<\s*(script|iframe|object|embed|applet|meta|link|style|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
const DANGEROUS_PROTO_RE = /\b(?:javascript|vbscript|file)\s*:/gi;
const DANGEROUS_DATA_RE = /\bdata\s*:\s*(?:text\/html|application\/javascript|image\/svg\+xml)/gi;
const INLINE_HANDLER_RE = /\bon[a-z]{2,24}\s*=/gi;
const SAFE_RASTER_DATA_IMAGE_RE = /^data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/i;
const SAFE_RELATIVE_ASSET_RE = /^[a-zA-Z0-9_./-]+$/;
const MEMBER_CODE_RE = /^[A-Za-z0-9_-]{3,32}$/;

const RATE_BUCKETS = new Map();

class HttpError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function checkRateLimit(request, bucketName, maxHits = 20, windowMs = 60_000) {
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'local-ip';
  const key = `${bucketName}:${ip}`;
  const now = Date.now();
  const entry = RATE_BUCKETS.get(key);

  if (RATE_BUCKETS.size > 2000) {
    for (const [k, v] of RATE_BUCKETS.entries()) {
      if (now > v.resetAt) RATE_BUCKETS.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    RATE_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > maxHits) {
    throw new HttpError(
      429,
      'TOO_MANY_REQUESTS',
      'Thao tác quá nhanh. Vui lòng đợi ít giây rồi thử lại.'
    );
  }
}

function assertNoMaliciousPayload(value, fieldLabel = 'Dữ liệu') {
  const str = String(value ?? '');
  if (
    /<\s*(script|iframe|object|embed|svg)/i.test(str) ||
    /\b(?:javascript|vbscript)\s*:/i.test(str) ||
    /\bdata\s*:\s*(?:text\/html|image\/svg\+xml)/i.test(str) ||
    /\bon(?:error|load|click|mouseover|focus)\s*=/i.test(str)
  ) {
    throw new HttpError(400, 'MALICIOUS_INPUT', `${fieldLabel} chứa mã thực thi không hợp lệ.`);
  }
}

function sanitizePlainText(input, maxLen = 300) {
  return String(input ?? '')
    .replace(CONTROL_CHARS_RE, '')
    .replace(SCRIPT_BLOCK_RE, ' ')
    .replace(HTML_TAG_RE, ' ')
    .replace(DANGEROUS_PROTO_RE, '')
    .replace(DANGEROUS_DATA_RE, '')
    .replace(INLINE_HANDLER_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function sanitizeMultilineText(input, maxLen = 5000) {
  return String(input ?? '')
    .replace(/\r\n/g, '\n')
    .replace(CONTROL_CHARS_RE, '')
    .replace(SCRIPT_BLOCK_RE, '')
    .replace(HTML_TAG_RE, '')
    .replace(DANGEROUS_PROTO_RE, '')
    .replace(DANGEROUS_DATA_RE, '')
    .replace(INLINE_HANDLER_RE, '')
    .trim()
    .slice(0, maxLen);
}

function sanitizeSafeImage(input, fallback = 'news/ra-quan.jpg') {
  const raw = String(input ?? '').trim();
  if (!raw) return fallback;
  assertNoMaliciousPayload(raw, 'Đường dẫn ảnh');
  if (raw.includes('..')) {
    throw new HttpError(400, 'MALICIOUS_INPUT', 'Đường dẫn ảnh không hợp lệ.');
  }
  if (raw.startsWith('data:')) {
    if (!SAFE_RASTER_DATA_IMAGE_RE.test(raw)) {
      throw new HttpError(400, 'MALICIOUS_INPUT', 'Chỉ chấp nhận ảnh PNG, JPG hoặc WEBP hợp lệ.');
    }
    return raw;
  }
  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    try {
      const u = new URL(raw);
      if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
    } catch {
      throw new HttpError(400, 'VALIDATION_ERROR', 'URL ảnh không hợp lệ.');
    }
  }
  const clean = raw.replace(/^\/+/, '');
  if (SAFE_RELATIVE_ASSET_RE.test(clean) && !clean.includes('..')) {
    return clean;
  }
  throw new HttpError(400, 'VALIDATION_ERROR', 'Định dạng ảnh không được phép.');
}

function assertNoPrototypePollution(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new HttpError(400, 'MALICIOUS_INPUT', 'Phát hiện khóa đối tượng không hợp lệ.');
    }
    const val = obj[key];
    if (val && typeof val === 'object') {
      assertNoPrototypePollution(val);
    }
  }
}

function normalizePhone(raw) {
  return String(raw || '').replace(/[\s.-]/g, '').trim();
}

function normalizeResidenceStatus(input) {
  const val = String(input || '').trim();
  if (val === 'local' || val === 'migrant_worker' || val === 'transferred') return val;
  if (val === 'Đi làm xa' || val === 'Tạm vắng') return 'migrant_worker';
  if (val === 'Chuyển sinh hoạt') return 'transferred';
  return 'local';
}

function normalizeWorkShift(input) {
  const val = String(input || '').trim();
  if (['day', 'rotating_shift', 'night', 'student'].includes(val)) return val;
  return 'day';
}

function hashPassword(plain, fixedSaltHex = '') {
  const saltHex = fixedSaltHex ? String(fixedSaltHex) : randomBytes(16).toString('hex');
  const derivedHex = scryptSync(String(plain), saltHex, 64).toString('hex');
  return `scrypt$${saltHex}$${derivedHex}`;
}

function verifyPassword(plain, storedHash) {
  const parts = String(storedHash || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, saltHex, hashHex] = parts;
  if (!saltHex || !hashHex) return false;
  try {
    const derived = scryptSync(String(plain), saltHex, 64);
    const expected = Buffer.from(hashHex, 'hex');
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function b64uEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function b64uDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signJwt(payload, secret, ttlSeconds = 43200) {
  const nowSec = Math.floor(Date.now() / 1000);
  const headerPart = b64uEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadPart = b64uEncode(
    JSON.stringify({ ...payload, iat: nowSec, exp: nowSec + ttlSeconds })
  );
  const signingInput = `${headerPart}.${payloadPart}`;
  const sig = createHmac('sha256', secret).update(signingInput).digest();
  return `${signingInput}.${b64uEncode(sig)}`;
}

function verifyJwt(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, sigPart] = parts;
  try {
    const header = JSON.parse(b64uDecode(headerPart));
    if (!header || header.alg !== 'HS256' || header.typ !== 'JWT') return null;
  } catch {
    return null;
  }
  const signingInput = `${headerPart}.${payloadPart}`;
  const expectedSig = b64uEncode(createHmac('sha256', secret).update(signingInput).digest());
  const a = Buffer.from(sigPart);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const decoded = JSON.parse(b64uDecode(payloadPart));
    const nowSec = Math.floor(Date.now() / 1000);
    if (!decoded?.id || (decoded.exp && nowSec > decoded.exp)) return null;
    if (decoded.iat && decoded.iat > nowSec + 60) return null;
    return decoded;
  } catch {
    return null;
  }
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}

function validNum(v, min, max) {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}

function verifyGpsPosition(event, position, nowMs = Date.now()) {
  const rawAcc = position && position.accuracy === 0 ? 15 : position?.accuracy;
  if (
    !position ||
    !validNum(position.latitude, -90, 90) ||
    !validNum(position.longitude, -180, 180) ||
    !validNum(rawAcc, 0.5, 5000) ||
    !validNum(position.timestamp, nowMs - 110000, nowMs + 300000)
  ) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      'Vị trí GPS đã cũ hoặc sai số mạng quá lớn (>5km). Hãy lấy lại GPS.'
    );
  }
  const eventLat = Number(event.latitude ?? 10.957412);
  const eventLon = Number(event.longitude ?? 106.842685);
  const radius = Number(event.geofenceRadiusM || 150);
  const distance = Math.round(distanceMeters(eventLat, eventLon, position.latitude, position.longitude));
  const accuracy = Math.max(1, Math.ceil(rawAcc));
  const gpsBuffer = accuracy > 20 ? Math.min(accuracy, 120) : 0;
  const effectiveDistance = Math.max(0, distance - gpsBuffer);
  if (effectiveDistance > radius) {
    const distLabel = distance >= 1000 ? `${(distance / 1000).toFixed(2)}km` : `${distance}m`;
    throw new HttpError(
      422,
      'OUT_OF_GEOFENCE',
      `Ngoài bán kính sự kiện (cách tâm ${distLabel}, bán kính cho phép ${radius}m).`,
      { distance, accuracy, radius }
    );
  }
  return { distance, accuracy, radius };
}

function signQr(activityId, nonce, expiresAt, secret, len = 32) {
  return createHmac('sha256', secret)
    .update(`${activityId}:${nonce}:${expiresAt}`)
    .digest('hex')
    .slice(0, len);
}

function verifySignedQrToken(token, expectedActivityId, secret) {
  const parts = String(token || '').trim().split('.');
  if (parts.length !== 4) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Mã QR không đúng cấu trúc chữ ký số.');
  }
  const [partActId, nonce, expStr, sig] = parts;
  if (expectedActivityId && partActId !== expectedActivityId) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Mã QR không thuộc sự kiện này.');
  }
  const expiresAt = Number(expStr);
  if (!Number.isFinite(expiresAt) || (sig.length !== 32 && sig.length !== 16)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Chữ ký QR không hợp lệ.');
  }
  const expectedSig = signQr(partActId, nonce, expiresAt, secret, sig.length);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Chữ ký mật mã QR không khớp (nghi vấn giả mạo).');
  }
  return { activityId: partActId, nonce, expiresAt };
}

const SECURITY_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin'
};

function jsonOk(data, requestId, status = 200, meta = null) {
  const body = meta ? { ok: true, data, meta, requestId } : { ok: true, data, requestId };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      'X-Request-Id': requestId
    }
  });
}

function jsonErr(status, code, message, requestId, details = null) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: { code, message, details },
      requestId
    }),
    {
      status,
      headers: {
        ...SECURITY_HEADERS,
        'X-Request-Id': requestId
      }
    }
  );
}

async function readBody(request, maxBytes = 65_536) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > maxBytes) {
    throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên vượt quá giới hạn an toàn.');
  }
  const text = await request.text();
  if (text.length > maxBytes) {
    throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên vượt quá giới hạn an toàn.');
  }
  if (!text) return {};
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Dữ liệu JSON không hợp lệ.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Cấu trúc JSON phải là đối tượng.');
  }
  assertNoPrototypePollution(parsed);
  return parsed;
}

function sanitizeCsvCell(value) {
  const str = String(value ?? '').replace(/\r?\n/g, ' ');
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

const USER_SELECT_SQL = `
  SELECT
    u.id, u.role_code, r.label AS role_label,
    r.can_manage_members, r.can_create_branch_event, r.can_create_ward_event,
    r.can_create_qr, r.can_view_ward_summary,
    COALESCE(u.ward_id, b.ward_id) AS effective_ward_id,
    u.branch_id, m.id AS member_id,
    u.username, u.phone, u.member_code, u.password_hash, u.full_name, u.is_active,
    EXTRACT(EPOCH FROM u.password_updated_at) AS password_updated_epoch,
    COALESCE(b.name, w.name) AS unit_name
  FROM users u
  JOIN roles r ON r.code = u.role_code
  LEFT JOIN branches b ON b.id = u.branch_id
  LEFT JOIN wards w ON w.id = COALESCE(u.ward_id, b.ward_id)
  LEFT JOIN members m ON m.user_id = u.id
`;

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: row.role_code,
    roleLabel: row.role_label,
    wardId: row.effective_ward_id,
    branchId: row.branch_id || null,
    memberId: row.member_id || null,
    username: row.username,
    phone: row.phone,
    memberCode: row.member_code,
    passwordHash: row.password_hash,
    passwordUpdatedEpoch: Number(row.password_updated_epoch || 0),
    fullName: row.full_name,
    unitName: row.unit_name || 'Đoàn Phường Tam Hiệp',
    isActive: Boolean(row.is_active),
    permissions: {
      canManageMembers: Boolean(row.can_manage_members),
      canCreateBranchEvent: Boolean(row.can_create_branch_event),
      canCreateWardEvent: Boolean(row.can_create_ward_event),
      canCreateQr: Boolean(row.can_create_qr),
      canViewWardSummary: Boolean(row.can_view_ward_summary)
    }
  };
}

function mapMember(row) {
  if (!row) return null;
  const rs = row.residence_status || 'local';
  const pts = Number(row.total_points || 0);
  return {
    id: row.id,
    branchId: row.branch_id,
    wardId: row.ward_id,
    chiDoan: row.branch_name || 'Chi đoàn Khu phố 5',
    maDoanVien: row.member_code,
    hoTen: row.full_name,
    sdt: row.phone || '',
    chucVu: row.position_title || 'Đoàn viên',
    residenceStatus: rs,
    trangThai: STATUS_LABEL[rs] || 'Đang ở địa phương',
    workShift: row.work_shift || 'day',
    gioCtxh: pts,
    attendedCount: Number(row.attended_count || 0),
    xepLoai: pts >= 24 ? 'Xuất sắc' : pts >= 14 ? 'Khá' : 'Trung bình',
    daDongDoanPhi: Boolean(row.fee_paid)
  };
}

const MEMBER_SELECT_SQL = `
  SELECT
    m.id, m.branch_id, b.ward_id, b.name AS branch_name,
    m.member_code, m.full_name, m.phone, m.position_title,
    m.residence_status, m.work_shift, m.fee_paid,
    COALESCE(v.total_points, 0) AS total_points,
    COALESCE(v.attended_count, 0) AS attended_count
  FROM members m
  JOIN branches b ON b.id = m.branch_id
  LEFT JOIN v_member_emulation_totals v ON v.member_id = m.id
`;

const ACTIVITY_SELECT_SQL = `
  SELECT
    a.id, a.scope, a.branch_id, b.name AS branch_name,
    COALESCE(a.ward_id, b.ward_id) AS effective_ward_id,
    a.title, a.activity_type, a.activity_date, a.start_time, a.end_time,
    a.location, a.latitude, a.longitude, a.geofence_radius_m, a.is_closed,
    a.emulation_points,
    COALESCE(ARRAY_AGG(ar.member_id) FILTER (WHERE ar.member_id IS NOT NULL), '{}') AS checked_in_member_ids,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'memberId', ar.member_id,
          'checkedInAt', TO_CHAR(ar.checked_in_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI'),
          'method', CASE WHEN ar.distance_m IS NOT NULL THEN 'QR + GPS' WHEN ar.check_in_method = 'makeup_qr' THEN 'Sinh hoạt bù' ELSE 'QR động' END,
          'distanceM', ar.distance_m,
          'accuracyM', ar.accuracy_m
        )
      ) FILTER (WHERE ar.member_id IS NOT NULL),
      '[]'::json
    ) AS checked_in_records,
    q.token AS latest_qr_token,
    q.expires_at AS latest_qr_expires_at,
    q.ttl_seconds AS latest_qr_ttl_seconds
  FROM activities a
  LEFT JOIN branches b ON b.id = a.branch_id
  LEFT JOIN attendance_records ar ON ar.activity_id = a.id
  LEFT JOIN LATERAL (
    SELECT token, expires_at, ttl_seconds
    FROM qr_sessions
    WHERE activity_id = a.id
    ORDER BY created_at DESC
    LIMIT 1
  ) q ON TRUE
`;

function mapActivity(row) {
  if (!row) return null;
  const pts = Number(row.emulation_points || 4);
  const dateStr =
    row.activity_date instanceof Date
      ? row.activity_date.toISOString().slice(0, 10)
      : String(row.activity_date || '').slice(0, 10);
  let qrSession = null;
  if (row.latest_qr_token) {
    const parts = String(row.latest_qr_token).split('.');
    qrSession = {
      activityId: row.id,
      token: row.latest_qr_token,
      code: parts[1] || String(row.latest_qr_token).slice(0, 6).toUpperCase(),
      expiresAt: Number(row.latest_qr_expires_at || 0),
      ttlSeconds: Number(row.latest_qr_ttl_seconds || 900)
    };
  }
  return {
    id: row.id,
    scope: row.scope,
    branchId: row.branch_id || null,
    chiDoan: row.branch_name || 'Đoàn Phường Tam Hiệp',
    wardId: row.effective_ward_id || row.ward_id || 'WARD-TAMHIEP',
    tenHoatDong: row.title,
    activityType: row.activity_type,
    ngayToChuc: dateStr,
    khungGio: `${row.start_time || '19:00'} - ${row.end_time || '20:30'}`,
    diaDiem: row.location || '',
    latitude: Number(row.latitude ?? 10.957412),
    longitude: Number(row.longitude ?? 106.842685),
    geofenceRadiusM: Number(row.geofence_radius_m || 150),
    isClosed: Boolean(row.is_closed),
    gioCongTacXaHoi: pts,
    emulationPoints: pts,
    checkedInMemberIds: Array.isArray(row.checked_in_member_ids) ? row.checked_in_member_ids : [],
    checkedInRecords: Array.isArray(row.checked_in_records) ? row.checked_in_records : [],
    qrSession
  };
}

function mapNews(row) {
  if (!row) return null;
  return {
    id: row.id,
    wardId: row.ward_id,
    category: row.category,
    source: row.source_name,
    location: row.location,
    publishedAt: row.published_at_label,
    image: row.image_path,
    title: row.title,
    summary: row.summary,
    content: row.content,
    featured: Boolean(row.is_featured),
    authorUserId: row.author_user_id || null
  };
}

function mapReminder(row) {
  if (!row) return null;
  const channels = Array.isArray(row.channels) ? row.channels : [];
  const dueStr =
    row.due_at instanceof Date
      ? row.due_at.toISOString().slice(0, 16).replace('T', ' ')
      : String(row.due_at || '').slice(0, 16).replace('T', ' ');
  return {
    id: row.id,
    scope: row.scope,
    branchId: row.branch_id || null,
    wardId: row.effective_ward_id || row.ward_id || 'WARD-TAMHIEP',
    tieuDe: row.title,
    hanChot: dueStr,
    nhacTruoc: row.remind_before || 'Trước 24 giờ',
    chuKy: DB_TO_RECURRENCE[row.recurrence] || 'Hàng tháng',
    kenhNhac:
      channels.length > 0
        ? channels.map((c) => CHANNEL_TO_LABEL[c] || c).join(' + ')
        : 'Zalo OA + Web Push',
    batNhacTuDong: Boolean(row.auto_enabled),
    daHoanThanh: Boolean(row.is_completed)
  };
}

function mapMakeup(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    memberId: row.member_id,
    memberCode: row.member_code,
    memberName: row.member_name,
    branchId: row.branch_id,
    branchName: row.branch_name,
    workShift: row.work_shift || 'rotating_shift',
    missedActivityId: row.missed_activity_id,
    missedActivityTitle: row.missed_title || row.missed_activity_id,
    makeupActivityId: row.makeup_activity_id,
    makeupActivityTitle: row.makeup_title || row.makeup_activity_id,
    makeupDate:
      row.makeup_date instanceof Date
        ? row.makeup_date.toISOString().slice(0, 10)
        : String(row.makeup_date || '').slice(0, 10),
    shiftReason: row.shift_reason,
    status: row.status,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString().slice(0, 16).replace('T', ' ')
        : String(row.created_at || '').slice(0, 16).replace('T', ' ')
  };
}

function buildReportSummary(members, activities, user, period = 'month') {
  const totalMembers = members.length;
  const localCount = members.filter((m) => m.residenceStatus === 'local').length;
  const migrantWorkerCount = members.filter((m) => m.residenceStatus === 'migrant_worker').length;
  const transferredCount = members.filter((m) => m.residenceStatus === 'transferred').length;
  const feePaidCount = members.filter((m) => Boolean(m.daDongDoanPhi)).length;
  const feePaidPct = totalMembers ? Math.round((feePaidCount / totalMembers) * 100) : 0;
  const totalSocialHours = members.reduce((sum, m) => sum + Number(m.gioCtxh || 0), 0);

  const regularMeetings = activities.filter((a) => a.activityType === 'regular_meeting');
  const closedWithAttendance = activities.filter(
    (a) => a.isClosed && (a.checkedInMemberIds ? a.checkedInMemberIds.length : 0) > 0
  );
  const baseActivities =
    regularMeetings.length > 0
      ? regularMeetings
      : closedWithAttendance.length > 0
        ? closedWithAttendance
        : activities;
  const totalCheckins = activities.reduce(
    (sum, a) => sum + (a.checkedInMemberIds ? a.checkedInMemberIds.length : 0),
    0
  );
  const baseCheckins = baseActivities.reduce(
    (sum, a) => sum + (a.checkedInMemberIds ? a.checkedInMemberIds.length : 0),
    0
  );
  const expectedParticipants = baseActivities.reduce((sum, a) => {
    if (a.scope === 'branch' && a.branchId) {
      return sum + members.filter((m) => (m.branchId || 'BR-KP5') === a.branchId).length;
    }
    return sum + totalMembers;
  }, 0);
  const avgAttendancePct =
    expectedParticipants > 0
      ? Math.min(100, Math.round((baseCheckins / expectedParticipants) * 100))
      : 0;

  const branchMap = new Map();
  for (const m of members) {
    const bId = m.branchId || 'BR-KP5';
    if (!branchMap.has(bId)) {
      branchMap.set(bId, {
        branchId: bId,
        branchName: m.chiDoan || bId,
        memberIds: new Set(),
        totalMembers: 0,
        localCount: 0,
        migrantWorkerCount: 0,
        transferredCount: 0,
        feePaidCount: 0,
        totalSocialHours: 0
      });
    }
    const b = branchMap.get(bId);
    b.memberIds.add(m.id);
    b.totalMembers += 1;
    if (m.residenceStatus === 'local') b.localCount += 1;
    if (m.residenceStatus === 'migrant_worker') b.migrantWorkerCount += 1;
    if (m.residenceStatus === 'transferred') b.transferredCount += 1;
    if (m.daDongDoanPhi) b.feePaidCount += 1;
    b.totalSocialHours += Number(m.gioCtxh || 0);
  }

  const branchSummary = Array.from(branchMap.values()).map((b) => {
    const branchMeetings = activities.filter(
      (a) => a.branchId === b.branchId && (a.activityType === 'regular_meeting' || a.isClosed)
    );
    const branchCheckins = branchMeetings.reduce(
      (sum, a) => sum + (a.checkedInMemberIds || []).filter((id) => b.memberIds.has(id)).length,
      0
    );
    const attendancePct =
      branchMeetings.length && b.totalMembers
        ? Math.min(100, Math.round((branchCheckins / (branchMeetings.length * b.totalMembers)) * 100))
        : 0;
    const recentMeetingCounts = branchMeetings
      .slice(0, 3)
      .map((a) => (a.checkedInMemberIds || []).filter((id) => b.memberIds.has(id)).length);

    return {
      branchId: b.branchId,
      branchName: b.branchName,
      totalMembers: b.totalMembers,
      localCount: b.localCount,
      migrantWorkerCount: b.migrantWorkerCount,
      transferredCount: b.transferredCount,
      feePaidCount: b.feePaidCount,
      feePaidPct: b.totalMembers ? Math.round((b.feePaidCount / b.totalMembers) * 100) : 0,
      attendancePct,
      meetingsCount: branchMeetings.length,
      recentMeetingCounts,
      totalSocialHours: b.totalSocialHours
    };
  });

  return {
    period,
    scope: user.role === 'ward_officer' ? 'ward' : 'branch',
    unitName: user.unitName,
    totalMembers,
    localCount,
    migrantWorkerCount,
    transferredCount,
    feePaidCount,
    feePaidPct,
    totalActivities: activities.length,
    totalCheckins,
    avgAttendancePct,
    totalSocialHours,
    branchSummary
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);
  const subPath = url.pathname.replace(/^\/api\/v1/, '') || '/';
  const method = request.method.toUpperCase();

  try {
    const cleanDbUrl = String(env?.DATABASE_URL || '').replace(/^\uFEFF/, '').trim();
    if (!cleanDbUrl) {
      return jsonErr(503, 'DB_UNCONFIGURED', 'Chưa cấu hình DATABASE_URL cho Neon.', requestId);
    }

    const sql = neon(cleanDbUrl);
    const db = {
      query: async (text, params = []) => ({ rows: await sql.query(text, params) })
    };
    const jwtSecret = String(env.JWT_SECRET || 'dev-only-jwt-secret-min-32-chars-dongnai')
      .replace(/^\uFEFF/, '')
      .trim();

    if (subPath === '/health' && method === 'GET') {
      await db.query('SELECT 1');
      return jsonOk(
        {
          service: 'so-tay-chi-doan-pages-api',
          status: 'ok',
          database: 'connected',
          domain: 'https://sotaychidoan.pages.dev',
          timestamp: new Date().toISOString()
        },
        requestId
      );
    }

    // Two-stage scientific authentication: JWT cryptographic check + live PostgreSQL user/revocation state check
    const requireAuthAsync = async () => {
      const auth = request.headers.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
      const decoded = verifyJwt(token, jwtSecret);
      if (!decoded) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
      }
      const res = await db.query(`${USER_SELECT_SQL} WHERE u.id = $1 LIMIT 1`, [decoded.id]);
      const liveUser = mapUser(res.rows[0]);
      if (!liveUser || !liveUser.isActive) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Tài khoản không tồn tại hoặc đã bị khóa.');
      }
      if (decoded.iat && liveUser.passwordUpdatedEpoch && decoded.iat < Math.floor(liveUser.passwordUpdatedEpoch) - 10) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Mật khẩu đã thay đổi, vui lòng đăng nhập lại.');
      }
      const { passwordHash: _ph, passwordUpdatedEpoch: _pe, ...safeLiveUser } = liveUser;
      return safeLiveUser;
    };

    const requireRole = (user, ...roles) => {
      if (!roles.includes(user.role)) {
        throw new HttpError(403, 'FORBIDDEN', 'Vai trò của bạn không được phép thực hiện thao tác này.');
      }
    };

    const findUserByIdentifier = async (identifier) => {
      const cleaned = sanitizePlainText(identifier, 80);
      if (!cleaned) return null;
      const lower = cleaned.toLowerCase();
      const phoneDigits = normalizePhone(cleaned);
      const res = await db.query(
        `${USER_SELECT_SQL}
         WHERE LOWER(u.username) = $1
            OR LOWER(u.member_code) = $1
            OR REPLACE(REPLACE(COALESCE(u.phone, ''), ' ', ''), '.', '') = $2
         LIMIT 1`,
        [lower, phoneDigits]
      );
      return mapUser(res.rows[0]);
    };

    // Auth endpoints
    if (subPath === '/auth/identify' && method === 'POST') {
      checkRateLimit(request, 'auth-identify', 120, 60_000);
      const body = await readBody(request);
      const user = await findUserByIdentifier(body.identifier);
      if (!user || !user.isActive) return jsonOk({ found: false }, requestId);
      return jsonOk(
        {
          found: true,
          role: user.role,
          roleLabel: user.roleLabel,
          unitName: user.unitName,
          permissions: user.permissions
        },
        requestId
      );
    }

    if (subPath === '/auth/login' && method === 'POST') {
      checkRateLimit(request, 'auth-login', 60, 60_000);
      const body = await readBody(request);
      const user = await findUserByIdentifier(body.identifier);
      if (!user || !user.isActive || !verifyPassword(body.password, user.passwordHash)) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Sai tài khoản, mã đoàn viên hoặc mật khẩu.');
      }
      const { passwordHash: _ignored, passwordUpdatedEpoch: _epoch, ...safeUser } = user;
      const accessToken = signJwt(safeUser, jwtSecret);
      return jsonOk({ accessToken, user: safeUser }, requestId);
    }

    if (subPath === '/auth/change-password' && method === 'POST') {
      checkRateLimit(request, 'auth-chg-pwd', 10, 60_000);
      const authUser = await requireAuthAsync();
      const body = await readBody(request);
      const currentPwd = String(body.currentPassword || '');
      const nextPwd = String(body.newPassword || '');
      if (!currentPwd || nextPwd.length < 6 || nextPwd.length > 128) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Mật khẩu mới phải từ 6 đến 128 ký tự.');
      }
      if (nextPwd !== body.confirmNewPassword) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Xác nhận mật khẩu mới không khớp.');
      }
      if (nextPwd === currentPwd) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Mật khẩu mới phải khác mật khẩu hiện tại.');
      }
      const res = await db.query(`${USER_SELECT_SQL} WHERE u.id = $1 LIMIT 1`, [authUser.id]);
      const full = mapUser(res.rows[0]);
      if (!full || !verifyPassword(currentPwd, full.passwordHash)) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Mật khẩu hiện tại không chính xác.');
      }
      const nextHash = hashPassword(nextPwd);
      await db.query(`UPDATE users SET password_hash = $2, password_updated_at = NOW() WHERE id = $1`, [
        authUser.id,
        nextHash
      ]);
      const refreshedToken = signJwt(authUser, jwtSecret);
      return jsonOk(
        { updated: true, updatedAt: new Date().toISOString(), accessToken: refreshedToken },
        requestId
      );
    }

    // News endpoints
    if (subPath === '/news' && method === 'GET') {
      const user = await requireAuthAsync();
      const category = sanitizePlainText(url.searchParams.get('category') || 'all', 40);
      const wardId = user.wardId || 'WARD-TAMHIEP';
      const params = [wardId];
      let querySql = `
        SELECT id, ward_id, category, source_name, location, published_at_label,
               image_path, title, summary, content, is_featured, author_user_id
        FROM news WHERE ward_id = $1
      `;
      if (category !== 'all') {
        params.push(category);
        querySql += ` AND category = $2`;
      }
      querySql += ` ORDER BY is_featured DESC, created_at DESC, id ASC`;
      const res = await db.query(querySql, params);
      const data = res.rows.map(mapNews);
      return jsonOk(data, requestId, 200, { total: data.length });
    }

    if (subPath === '/news' && method === 'POST') {
      const user = await requireAuthAsync();
      requireRole(user, 'ward_officer');
      const body = await readBody(request, 2_200_000);
      assertNoMaliciousPayload(body.title, 'Tiêu đề');
      assertNoMaliciousPayload(body.summary, 'Tóm tắt');
      assertNoMaliciousPayload(body.content, 'Nội dung');

      const title = sanitizePlainText(body.title, 200);
      const summary = sanitizeMultilineText(body.summary, 600);
      const content = sanitizeMultilineText(body.content || summary, 6000);
      if (title.length < 4 || summary.length < 6) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Tiêu đề hoặc tóm tắt bản tin quá ngắn.');
      }
      const allowedCategories = ['Phong trào', 'Chỉ đạo Đoàn', 'Chi đoàn KP5', 'Thông báo'];
      const category = allowedCategories.includes(body.category) ? body.category : 'Phong trào';
      const safeImage = sanitizeSafeImage(body.image, 'news/ra-quan.jpg');
      const wardId = user.wardId || 'WARD-TAMHIEP';
      const id = `NEWS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;

      if (body.featured) {
        await db.query(`UPDATE news SET is_featured = FALSE WHERE ward_id = $1`, [wardId]);
      }
      await db.query(
        `INSERT INTO news (id, ward_id, category, source_name, location, published_at_label, image_path, title, summary, content, is_featured, author_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          wardId,
          category,
          sanitizePlainText(body.source || 'Đoàn Phường Tam Hiệp', 80) || 'Đoàn Phường Tam Hiệp',
          sanitizePlainText(body.location || 'Phường Tam Hiệp, TP. Biên Hòa', 120),
          sanitizePlainText(body.publishedAt || new Date().toLocaleDateString('vi-VN'), 30),
          safeImage,
          title,
          summary,
          content || summary,
          Boolean(body.featured),
          user.id
        ]
      );
      const created = await db.query(
        `SELECT id, ward_id, category, source_name, location, published_at_label, image_path, title, summary, content, is_featured, author_user_id FROM news WHERE id = $1 LIMIT 1`,
        [id]
      );
      return jsonOk(mapNews(created.rows[0]), requestId, 201);
    }

    const newsIdMatch = subPath.match(/^\/news\/([^/]+)$/);
    if (newsIdMatch && (method === 'PATCH' || method === 'DELETE')) {
      const user = await requireAuthAsync();
      requireRole(user, 'ward_officer');
      const id = decodeURIComponent(newsIdMatch[1]);
      const existingRes = await db.query(`SELECT id, ward_id FROM news WHERE id = $1 LIMIT 1`, [id]);
      if (!existingRes.rows[0]) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy bản tin.');
      if (method === 'DELETE') {
        await db.query(`DELETE FROM news WHERE id = $1`, [id]);
        return jsonOk({ deleted: true, id }, requestId);
      }
      const body = await readBody(request, 2_200_000);
      if (body.title !== undefined) assertNoMaliciousPayload(body.title, 'Tiêu đề');
      if (body.summary !== undefined) assertNoMaliciousPayload(body.summary, 'Tóm tắt');
      if (body.content !== undefined) assertNoMaliciousPayload(body.content, 'Nội dung');

      if (body.featured) {
        await db.query(`UPDATE news SET is_featured = FALSE WHERE ward_id = $1 AND id <> $2`, [
          existingRes.rows[0].ward_id,
          id
        ]);
      }
      const sets = ['updated_at = NOW()'];
      const params = [id];
      const allowedCategories = ['Phong trào', 'Chỉ đạo Đoàn', 'Chi đoàn KP5', 'Thông báo'];
      if (body.title !== undefined) {
        params.push(sanitizePlainText(body.title, 200));
        sets.push(`title = $${params.length}`);
      }
      if (body.category !== undefined && allowedCategories.includes(body.category)) {
        params.push(body.category);
        sets.push(`category = $${params.length}`);
      }
      if (body.source !== undefined) {
        params.push(sanitizePlainText(body.source, 80));
        sets.push(`source_name = $${params.length}`);
      }
      if (body.location !== undefined) {
        params.push(sanitizePlainText(body.location, 120));
        sets.push(`location = $${params.length}`);
      }
      if (body.publishedAt !== undefined) {
        params.push(sanitizePlainText(body.publishedAt, 30));
        sets.push(`published_at_label = $${params.length}`);
      }
      if (body.image !== undefined) {
        params.push(sanitizeSafeImage(body.image));
        sets.push(`image_path = $${params.length}`);
      }
      if (body.summary !== undefined) {
        params.push(sanitizeMultilineText(body.summary, 600));
        sets.push(`summary = $${params.length}`);
      }
      if (body.content !== undefined) {
        params.push(sanitizeMultilineText(body.content, 6000));
        sets.push(`content = $${params.length}`);
      }
      if (body.featured !== undefined) {
        params.push(Boolean(body.featured));
        sets.push(`is_featured = $${params.length}`);
      }
      await db.query(`UPDATE news SET ${sets.join(', ')} WHERE id = $1`, params);
      const updated = await db.query(
        `SELECT id, ward_id, category, source_name, location, published_at_label, image_path, title, summary, content, is_featured, author_user_id FROM news WHERE id = $1 LIMIT 1`,
        [id]
      );
      return jsonOk(mapNews(updated.rows[0]), requestId);
    }

    // Members endpoints
    if (subPath === '/members/me' && method === 'GET') {
      const user = await requireAuthAsync();
      if (!user.memberId) {
        return jsonOk(
          {
            id: user.id,
            maDoanVien: user.memberCode || user.username,
            hoTen: user.fullName,
            chiDoan: user.unitName,
            chucVu: user.roleLabel,
            gioCtxh: 0,
            daDongDoanPhi: true
          },
          requestId
        );
      }
      const res = await db.query(`${MEMBER_SELECT_SQL} WHERE m.id = $1 LIMIT 1`, [user.memberId]);
      if (!res.rows[0]) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy hồ sơ đoàn viên.');
      return jsonOk(mapMember(res.rows[0]), requestId);
    }

    if (subPath === '/members/ledger' && method === 'GET') {
      const user = await requireAuthAsync();
      let whereSql = 'WHERE e.member_id = $1';
      let params = [user.memberId || '__none__'];
      if (user.role === 'ward_officer') {
        whereSql = 'WHERE b.ward_id = $1';
        params = [user.wardId || 'WARD-TAMHIEP'];
      } else if (user.role === 'branch_secretary') {
        whereSql = 'WHERE m.branch_id = $1';
        params = [user.branchId || 'BR-KP5'];
      }
      const res = await db.query(
        `SELECT e.id, e.member_id, e.activity_id, COALESCE(a.title, e.reason) AS activity_title,
                e.points, e.awarded_at, COALESCE(u.full_name, 'Hệ thống') AS approved_by,
                ar.check_in_method, ar.distance_m
         FROM emulation_point_ledger e
         JOIN members m ON m.id = e.member_id
         JOIN branches b ON b.id = m.branch_id
         LEFT JOIN activities a ON a.id = e.activity_id
         LEFT JOIN users u ON u.id = e.awarded_by_user_id
         LEFT JOIN attendance_records ar ON ar.activity_id = e.activity_id AND ar.member_id = e.member_id
         ${whereSql}
         ORDER BY e.awarded_at DESC, e.id DESC`,
        params
      );
      const data = res.rows.map((r) => ({
        id: `LG-${r.id}`,
        memberId: r.member_id,
        activityId: r.activity_id || null,
        activityTitle: r.activity_title,
        hours: Number(r.points || 0),
        method:
          r.distance_m !== null && r.distance_m !== undefined
            ? `QR + GPS (${r.distance_m}m)`
            : r.check_in_method === 'makeup_qr'
              ? 'Sinh hoạt bù'
              : 'QR động',
        recordedAt:
          r.awarded_at instanceof Date
            ? r.awarded_at.toISOString().slice(0, 16).replace('T', ' ')
            : String(r.awarded_at || '').slice(0, 16).replace('T', ' '),
        approvedBy: r.approved_by
      }));
      return jsonOk(data, requestId, 200, { total: data.length });
    }

    const fetchScopedMembers = async (user, { q = '', status = 'all', branchId = '' } = {}) => {
      const params = [];
      const where = [];
      if (user.role === 'branch_secretary') {
        params.push(user.branchId);
        where.push(`m.branch_id = $${params.length}`);
      } else if (branchId) {
        params.push(sanitizePlainText(branchId, 32));
        where.push(`m.branch_id = $${params.length}`);
      } else {
        params.push(user.wardId || 'WARD-TAMHIEP');
        where.push(`b.ward_id = $${params.length}`);
      }
      if (status && status !== 'all') {
        params.push(normalizeResidenceStatus(status));
        where.push(`m.residence_status = $${params.length}`);
      }
      const cleanQ = sanitizePlainText(q, 80);
      if (cleanQ) {
        params.push(`%${cleanQ.toLowerCase()}%`);
        where.push(
          `(LOWER(m.full_name) LIKE $${params.length} OR LOWER(m.member_code) LIKE $${params.length} OR LOWER(m.phone) LIKE $${params.length})`
        );
      }
      const res = await db.query(
        `${MEMBER_SELECT_SQL} WHERE ${where.join(' AND ')} ORDER BY m.created_at DESC, m.id ASC`,
        params
      );
      return res.rows.map(mapMember);
    };

    if (subPath === '/members' && method === 'GET') {
      const user = await requireAuthAsync();
      requireRole(user, 'branch_secretary', 'ward_officer');
      const data = await fetchScopedMembers(user, {
        q: url.searchParams.get('q') || '',
        status: url.searchParams.get('status') || 'all',
        branchId: url.searchParams.get('branchId') || ''
      });
      return jsonOk(data, requestId, 200, { total: data.length });
    }

    if (subPath === '/members' && method === 'POST') {
      const user = await requireAuthAsync();
      requireRole(user, 'branch_secretary');
      const body = await readBody(request);
      assertNoMaliciousPayload(body.hoTen, 'Họ tên');
      assertNoMaliciousPayload(body.maDoanVien, 'Mã đoàn viên');

      const code = sanitizePlainText(body.maDoanVien, 32).toUpperCase();
      const fullName = sanitizePlainText(body.hoTen, 80);
      if (!MEMBER_CODE_RE.test(code) || fullName.length < 2) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Mã đoàn viên hoặc họ tên không hợp lệ.');
      }
      const dup = await db.query(`SELECT id FROM members WHERE member_code = $1 LIMIT 1`, [code]);
      if (dup.rows[0]) throw new HttpError(409, 'CONFLICT', 'Mã đoàn viên đã tồn tại.');
      const id = `DV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
      const rs = normalizeResidenceStatus(body.residenceStatus || body.trangThai);
      const ws = normalizeWorkShift(body.workShift);
      await db.query(
        `INSERT INTO members (id, branch_id, member_code, full_name, phone, position_title, residence_status, work_shift, fee_paid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          user.branchId,
          code,
          fullName,
          sanitizePlainText(body.sdt || '', 20),
          sanitizePlainText(body.chucVu || 'Đoàn viên', 50) || 'Đoàn viên',
          rs,
          ws,
          Boolean(body.daDongDoanPhi ?? true)
        ]
      );
      const initPts = Math.min(200, Math.max(0, Math.round(Number(body.gioCtxh || 0))));
      if (initPts > 0) {
        await db.query(
          `INSERT INTO emulation_point_ledger (member_id, points, reason, awarded_by_user_id)
           VALUES ($1, $2, $3, $4)`,
          [id, initPts, 'Giờ CTXH / Điểm thi đua khởi tạo', user.id]
        );
      }
      const created = await db.query(`${MEMBER_SELECT_SQL} WHERE m.id = $1 LIMIT 1`, [id]);
      return jsonOk(mapMember(created.rows[0]), requestId, 201);
    }

    if (subPath === '/members/import' && method === 'POST') {
      const user = await requireAuthAsync();
      requireRole(user, 'branch_secretary');
      const body = await readBody(request, 262_144);
      const items = Array.isArray(body.members) ? body.members.slice(0, 200) : [];
      const inserted = [];
      for (const item of items) {
        const code = sanitizePlainText(item?.maDoanVien, 32).toUpperCase();
        const fullName = sanitizePlainText(item?.hoTen, 80);
        if (!MEMBER_CODE_RE.test(code) || fullName.length < 2) continue;
        const dup = await db.query(`SELECT id FROM members WHERE member_code = $1 LIMIT 1`, [code]);
        if (dup.rows[0]) continue;
        const id = `DV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
        const rs = normalizeResidenceStatus(item.residenceStatus || item.trangThai);
        const ws = normalizeWorkShift(item.workShift);
        await db.query(
          `INSERT INTO members (id, branch_id, member_code, full_name, phone, position_title, residence_status, work_shift, fee_paid)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id,
            user.branchId,
            code,
            fullName,
            sanitizePlainText(item.sdt || '', 20),
            sanitizePlainText(item.chucVu || 'Đoàn viên', 50) || 'Đoàn viên',
            rs,
            ws,
            Boolean(item.daDongDoanPhi ?? true)
          ]
        );
        const created = await db.query(`${MEMBER_SELECT_SQL} WHERE m.id = $1 LIMIT 1`, [id]);
        inserted.push(mapMember(created.rows[0]));
      }
      return jsonOk({ importedCount: inserted.length, items: inserted }, requestId, 201);
    }

    const memberIdMatch = subPath.match(/^\/members\/([^/]+)$/);
    if (memberIdMatch && (method === 'PATCH' || method === 'DELETE')) {
      const user = await requireAuthAsync();
      requireRole(user, 'branch_secretary');
      const id = decodeURIComponent(memberIdMatch[1]);
      const existingRes = await db.query(`${MEMBER_SELECT_SQL} WHERE m.id = $1 LIMIT 1`, [id]);
      const existing = mapMember(existingRes.rows[0]);
      if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy đoàn viên.');
      if (existing.branchId !== user.branchId) {
        throw new HttpError(403, 'FORBIDDEN', 'Bí thư chỉ được quản lý đoàn viên thuộc Chi đoàn mình.');
      }
      if (method === 'DELETE') {
        await db.query(`DELETE FROM members WHERE id = $1`, [id]);
        return jsonOk({ deletedId: id }, requestId);
      }
      const body = await readBody(request);
      const sets = [];
      const params = [id];
      if (body.maDoanVien !== undefined) {
        const code = sanitizePlainText(body.maDoanVien, 32).toUpperCase();
        if (!MEMBER_CODE_RE.test(code)) throw new HttpError(400, 'VALIDATION_ERROR', 'Mã đoàn viên không hợp lệ.');
        params.push(code);
        sets.push(`member_code = $${params.length}`);
      }
      if (body.hoTen !== undefined) {
        assertNoMaliciousPayload(body.hoTen, 'Họ tên');
        const fullName = sanitizePlainText(body.hoTen, 80);
        if (fullName.length < 2) throw new HttpError(400, 'VALIDATION_ERROR', 'Họ tên không hợp lệ.');
        params.push(fullName);
        sets.push(`full_name = $${params.length}`);
      }
      if (body.sdt !== undefined) {
        params.push(sanitizePlainText(body.sdt, 20));
        sets.push(`phone = $${params.length}`);
      }
      if (body.chucVu !== undefined) {
        params.push(sanitizePlainText(body.chucVu, 50));
        sets.push(`position_title = $${params.length}`);
      }
      if (body.residenceStatus !== undefined || body.trangThai !== undefined) {
        params.push(normalizeResidenceStatus(body.residenceStatus || body.trangThai));
        sets.push(`residence_status = $${params.length}`);
      }
      if (body.workShift !== undefined) {
        params.push(normalizeWorkShift(body.workShift));
        sets.push(`work_shift = $${params.length}`);
      }
      if (body.daDongDoanPhi !== undefined) {
        params.push(Boolean(body.daDongDoanPhi));
        sets.push(`fee_paid = $${params.length}`);
      }
      if (sets.length > 0) {
        sets.push('updated_at = NOW()');
        await db.query(`UPDATE members SET ${sets.join(', ')} WHERE id = $1`, params);
      }
      const updated = await db.query(`${MEMBER_SELECT_SQL} WHERE m.id = $1 LIMIT 1`, [id]);
      return jsonOk(mapMember(updated.rows[0]), requestId);
    }

    // Attendance & QR+GPS endpoints
    const fetchScopedActivities = async (user) => {
      if (user.role === 'ward_officer') {
        const res = await db.query(
          `${ACTIVITY_SELECT_SQL}
           WHERE COALESCE(a.ward_id, b.ward_id) = $1
           GROUP BY a.id, b.name, b.ward_id, q.token, q.expires_at, q.ttl_seconds
           ORDER BY a.is_closed ASC, a.activity_date DESC, a.id ASC`,
          [user.wardId || 'WARD-TAMHIEP']
        );
        return res.rows.map(mapActivity);
      }
      const res = await db.query(
        `${ACTIVITY_SELECT_SQL}
         WHERE a.branch_id = $1 OR (a.scope = 'ward' AND a.ward_id = $2)
         GROUP BY a.id, b.name, b.ward_id, q.token, q.expires_at, q.ttl_seconds
         ORDER BY a.is_closed ASC, a.activity_date DESC, a.id ASC`,
        [user.branchId || 'BR-KP5', user.wardId || 'WARD-TAMHIEP']
      );
      return res.rows.map(mapActivity);
    };

    if (subPath === '/attendance/activities' && method === 'GET') {
      const user = await requireAuthAsync();
      const data = await fetchScopedActivities(user);
      return jsonOk(data, requestId, 200, { total: data.length });
    }

    if (subPath === '/attendance/activities' && method === 'POST') {
      const user = await requireAuthAsync();
      requireRole(user, 'ward_officer');
      const body = await readBody(request);
      assertNoMaliciousPayload(body.tenHoatDong, 'Tên sự kiện');
      assertNoMaliciousPayload(body.diaDiem, 'Địa điểm');

      const title = sanitizePlainText(body.tenHoatDong, 180);
      const location = sanitizePlainText(body.diaDiem, 180);
      if (title.length < 3 || location.length < 2) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Thiếu tên sự kiện hoặc địa điểm hợp lệ.');
      }
      const id = `ACT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
      const timeParts = String(body.khungGio || '07:00 - 11:00').split('-');
      const startTime = sanitizePlainText(timeParts[0] || '07:00', 10) || '07:00';
      const endTime = sanitizePlainText(timeParts[1] || '11:00', 10) || '11:00';
      const points = Math.min(48, Math.max(1, Math.round(Number(body.emulationPoints ?? body.gioCongTacXaHoi ?? 4))));
      const lat = Number(body.latitude ?? 10.957412);
      const lon = Number(body.longitude ?? 106.842685);
      if (!validNum(lat, -90, 90) || !validNum(lon, -180, 180)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Tọa độ GPS sự kiện không hợp lệ.');
      }
      const radius = Math.min(5000, Math.max(25, Math.round(Number(body.geofenceRadiusM || 150))));
      const actDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.ngayToChuc || ''))
        ? body.ngayToChuc
        : new Date().toISOString().slice(0, 10);
      const allowedTypes = ['regular_meeting', 'makeup_meeting', 'volunteer'];
      const activityType = allowedTypes.includes(body.activityType) ? body.activityType : 'volunteer';

      await db.query(
        `INSERT INTO activities (
           id, scope, branch_id, ward_id, title, activity_type, activity_date, start_time, end_time,
           location, latitude, longitude, geofence_radius_m, is_closed, status, emulation_points, created_by_user_id
         ) VALUES ($1, 'ward', NULL, $2, $3, $4, $5::date, $6, $7, $8, $9, $10, $11, FALSE, 'ongoing', $12, $13)`,
        [
          id,
          user.wardId || 'WARD-TAMHIEP',
          title,
          activityType,
          actDate,
          startTime,
          endTime,
          location,
          lat,
          lon,
          radius,
          points,
          user.id
        ]
      );

      const ttlSeconds = 900;
      const nonce = randomBytes(4).toString('hex').toUpperCase();
      const expiresAt = Date.now() + ttlSeconds * 1000;
      const sig = signQr(id, nonce, expiresAt, jwtSecret, 32);
      const token = `${id}.${nonce}.${expiresAt}.${sig}`;
      await db.query(
        `INSERT INTO qr_sessions (token, activity_id, created_by_user_id, expires_at, ttl_seconds)
         VALUES ($1, $2, $3, $4, $5)`,
        [token, id, user.id, expiresAt, ttlSeconds]
      );

      const created = await db.query(
        `${ACTIVITY_SELECT_SQL} WHERE a.id = $1 GROUP BY a.id, b.name, b.ward_id, q.token, q.expires_at, q.ttl_seconds LIMIT 1`,
        [id]
      );
      return jsonOk(mapActivity(created.rows[0]), requestId, 201);
    }

    // Factor-1 Server-side QR Token Verification (instant cross-role resolution)
    if (subPath === '/attendance/verify-qr' && method === 'POST') {
      checkRateLimit(request, 'verify-qr', 30, 60_000);
      const user = await requireAuthAsync();
      const body = await readBody(request);
      const token = String(body.token || '').trim();
      const verified = verifySignedQrToken(token, body.activityId || null, jwtSecret);
      const qrRow = await db.query(`SELECT token, expires_at FROM qr_sessions WHERE token = $1 LIMIT 1`, [token]);
      if (!qrRow.rows[0]) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Phiên QR không tồn tại trên hệ thống.');
      }
      if (Date.now() > verified.expiresAt) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Mã QR đã hết hiệu lực. Vui lòng quét mã mới.');
      }
      const actRes = await db.query(
        `${ACTIVITY_SELECT_SQL} WHERE a.id = $1 GROUP BY a.id, b.name, b.ward_id, q.token, q.expires_at, q.ttl_seconds LIMIT 1`,
        [verified.activityId]
      );
      const act = mapActivity(actRes.rows[0]);
      if (!act) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy sự kiện.');
      if (act.wardId !== (user.wardId || 'WARD-TAMHIEP')) {
        throw new HttpError(403, 'FORBIDDEN', 'Sự kiện không thuộc đơn vị của bạn.');
      }
      if (act.isClosed) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Sự kiện này đã đóng điểm danh.');
      }
      return jsonOk({ valid: true, activity: act, token }, requestId);
    }

    const qrSessionMatch = subPath.match(/^\/attendance\/activities\/([^/]+)\/qr-session$/);
    if (qrSessionMatch && method === 'POST') {
      const user = await requireAuthAsync();
      requireRole(user, 'ward_officer');
      const activityId = decodeURIComponent(qrSessionMatch[1]);
      const body = await readBody(request);
      const actRes = await db.query(
        `${ACTIVITY_SELECT_SQL} WHERE a.id = $1 GROUP BY a.id, b.name, b.ward_id, q.token, q.expires_at, q.ttl_seconds LIMIT 1`,
        [activityId]
      );
      const act = mapActivity(actRes.rows[0]);
      if (!act) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy hoạt động.');
      if (act.isClosed) throw new HttpError(400, 'VALIDATION_ERROR', 'Sự kiện đã đóng điểm danh.');

      const ttlSeconds = Math.min(3600, Math.max(15, Number(body.ttlSeconds || 900)));
      const nonce = randomBytes(4).toString('hex').toUpperCase();
      const expiresAt = Date.now() + ttlSeconds * 1000;
      const sig = signQr(activityId, nonce, expiresAt, jwtSecret, 32);
      const token = `${activityId}.${nonce}.${expiresAt}.${sig}`;
      await db.query(
        `INSERT INTO qr_sessions (token, activity_id, created_by_user_id, expires_at, ttl_seconds)
         VALUES ($1, $2, $3, $4, $5)`,
        [token, activityId, user.id, expiresAt, ttlSeconds]
      );
      return jsonOk({ activityId, code: nonce, token, expiresAt, ttlSeconds }, requestId, 201);
    }

    const locMatch = subPath.match(/^\/attendance\/activities\/([^/]+)\/location$/);
    if (locMatch && method === 'PATCH') {
      const user = await requireAuthAsync();
      requireRole(user, 'ward_officer');
      const activityId = decodeURIComponent(locMatch[1]);
      const body = await readBody(request);
      const lat = Number(body.latitude);
      const lon = Number(body.longitude);
      if (!validNum(lat, -90, 90) || !validNum(lon, -180, 180)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Tọa độ GPS mới không hợp lệ.');
      }
      const radius = Math.min(5000, Math.max(25, Math.round(Number(body.geofenceRadiusM || 200))));
      const existing = await db.query(`SELECT id, location FROM activities WHERE id = $1 LIMIT 1`, [
        activityId
      ]);
      if (!existing.rows[0]) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy hoạt động.');
      const nextLoc = body.diaDiem
        ? sanitizePlainText(body.diaDiem, 180) || existing.rows[0].location
        : existing.rows[0].location;
      await db.query(
        `UPDATE activities SET latitude = $2, longitude = $3, geofence_radius_m = $4, location = $5 WHERE id = $1`,
        [activityId, lat, lon, radius, nextLoc]
      );
      const updated = await db.query(
        `${ACTIVITY_SELECT_SQL} WHERE a.id = $1 GROUP BY a.id, b.name, b.ward_id, q.token, q.expires_at, q.ttl_seconds LIMIT 1`,
        [activityId]
      );
      return jsonOk(mapActivity(updated.rows[0]), requestId);
    }

    const closeMatch = subPath.match(/^\/attendance\/activities\/([^/]+)\/close$/);
    if (closeMatch && method === 'POST') {
      const user = await requireAuthAsync();
      requireRole(user, 'ward_officer');
      const activityId = decodeURIComponent(closeMatch[1]);
      const existing = await db.query(`SELECT id FROM activities WHERE id = $1 LIMIT 1`, [activityId]);
      if (!existing.rows[0]) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy hoạt động.');
      await db.query(`UPDATE activities SET is_closed = TRUE, status = 'completed' WHERE id = $1`, [
        activityId
      ]);
      const updated = await db.query(
        `${ACTIVITY_SELECT_SQL} WHERE a.id = $1 GROUP BY a.id, b.name, b.ward_id, q.token, q.expires_at, q.ttl_seconds LIMIT 1`,
        [activityId]
      );
      return jsonOk(mapActivity(updated.rows[0]), requestId);
    }

    const delActMatch = subPath.match(/^\/attendance\/activities\/([^/]+)$/);
    if (delActMatch && method === 'DELETE') {
      const user = await requireAuthAsync();
      requireRole(user, 'ward_officer');
      const activityId = decodeURIComponent(delActMatch[1]);
      const res = await db.query(`DELETE FROM activities WHERE id = $1 RETURNING id`, [activityId]);
      if (!res.rows[0]) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy hoạt động.');
      return jsonOk({ deleted: true, id: activityId }, requestId);
    }

    if (subPath === '/attendance/check-in' && method === 'POST') {
      checkRateLimit(request, 'check-in', 20, 60_000);
      const user = await requireAuthAsync();
      const body = await readBody(request);
      const { activityId, memberId, token, position } = body;
      const targetMemberId = user.memberId || memberId;

      if ((user.role === 'member' || user.role === 'branch_secretary') && user.memberId && memberId !== user.memberId) {
        throw new HttpError(403, 'FORBIDDEN', 'Chỉ được quét điểm danh QR + GPS cho chính mình.');
      }
      if (!targetMemberId) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Tài khoản này không gắn mã đoàn viên để điểm danh.');
      }

      const actRes = await db.query(
        `${ACTIVITY_SELECT_SQL} WHERE a.id = $1 GROUP BY a.id, b.name, b.ward_id, q.token, q.expires_at, q.ttl_seconds LIMIT 1`,
        [activityId]
      );
      const act = mapActivity(actRes.rows[0]);
      if (!act) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy hoạt động.');
      if (act.wardId !== (user.wardId || 'WARD-TAMHIEP')) {
        throw new HttpError(403, 'FORBIDDEN', 'Không có quyền điểm danh hoạt động đơn vị khác.');
      }
      if (act.isClosed) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Đoàn phường/xã đã đóng điểm danh cho sự kiện này.');
      }

      // Factor 1: Verify cryptographic HMAC-SHA256 QR token + DB existence + TTL
      const verifiedQr = verifySignedQrToken(token, activityId, jwtSecret);
      const qrRow = await db.query(`SELECT token, expires_at FROM qr_sessions WHERE token = $1 LIMIT 1`, [token]);
      if (!qrRow.rows[0]) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Phiên QR không tồn tại.');
      }
      if (Date.now() > verifiedQr.expiresAt) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Mã QR đã hết hiệu lực.');
      }

      // Factor 2: Verify live Haversine GPS geofence + freshness + accuracy bounds
      const gps = verifyGpsPosition(act, position);

      // Atomic insert to eliminate race-condition double-point farming
      const methodCode = act.activityType === 'makeup_meeting' ? 'makeup_qr' : 'qr_dynamic';
      const ins = await db.query(
        `INSERT INTO attendance_records (activity_id, member_id, check_in_method, distance_m, accuracy_m, verified_by_user_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (activity_id, member_id) DO NOTHING
         RETURNING id`,
        [activityId, targetMemberId, methodCode, gps.distance, gps.accuracy, user.id]
      );
      if (!ins.rows[0]) {
        throw new HttpError(409, 'CONFLICT', 'Đoàn viên đã điểm danh cho hoạt động này rồi.');
      }

      await db.query(
        `INSERT INTO emulation_point_ledger (member_id, activity_id, points, reason, awarded_by_user_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [targetMemberId, activityId, act.emulationPoints, act.tenHoatDong, user.id]
      );

      const mRes = await db.query(`${MEMBER_SELECT_SQL} WHERE m.id = $1 LIMIT 1`, [targetMemberId]);
      const updatedMember = mapMember(mRes.rows[0]);
      return jsonOk(
        {
          activityId,
          memberId: targetMemberId,
          addedHours: act.emulationPoints,
          totalMemberHours: updatedMember ? updatedMember.gioCtxh : act.emulationPoints,
          distanceM: gps.distance,
          accuracyM: gps.accuracy,
          radiusM: gps.radius
        },
        requestId
      );
    }

    // Shift-worker Makeup Meeting Registrations (Cross-role: Member -> Secretary -> Ward Officer)
    const MAKEUP_SELECT_SQL = `
      SELECT
        mr.id, mr.member_id, m.member_code, m.full_name AS member_name,
        m.branch_id, b.name AS branch_name, m.work_shift,
        mr.missed_activity_id, am.title AS missed_title,
        mr.makeup_activity_id, ak.title AS makeup_title, ak.activity_date AS makeup_date,
        mr.shift_reason, mr.status, mr.created_at
      FROM makeup_registrations mr
      JOIN members m ON m.id = mr.member_id
      JOIN branches b ON b.id = m.branch_id
      LEFT JOIN activities am ON am.id = mr.missed_activity_id
      LEFT JOIN activities ak ON ak.id = mr.makeup_activity_id
    `;

    if (subPath === '/attendance/makeup' && method === 'GET') {
      const user = await requireAuthAsync();
      let res;
      if (user.role === 'ward_officer') {
        res = await db.query(
          `${MAKEUP_SELECT_SQL} WHERE b.ward_id = $1 ORDER BY mr.created_at DESC, mr.id DESC`,
          [user.wardId || 'WARD-TAMHIEP']
        );
      } else if (user.role === 'branch_secretary') {
        res = await db.query(
          `${MAKEUP_SELECT_SQL} WHERE m.branch_id = $1 ORDER BY mr.created_at DESC, mr.id DESC`,
          [user.branchId || 'BR-KP5']
        );
      } else {
        res = await db.query(
          `${MAKEUP_SELECT_SQL} WHERE mr.member_id = $1 ORDER BY mr.created_at DESC, mr.id DESC`,
          [user.memberId || '__none__']
        );
      }
      const data = res.rows.map(mapMakeup);
      return jsonOk(data, requestId, 200, { total: data.length });
    }

    if (subPath === '/attendance/makeup' && method === 'POST') {
      const user = await requireAuthAsync();
      const body = await readBody(request);
      assertNoMaliciousPayload(body.shiftReason, 'Lý do ca làm việc');

      const targetMemberId = user.role === 'branch_secretary' && body.memberId ? sanitizePlainText(body.memberId, 32) : user.memberId;
      if (!targetMemberId) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Tài khoản không gắn hồ sơ đoàn viên.');
      }
      const missedId = sanitizePlainText(body.missedActivityId, 40);
      const makeupId = sanitizePlainText(body.makeupActivityId, 40);
      const shiftReason = sanitizePlainText(body.shiftReason || 'Trùng ca sản xuất KCN', 200) || 'Trùng ca sản xuất KCN';

      if (!missedId || !makeupId || missedId === makeupId) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Vui lòng chọn buổi vắng và buổi sinh hoạt bù hợp lệ.');
      }

      const initialStatus = user.role === 'branch_secretary' ? 'approved' : 'pending';
      const upserted = await db.query(
        `INSERT INTO makeup_registrations (member_id, missed_activity_id, makeup_activity_id, shift_reason, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (member_id, missed_activity_id)
         DO UPDATE SET makeup_activity_id = EXCLUDED.makeup_activity_id,
                       shift_reason = EXCLUDED.shift_reason,
                       status = EXCLUDED.status
         RETURNING id`,
        [targetMemberId, missedId, makeupId, shiftReason, initialStatus]
      );
      const detail = await db.query(`${MAKEUP_SELECT_SQL} WHERE mr.id = $1 LIMIT 1`, [upserted.rows[0].id]);
      return jsonOk(mapMakeup(detail.rows[0]), requestId, 201);
    }

    const makeupIdMatch = subPath.match(/^\/attendance\/makeup\/(\d+)$/);
    if (makeupIdMatch && method === 'PATCH') {
      const user = await requireAuthAsync();
      requireRole(user, 'branch_secretary', 'ward_officer');
      const id = Number(makeupIdMatch[1]);
      const body = await readBody(request);
      const status = ['approved', 'rejected', 'pending'].includes(body.status) ? body.status : null;
      if (!status) throw new HttpError(400, 'VALIDATION_ERROR', 'Trạng thái duyệt không hợp lệ.');

      const existing = await db.query(`${MAKEUP_SELECT_SQL} WHERE mr.id = $1 LIMIT 1`, [id]);
      if (!existing.rows[0]) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy đăng ký sinh hoạt bù.');
      if (user.role === 'branch_secretary' && existing.rows[0].branch_id !== user.branchId) {
        throw new HttpError(403, 'FORBIDDEN', 'Chỉ được duyệt đăng ký thuộc Chi đoàn mình.');
      }

      await db.query(`UPDATE makeup_registrations SET status = $2 WHERE id = $1`, [id, status]);
      const updated = await db.query(`${MAKEUP_SELECT_SQL} WHERE mr.id = $1 LIMIT 1`, [id]);
      return jsonOk(mapMakeup(updated.rows[0]), requestId);
    }

    // Reports endpoints
    if (subPath === '/reports/summary' && method === 'GET') {
      const user = await requireAuthAsync();
      requireRole(user, 'branch_secretary', 'ward_officer');
      const [members, activities] = await Promise.all([
        fetchScopedMembers(user),
        fetchScopedActivities(user)
      ]);
      const summary = buildReportSummary(
        members,
        activities,
        user,
        sanitizePlainText(url.searchParams.get('period') || 'month', 16)
      );
      return jsonOk(summary, requestId);
    }

    if (subPath === '/reports/export.csv' && method === 'GET') {
      const user = await requireAuthAsync();
      requireRole(user, 'branch_secretary', 'ward_officer');
      const members = await fetchScopedMembers(user);
      const headers = ['STT', 'Ma Doan Vien', 'Ho va Ten', 'Chi Doan', 'Chuc Vu', 'Trang Thai', 'Doan Phi', 'Gio CTXH'];
      const rows = members.map((m, i) => [
        i + 1,
        m.maDoanVien,
        m.hoTen,
        m.chiDoan,
        m.chucVu,
        m.trangThai,
        m.daDongDoanPhi ? 'Đã đóng' : 'Chưa đóng',
        m.gioCtxh
      ]);
      const csv = '\uFEFF' + [headers.map(sanitizeCsvCell).join(','), ...rows.map((r) => r.map(sanitizeCsvCell).join(','))].join('\r\n');
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="bao-cao-doan-vien.csv"',
          'X-Content-Type-Options': 'nosniff',
          'X-Request-Id': requestId
        }
      });
    }

    // Reminders endpoints
    const REMINDER_SELECT = `
      SELECT r.id, r.scope, r.branch_id, COALESCE(r.ward_id, b.ward_id) AS effective_ward_id,
             r.title, r.due_at, r.recurrence, r.remind_before, r.auto_enabled, r.is_completed,
             COALESCE(ARRAY_AGG(rc.channel_code) FILTER (WHERE rc.channel_code IS NOT NULL), '{}') AS channels
      FROM reminders r
      LEFT JOIN branches b ON b.id = r.branch_id
      LEFT JOIN reminder_channels rc ON rc.reminder_id = r.id
    `;

    if (subPath === '/reminders' && method === 'GET') {
      const user = await requireAuthAsync();
      const res =
        user.role === 'ward_officer'
          ? await db.query(
              `${REMINDER_SELECT} WHERE COALESCE(r.ward_id, b.ward_id) = $1 GROUP BY r.id, b.ward_id ORDER BY r.created_at DESC, r.id ASC`,
              [user.wardId || 'WARD-TAMHIEP']
            )
          : await db.query(
              `${REMINDER_SELECT} WHERE r.branch_id = $1 OR (r.scope = 'ward' AND r.ward_id = $2) GROUP BY r.id, b.ward_id ORDER BY r.created_at DESC, r.id ASC`,
              [user.branchId || 'BR-KP5', user.wardId || 'WARD-TAMHIEP']
            );
      let data = res.rows.map(mapReminder);
      if (user.role === 'member') {
        const internalAdminRe = /(chốt báo cáo|gửi đoàn phường|tổng hợp danh sách|thu đoàn phí|còn \d+ đv chưa đóng)/i;
        data = data.filter((r) => !internalAdminRe.test(r.tieuDe || ''));
      }
      return jsonOk(data, requestId, 200, { total: data.length });
    }

    if (subPath === '/reminders' && method === 'POST') {
      const user = await requireAuthAsync();
      requireRole(user, 'branch_secretary', 'ward_officer');
      const body = await readBody(request);
      assertNoMaliciousPayload(body.tieuDe, 'Nội dung lịch nhắc');
      const title = sanitizePlainText(body.tieuDe, 180);
      if (title.length < 3) throw new HttpError(400, 'VALIDATION_ERROR', 'Thiếu tiêu đề nhắc việc hợp lệ.');

      const id = `RM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
      const isWard = user.role === 'ward_officer';
      const rawDue = sanitizePlainText(body.hanChot || '2026-12-02 19:00', 32);
      const dueIso = rawDue.includes('T') ? rawDue : `${rawDue}:00+07`;
      const remindBefore = sanitizePlainText(body.nhacTruoc || 'Trước 24 giờ', 32);

      await db.query(
        `INSERT INTO reminders (id, scope, branch_id, ward_id, title, due_at, recurrence, remind_before, auto_enabled, is_completed)
         VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8, TRUE, FALSE)`,
        [
          id,
          isWard ? 'ward' : 'branch',
          isWard ? null : user.branchId,
          isWard ? user.wardId : null,
          title,
          dueIso,
          RECURRENCE_TO_DB[body.chuKy] || 'monthly',
          remindBefore
        ]
      );
      await db.query(
        `INSERT INTO reminder_channels (reminder_id, channel_code) VALUES ($1, 'zalo_oa'), ($1, 'web_push') ON CONFLICT DO NOTHING`,
        [id]
      );
      const created = await db.query(`${REMINDER_SELECT} WHERE r.id = $1 GROUP BY r.id, b.ward_id LIMIT 1`, [id]);
      return jsonOk(mapReminder(created.rows[0]), requestId, 201);
    }

    const remMatch = subPath.match(/^\/reminders\/([^/]+)$/);
    if (remMatch && (method === 'PATCH' || method === 'DELETE')) {
      const user = await requireAuthAsync();
      requireRole(user, 'branch_secretary', 'ward_officer');
      const id = decodeURIComponent(remMatch[1]);
      if (method === 'DELETE') {
        const del = await db.query(`DELETE FROM reminders WHERE id = $1 RETURNING id`, [id]);
        if (!del.rows[0]) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy lịch nhắc việc.');
        return jsonOk({ deleted: true, id }, requestId);
      }
      const body = await readBody(request);
      const sets = [];
      const params = [id];
      if (body.batNhacTuDong !== undefined) {
        params.push(Boolean(body.batNhacTuDong));
        sets.push(`auto_enabled = $${params.length}`);
      }
      if (body.daHoanThanh !== undefined) {
        params.push(Boolean(body.daHoanThanh));
        sets.push(`is_completed = $${params.length}`);
      }
      if (sets.length > 0) {
        await db.query(`UPDATE reminders SET ${sets.join(', ')} WHERE id = $1`, params);
      }
      const updated = await db.query(`${REMINDER_SELECT} WHERE r.id = $1 GROUP BY r.id, b.ward_id LIMIT 1`, [id]);
      if (!updated.rows[0]) throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy lịch nhắc việc.');
      return jsonOk(mapReminder(updated.rows[0]), requestId);
    }

    return jsonErr(404, 'NOT_FOUND', `Không tìm thấy API ${method} ${subPath}`, requestId);
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonErr(err.statusCode, err.code, err.message, requestId, err.details || null);
    }
    return jsonErr(500, 'INTERNAL_ERROR', 'Lỗi xử lý máy chủ, vui lòng thử lại.', requestId);
  }
}
