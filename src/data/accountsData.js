// Danh mục tài khoản hệ thống (Lưu trữ và khởi tạo ban đầu)
export const INITIAL_ACCOUNTS = [
  // Tài khoản Cơ quan
  {
    id: 'ACC-CQ-01',
    username: 'canbo.tinh@dongnai.gov.vn',
    password: '123',
    fullName: 'Nguyễn Văn Minh',
    role: 'agency',
    unitId: 'all',
    unitName: 'Trung tâm Giám sát Điều hành Đô thị Tỉnh Đồng Nai',
    position: 'Cán bộ Điều hành Cấp cao',
    phone: '0251 3822 123'
  },
  {
    id: 'ACC-CQ-02',
    username: 'ubnd.tamhiep@dongnai.gov.vn',
    password: '123',
    fullName: 'Trần Văn Quyết',
    role: 'agency',
    unitId: 'WARD-03',
    unitName: 'UBND Phường Tam Hiệp',
    position: 'Trưởng ban Chỉ đạo Hạ tầng',
    phone: '0251 3811 456'
  },
  {
    id: 'ACC-CQ-03',
    username: 'ubnd.longthanh@dongnai.gov.vn',
    password: '123',
    fullName: 'Lê Hoàng Nam',
    role: 'agency',
    unitId: 'WARD-40',
    unitName: 'UBND Phường Long Thành',
    position: 'Phó Ban Quản lý Đô thị',
    phone: '0251 3546 789'
  },
  {
    id: 'ACC-CQ-04',
    username: 'ubnd.xuanan@dongnai.gov.vn',
    password: '123',
    fullName: 'Đoàn Hữu Tuấn',
    role: 'agency',
    unitId: 'WARD-26',
    unitName: 'UBND Phường Xuân An',
    position: 'Cán bộ Địa chính - Hạ tầng',
    phone: '0251 3721 888'
  },
  // Tài khoản Người dân mẫu
  {
    id: 'ACC-ND-01',
    username: '0918123456',
    password: '123',
    fullName: 'Nguyễn Minh Tâm',
    role: 'citizen',
    unitId: 'WARD-03',
    unitName: 'Phường Tam Hiệp',
    position: 'Công dân',
    phone: '0918 123 456'
  },
  {
    id: 'ACC-ND-02',
    username: '0909888999',
    password: '123',
    fullName: 'Trần Hoàng Phúc',
    role: 'citizen',
    unitId: 'WARD-12',
    unitName: 'Phường Thống Nhất',
    position: 'Công dân',
    phone: '0909 888 999'
  }
];

const STORAGE_ACCOUNTS_KEY = 'dong_nai_accounts_v2';

export function getStoredAccounts() {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback
  }
  return INITIAL_ACCOUNTS;
}

export function saveStoredAccounts(accounts) {
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Quota err
  }
}

export function registerAccount({ username, password, fullName, role, unitId, unitName, phone }) {
  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  if (existing) {
    return { success: false, message: 'Tên tài khoản / Số điện thoại này đã được đăng ký!' };
  }

  const newAcc = {
    id: `ACC-${Date.now().toString().slice(-6)}`,
    username: username.trim(),
    password: password.trim(),
    fullName: fullName.trim() || (role === 'agency' ? 'Cán bộ quản lý' : 'Công dân'),
    role,
    unitId: unitId || 'all',
    unitName: unitName || (role === 'agency' ? 'UBND Đồng Nai' : 'Đồng Nai'),
    position: role === 'agency' ? 'Cán bộ chuyên trách' : 'Công dân',
    phone: phone || username
  };

  const updated = [newAcc, ...accounts];
  saveStoredAccounts(updated);
  return { success: true, account: newAcc };
}

export function authenticateUser(username, password) {
  const accounts = getStoredAccounts();
  const found = accounts.find(
    (a) =>
      a.username.toLowerCase() === username.trim().toLowerCase() &&
      a.password === password.trim()
  );
  if (!found) {
    return { success: false, message: 'Sai thông tin tài khoản hoặc mật khẩu!' };
  }
  return { success: true, account: found };
}
