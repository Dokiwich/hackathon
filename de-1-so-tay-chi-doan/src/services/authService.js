import { ApiError, apiRequest } from './apiClient';
import {
  getApiBaseUrl,
  isOnlineApiAvailable,
  isSameOriginBrowserRuntime,
  loadJson,
  saveJson
} from './storageService';
import { isJwtTokenExpired, sanitizePlainText } from '../utils/security';
import {
  getUserCapabilities,
  hasAnyCapability,
  hasCapability
} from '../features/auth/permissions';

export { getUserCapabilities, hasAnyCapability, hasCapability };

const AUTH_STORAGE_KEY = 'dong_nai_chi_doan_auth_v1';
const LOCAL_PASSWORDS_KEY = 'dong_nai_chi_doan_passwords_v1';
let memoryPasswordOverrides = {};

export const DEMO_ACCOUNTS = [
  {
    id: 'USR-BT-KP5',
    username: 'bithu.kp5',
    phone: '0912345001',
    memberCode: 'DN-KP5-001',
    memberId: 'DV-KP5-001',
    fullName: 'Trần Minh Khôi',
    role: 'branch_secretary',
    roleLabel: 'Bí thư chi đoàn',
    wardId: 'WARD-TAMHIEP',
    branchId: 'BR-KP5',
    unitName: 'Chi đoàn Khu phố 5',
    password: '123456',
    permissions: {
      canManageMembers: true,
      canCreateBranchEvent: false,
      canCreateWardEvent: false,
      canCreateQr: false,
      canViewWardSummary: false
    }
  },
  {
    id: 'USR-CB-TH',
    username: 'canbo.tamhiep',
    phone: '0912345900',
    memberCode: 'CB-TH-001',
    memberId: null,
    fullName: 'Lê Thị Hồng Nhung',
    role: 'ward_officer',
    roleLabel: 'Cán bộ Đoàn xã/phường',
    wardId: 'WARD-TAMHIEP',
    branchId: null,
    unitName: 'Đoàn Phường Tam Hiệp',
    password: '123456',
    permissions: {
      canManageMembers: false,
      canCreateBranchEvent: false,
      canCreateWardEvent: true,
      canCreateQr: true,
      canViewWardSummary: true
    }
  },
  {
    id: 'USR-DV-KP5',
    username: 'doanvien.kp5',
    phone: '0912345002',
    memberCode: 'DN-KP5-002',
    memberId: 'DV-KP5-002',
    fullName: 'Nguyễn Hoàng Anh',
    role: 'member',
    roleLabel: 'Đoàn viên',
    wardId: 'WARD-TAMHIEP',
    branchId: 'BR-KP5',
    unitName: 'Chi đoàn Khu phố 5',
    password: '123456',
    permissions: {
      canManageMembers: false,
      canCreateBranchEvent: false,
      canCreateWardEvent: false,
      canCreateQr: false,
      canViewWardSummary: false
    }
  }
];

export function normalizeIdentifier(raw) {
  return String(raw || '').trim().toLowerCase();
}

function normalizePhone(raw) {
  return String(raw || '').replace(/[\s.-]/g, '').trim();
}

export function canManageMembers(user) {
  return hasCapability(user, 'members:write_branch');
}

export function canOrganizeEventsAndQr(user) {
  return hasCapability(user, 'qr:issue_ward');
}

export function canScanQrGps(user) {
  return hasCapability(user, 'attendance:scan_qr_gps');
}

export function canViewBranchAttendanceProgress(user) {
  return hasCapability(user, 'attendance:view_branch_progress');
}

export function canManageReminders(user) {
  return hasAnyCapability(user, ['reminders:write_branch', 'reminders:write_ward']);
}

export function canViewMembersDirectory(user) {
  return hasAnyCapability(user, ['members:read_branch', 'members:read_ward']);
}

export function canViewReports(user) {
  return hasAnyCapability(user, ['reports:branch', 'reports:ward_summary']);
}

export function canViewWardSummary(user) {
  return hasCapability(user, 'reports:ward_summary');
}

export function canManageNews(user) {
  return hasCapability(user, 'news:write');
}

export function canResetDemoData(user) {
  return hasCapability(user, 'data:reset_demo');
}

export function canManageChiDoan(user) {
  return canOrganizeEventsAndQr(user);
}

function loadLocalPasswordOverrides() {
  const persisted = loadJson(
    LOCAL_PASSWORDS_KEY,
    {},
    (parsed) => Boolean(parsed && typeof parsed === 'object')
  );
  return { ...memoryPasswordOverrides, ...persisted };
}

function getEffectiveLocalPassword(account) {
  const overrides = loadLocalPasswordOverrides();
  return overrides[account.id] || account.password;
}

export function resetLocalPasswordOverrides() {
  memoryPasswordOverrides = {};
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_PASSWORDS_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function identifyAccountLocally(identifier) {
  const cleaned = normalizeIdentifier(identifier);
  const phone = normalizePhone(identifier);
  if (!cleaned) return { found: false };

  const match = DEMO_ACCOUNTS.find(
    (acc) =>
      acc.username.toLowerCase() === cleaned ||
      acc.memberCode.toLowerCase() === cleaned ||
      normalizePhone(acc.phone) === phone
  );

  if (!match) return { found: false };
  return {
    found: true,
    role: match.role,
    roleLabel: match.roleLabel,
    unitName: match.unitName,
    permissions: match.permissions
  };
}

export async function identifyAccount(identifier, { signal } = {}) {
  const cleaned = String(identifier || '').trim();
  if (cleaned.length < 2) return { found: false };

  if (await isOnlineApiAvailable()) {
    try {
      return await apiRequest('/api/v1/auth/identify', {
        method: 'POST',
        body: { identifier: cleaned },
        signal
      });
    } catch {
      return identifyAccountLocally(cleaned);
    }
  }

  return identifyAccountLocally(cleaned);
}

function shouldTryRemoteAuth() {
  return Boolean(getApiBaseUrl() || (isSameOriginBrowserRuntime() && typeof fetch === 'function'));
}

function isOfflineNetworkFailure(err) {
  if (!(err instanceof ApiError)) return true;
  return err.status === 404 || err.status === 502 || err.status === 503 || err.status === 504;
}

export async function authenticateUser({ identifier, password }) {
  const cleaned = String(identifier || '').trim();
  if (!cleaned || !password) {
    throw new Error('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
  }

  if (shouldTryRemoteAuth()) {
    try {
      const data = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: { identifier: cleaned, password }
      });
      return {
        accessToken: data.accessToken,
        user: data.user,
        mode: 'api'
      };
    } catch (err) {
      if (!isOfflineNetworkFailure(err)) {
        throw err;
      }
    }
  }

  const lower = normalizeIdentifier(cleaned);
  const phone = normalizePhone(cleaned);
  const account = DEMO_ACCOUNTS.find(
    (acc) =>
      acc.username.toLowerCase() === lower ||
      acc.memberCode.toLowerCase() === lower ||
      normalizePhone(acc.phone) === phone
  );

  if (!account || getEffectiveLocalPassword(account) !== password) {
    throw new Error('Sai tài khoản, mã đoàn viên hoặc mật khẩu.');
  }

  return {
    accessToken: `local-session-${account.id}`,
    user: {
      id: account.id,
      username: account.username,
      fullName: account.fullName,
      role: account.role,
      roleLabel: account.roleLabel,
      wardId: account.wardId,
      branchId: account.branchId,
      memberId: account.memberId,
      memberCode: account.memberCode,
      unitName: account.unitName,
      permissions: account.permissions
    },
    mode: 'local'
  };
}

export async function changeUserPassword({
  currentPassword,
  newPassword,
  confirmNewPassword,
  accessToken,
  userId
}) {
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new Error('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
  }
  if (newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
  }
  if (newPassword !== confirmNewPassword) {
    throw new Error('Xác nhận mật khẩu mới không khớp.');
  }
  if (newPassword === currentPassword) {
    throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
  }

  if (
    (accessToken && !String(accessToken).startsWith('local-session-')) ||
    (await isOnlineApiAvailable())
  ) {
    const res = await apiRequest('/api/v1/auth/change-password', {
      method: 'POST',
      token: accessToken,
      body: { currentPassword, newPassword, confirmNewPassword }
    });
    if (res?.accessToken) {
      const currentSession = loadAuthSession();
      if (currentSession && currentSession.user?.id === userId) {
        saveAuthSession({ ...currentSession, accessToken: res.accessToken });
      }
    }
    return res;
  }

  const account = DEMO_ACCOUNTS.find((acc) => acc.id === userId);
  if (!account) {
    throw new Error('Không tìm thấy phiên tài khoản.');
  }
  if (getEffectiveLocalPassword(account) !== currentPassword) {
    throw new Error('Mật khẩu hiện tại không chính xác.');
  }

  const overrides = loadLocalPasswordOverrides();
  overrides[account.id] = newPassword;
  memoryPasswordOverrides = overrides;
  saveJson(LOCAL_PASSWORDS_KEY, overrides);

  return {
    updated: true,
    updatedAt: new Date().toISOString()
  };
}

export async function changePasswordByCredentials({
  identifier,
  currentPassword,
  newPassword,
  confirmNewPassword
}) {
  const cleaned = String(identifier || '').trim();
  if (!cleaned || !currentPassword || !newPassword || !confirmNewPassword) {
    throw new Error('Vui lòng nhập tài khoản, mật khẩu hiện tại và mật khẩu mới.');
  }
  if (newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
  }
  if (newPassword !== confirmNewPassword) {
    throw new Error('Xác nhận mật khẩu mới không khớp.');
  }
  if (newPassword === currentPassword) {
    throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
  }

  if (shouldTryRemoteAuth()) {
    try {
      const loginData = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: { identifier: cleaned, password: currentPassword }
      });
      return await apiRequest('/api/v1/auth/change-password', {
        method: 'POST',
        token: loginData.accessToken,
        body: { currentPassword, newPassword, confirmNewPassword }
      });
    } catch (err) {
      if (!isOfflineNetworkFailure(err)) {
        throw err;
      }
    }
  }

  const lower = normalizeIdentifier(cleaned);
  const phone = normalizePhone(cleaned);
  const account = DEMO_ACCOUNTS.find(
    (acc) =>
      acc.username.toLowerCase() === lower ||
      acc.memberCode.toLowerCase() === lower ||
      normalizePhone(acc.phone) === phone
  );

  if (!account || getEffectiveLocalPassword(account) !== currentPassword) {
    throw new Error('Tài khoản hoặc mật khẩu hiện tại không chính xác.');
  }

  const overrides = loadLocalPasswordOverrides();
  overrides[account.id] = newPassword;
  memoryPasswordOverrides = overrides;
  saveJson(LOCAL_PASSWORDS_KEY, overrides);

  return {
    updated: true,
    updatedAt: new Date().toISOString()
  };
}

export function loadAuthSession() {
  const validateSession = (parsed) => {
    if (!parsed || !parsed.user || !parsed.user.id || !parsed.user.role) return false;
    if (parsed.mode === 'api' && isJwtTokenExpired(parsed.accessToken)) return false;
    parsed.user.fullName = sanitizePlainText(parsed.user.fullName, 80);
    return true;
  };
  try {
    if (typeof sessionStorage !== 'undefined') {
      const rawSession = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (validateSession(parsed)) return parsed;
      }
    }
  } catch {
    // ignore session storage errors
  }
  return loadJson(AUTH_STORAGE_KEY, null, validateSession);
}

export function saveAuthSession(session) {
  if (!session) return false;
  const { rememberMe = true, ...cleanSession } = session;
  try {
    if (rememberMe === false && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(cleanSession));
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return true;
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // fall through to localStorage
  }
  return saveJson(AUTH_STORAGE_KEY, cleanSession);
}

export function clearAuthSession() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
