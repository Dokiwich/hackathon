import { hashPassword } from '../../common/password.js';

function normalizePhone(raw) {
  return String(raw || '').replace(/[\s.-]/g, '').trim();
}

function createInitialMemoryUsers() {
  return [
    {
      id: 'USR-BT-KP5',
      role: 'branch_secretary',
      roleLabel: 'Bí thư chi đoàn',
      wardId: 'WARD-TAMHIEP',
      branchId: 'BR-KP5',
      memberId: 'DV-KP5-001',
      username: 'bithu.kp5',
      phone: '0912345001',
      memberCode: 'DN-KP5-001',
      passwordHash: hashPassword('123456', 'kp502026aa11bb22cc33dd44ee550001'),
      fullName: 'Trần Minh Khôi',
      unitName: 'Chi đoàn Khu phố 5',
      canManageMembers: true,
      canCreateBranchEvent: false,
      canCreateWardEvent: false,
      canCreateQr: false,
      canViewWardSummary: false,
      isActive: true
    },
    {
      id: 'USR-CB-TH',
      role: 'ward_officer',
      roleLabel: 'Cán bộ Đoàn xã/phường',
      wardId: 'WARD-TAMHIEP',
      branchId: null,
      memberId: null,
      username: 'canbo.tamhiep',
      phone: '0912345900',
      memberCode: 'CB-TH-001',
      passwordHash: hashPassword('123456', 'kp502026aa11bb22cc33dd44ee550002'),
      fullName: 'Lê Thị Hồng Nhung',
      unitName: 'Đoàn Phường Tam Hiệp',
      canManageMembers: false,
      canCreateBranchEvent: false,
      canCreateWardEvent: true,
      canCreateQr: true,
      canViewWardSummary: true,
      isActive: true
    },
    {
      id: 'USR-DV-KP5',
      role: 'member',
      roleLabel: 'Đoàn viên',
      wardId: 'WARD-TAMHIEP',
      branchId: 'BR-KP5',
      memberId: 'DV-KP5-002',
      username: 'doanvien.kp5',
      phone: '0912345002',
      memberCode: 'DN-KP5-002',
      passwordHash: hashPassword('123456', 'kp502026aa11bb22cc33dd44ee550003'),
      fullName: 'Nguyễn Hoàng Anh',
      unitName: 'Chi đoàn Khu phố 5',
      canManageMembers: false,
      canCreateBranchEvent: false,
      canCreateWardEvent: false,
      canCreateQr: false,
      canViewWardSummary: false,
      isActive: true
    }
  ];
}

function mapDbUserRow(row) {
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
    fullName: row.full_name,
    unitName: row.unit_name || 'Đoàn Phường Tam Hiệp',
    canManageMembers: Boolean(row.can_manage_members),
    canCreateBranchEvent: Boolean(row.can_create_branch_event),
    canCreateWardEvent: Boolean(row.can_create_ward_event),
    canCreateQr: Boolean(row.can_create_qr),
    canViewWardSummary: Boolean(row.can_view_ward_summary),
    isActive: Boolean(row.is_active)
  };
}

const USER_SELECT_SQL = `
  SELECT
    u.id,
    u.role_code,
    r.label AS role_label,
    r.can_manage_members,
    r.can_create_branch_event,
    r.can_create_ward_event,
    r.can_create_qr,
    r.can_view_ward_summary,
    COALESCE(u.ward_id, b.ward_id) AS effective_ward_id,
    u.branch_id,
    m.id AS member_id,
    u.username,
    u.phone,
    u.member_code,
    u.password_hash,
    u.full_name,
    u.is_active,
    COALESCE(b.name, w.name) AS unit_name
  FROM users u
  JOIN roles r ON r.code = u.role_code
  LEFT JOIN branches b ON b.id = u.branch_id
  LEFT JOIN wards w ON w.id = COALESCE(u.ward_id, b.ward_id)
  LEFT JOIN members m ON m.user_id = u.id
`;

export function createAuthRbacRepository({ db } = {}) {
  const isPostgres = db?.mode === 'postgres';
  const memoryUsers = createInitialMemoryUsers();

  return {
    async findByIdentifier(rawIdentifier) {
      const cleaned = String(rawIdentifier || '').trim();
      const lower = cleaned.toLowerCase();
      const phone = normalizePhone(cleaned);
      if (!cleaned) return null;

      if (isPostgres) {
        const result = await db.query(
          `${USER_SELECT_SQL}
           WHERE u.is_active = TRUE
             AND (
               LOWER(u.username) = $1
               OR LOWER(COALESCE(u.member_code, '')) = $1
               OR REPLACE(REPLACE(COALESCE(u.phone, ''), ' ', ''), '-', '') = $2
             )
           LIMIT 1`,
          [lower, phone]
        );
        return mapDbUserRow(result.rows[0]);
      }

      return (
        memoryUsers.find(
          (u) =>
            u.isActive &&
            (u.username.toLowerCase() === lower ||
              (u.memberCode && u.memberCode.toLowerCase() === lower) ||
              (u.phone && normalizePhone(u.phone) === phone))
        ) || null
      );
    },

    async findById(id) {
      if (isPostgres) {
        const result = await db.query(`${USER_SELECT_SQL} WHERE u.id = $1 LIMIT 1`, [id]);
        return mapDbUserRow(result.rows[0]);
      }
      return memoryUsers.find((u) => u.id === id) || null;
    },

    async updatePasswordHash(userId, nextPasswordHash) {
      if (isPostgres) {
        await db.query(
          'UPDATE users SET password_hash = $2, password_updated_at = NOW() WHERE id = $1',
          [userId, nextPasswordHash]
        );
        return true;
      }

      const target = memoryUsers.find((u) => u.id === userId);
      if (!target) return false;
      target.passwordHash = nextPasswordHash;
      return true;
    }
  };
}
