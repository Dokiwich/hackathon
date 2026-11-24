import { NotFoundError, UnauthorizedError } from '../../common/errors.js';
import { signHs256Jwt, verifyHs256Jwt } from '../../common/jwt.js';
import { hashPassword, verifyPassword } from '../../common/password.js';

function buildPermissions(role, rawUser = {}) {
  return {
    canManageMembers:
      typeof rawUser.canManageMembers === 'boolean'
        ? rawUser.canManageMembers
        : role === 'branch_secretary',
    canCreateBranchEvent:
      typeof rawUser.canCreateBranchEvent === 'boolean'
        ? rawUser.canCreateBranchEvent
        : role === 'branch_secretary',
    canCreateWardEvent:
      typeof rawUser.canCreateWardEvent === 'boolean'
        ? rawUser.canCreateWardEvent
        : role === 'ward_officer',
    canCreateQr:
      typeof rawUser.canCreateQr === 'boolean'
        ? rawUser.canCreateQr
        : role === 'branch_secretary' || role === 'ward_officer',
    canViewWardSummary:
      typeof rawUser.canViewWardSummary === 'boolean'
        ? rawUser.canViewWardSummary
        : role === 'ward_officer'
  };
}

export function createAuthRbacService({ repository, jwtSecret }) {
  const effectiveSecret =
    jwtSecret && jwtSecret.trim().length >= 16
      ? jwtSecret.trim()
      : 'dev-only-secret-key-for-local-testing-32c';

  return {
    async identify(identifier) {
      const user = await repository.findByIdentifier(identifier);
      if (!user) {
        return { found: false };
      }
      return {
        found: true,
        role: user.role,
        roleLabel: user.roleLabel,
        unitName: user.unitName,
        permissions: buildPermissions(user.role, user)
      };
    },

    async login({ identifier, password }) {
      const user = await repository.findByIdentifier(identifier);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        throw new UnauthorizedError('Sai tài khoản hoặc mật khẩu');
      }

      const permissions = buildPermissions(user.role, user);
      const accessToken = signHs256Jwt(
        {
          sub: user.id,
          role: user.role,
          roleLabel: user.roleLabel,
          wardId: user.wardId,
          branchId: user.branchId,
          memberId: user.memberId,
          memberCode: user.memberCode,
          fullName: user.fullName,
          unitName: user.unitName,
          permissions
        },
        effectiveSecret,
        7200
      );

      return {
        accessToken,
        tokenType: 'Bearer',
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          roleLabel: user.roleLabel,
          wardId: user.wardId,
          branchId: user.branchId,
          memberId: user.memberId,
          memberCode: user.memberCode,
          unitName: user.unitName,
          permissions
        }
      };
    },

    async changePassword(userId, { currentPassword, newPassword }) {
      const user = await repository.findById(userId);
      if (!user) {
        throw new NotFoundError('Không tìm thấy tài khoản');
      }
      if (!verifyPassword(currentPassword, user.passwordHash)) {
        throw new UnauthorizedError('Mật khẩu hiện tại không chính xác');
      }
      const nextHash = hashPassword(newPassword);
      await repository.updatePasswordHash(userId, nextHash);
      return {
        updated: true,
        updatedAt: new Date().toISOString()
      };
    },

    verifyAccessToken(token) {
      const payload = verifyHs256Jwt(token, effectiveSecret);
      if (!payload?.sub) {
        throw new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn');
      }
      return {
        id: payload.sub,
        role: payload.role,
        roleLabel: payload.roleLabel || payload.role,
        wardId: payload.wardId || 'WARD-TAMHIEP',
        branchId: payload.branchId || null,
        memberId: payload.memberId || null,
        memberCode: payload.memberCode || null,
        fullName: payload.fullName,
        unitName: payload.unitName || 'Đoàn Phường Tam Hiệp',
        permissions: payload.permissions || buildPermissions(payload.role)
      };
    }
  };
}
