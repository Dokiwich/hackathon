export const BASE_MEMBER_CAPABILITIES = Object.freeze([
  'news:read',
  'attendance:scan_qr_gps',
  'makeup:register',
  'hours:read_self',
  'reminders:read',
  'profile:change_password'
]);

export const ROLE_CAPABILITIES = Object.freeze({
  member: BASE_MEMBER_CAPABILITIES,
  branch_secretary: Object.freeze([
    ...BASE_MEMBER_CAPABILITIES,
    'members:read_branch',
    'members:write_branch',
    'attendance:view_branch_progress',
    'makeup:approve',
    'hours:read_branch',
    'hours:export_csv',
    'reports:branch',
    'reminders:write_branch',
    'data:reset_demo'
  ]),
  ward_officer: Object.freeze([
    ...BASE_MEMBER_CAPABILITIES,
    'news:write',
    'members:read_ward',
    'events:create_ward',
    'qr:issue_ward',
    'attendance:manage_ward',
    'makeup:approve',
    'hours:read_ward',
    'hours:export_csv',
    'reports:ward_summary',
    'reminders:write_ward'
  ])
});

export const CAPABILITY_LABELS = Object.freeze({
  'news:read': 'Xem bảng tin tức Đoàn & chỉ đạo cơ sở (kế thừa tất cả vai trò)',
  'news:write': 'Đăng, sửa, xóa bài viết tại mục Tổng quan / Tin tức',
  'members:read_branch': 'Xem danh sách & hồ sơ đoàn viên Chi đoàn mình',
  'members:read_ward': 'Xem tổng hợp đoàn viên toàn phường (chỉ xem, không thêm/xóa)',
  'members:write_branch': 'Thêm, sửa, xóa, nhập CSV & đóng đoàn phí Chi đoàn mình',
  'events:create_ward': 'Tổ chức sự kiện cấp Xã/Phường gắn tọa độ GPS & bán kính',
  'qr:issue_ward': 'Phát, xoay (15 phút) và đóng mã QR điểm danh sự kiện',
  'attendance:manage_ward': 'Theo dõi danh sách điểm danh QR + GPS của tất cả đoàn viên',
  'attendance:scan_qr_gps': 'Quét QR (camera/ảnh/link) kèm xác thực vị trí GPS cá nhân',
  'attendance:view_branch_progress': 'Xem tiến độ đoàn viên Chi đoàn mình đã quét QR + GPS',
  'makeup:register': 'Đăng ký buổi sinh hoạt bù dành cho đoàn viên làm ca KCN / đi làm xa',
  'makeup:approve': 'Xem và phê duyệt đăng ký sinh hoạt bù của đoàn viên',
  'hours:read_self': 'Theo dõi giờ CTXH và nhật ký cá nhân',
  'hours:read_branch': 'Xem sổ cái giờ CTXH toàn Chi đoàn',
  'hours:read_ward': 'Xem sổ cái giờ CTXH toàn Phường',
  'hours:export_csv': 'Xuất sổ cái giờ CTXH ra file CSV',
  'reports:branch': 'Xuất báo cáo tuần/tháng Chi đoàn (Word/CSV/PDF)',
  'reports:ward_summary': 'Xem bảng tổng hợp Chi đoàn & xuất báo cáo cấp Phường',
  'reminders:read': 'Xem lịch sinh hoạt & thông báo nhắc việc',
  'reminders:write_branch': 'Tạo & bật/tắt nhắc việc Chi đoàn',
  'reminders:write_ward': 'Tạo & điều phối nhắc việc toàn Phường',
  'profile:change_password': 'Đổi mật khẩu (xác nhận mật khẩu cũ trước khi đổi)',
  'data:reset_demo': 'Khôi phục dữ liệu mẫu mặc định'
});

export function getUserCapabilities(user) {
  const role = user?.role;
  const base = new Set(ROLE_CAPABILITIES[role] || BASE_MEMBER_CAPABILITIES);
  const perms = user?.permissions;

  if (perms && typeof perms === 'object') {
    if (perms.canManageMembers === false) base.delete('members:write_branch');
    if (perms.canManageMembers === true) base.add('members:write_branch');
    if (perms.canCreateQr === false) {
      base.delete('qr:issue_ward');
    }
    if (perms.canCreateWardEvent === true && perms.canCreateQr === true) {
      base.add('events:create_ward');
      base.add('qr:issue_ward');
    }
    if (perms.canViewWardSummary === true) {
      base.add('reports:ward_summary');
      base.add('members:read_ward');
    }
  }

  return Array.from(base);
}

export function hasCapability(user, capability) {
  return getUserCapabilities(user).includes(capability);
}

export function hasAnyCapability(user, capabilities = []) {
  const granted = getUserCapabilities(user);
  return capabilities.some((cap) => granted.includes(cap));
}
