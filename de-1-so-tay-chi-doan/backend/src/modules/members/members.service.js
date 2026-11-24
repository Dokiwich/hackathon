import { ConflictError, ForbiddenError, NotFoundError } from '../../common/errors.js';

export function createMembersService({ repository }) {
  return {
    async getMyProfile(user) {
      if (!user.memberId) {
        return {
          id: user.id,
          maDoanVien: user.memberCode || user.username,
          hoTen: user.fullName,
          chiDoan: user.unitName,
          chucVu: user.roleLabel,
          gioCtxh: 0,
          daDongDoanPhi: true
        };
      }
      const member = await repository.findById(user.memberId);
      if (!member) throw new NotFoundError('Không tìm thấy hồ sơ đoàn viên');
      return member;
    },

    async getLedger(user) {
      return repository.listLedger({
        role: user.role,
        memberId: user.memberId || null,
        branchId: user.branchId || null,
        wardId: user.wardId || null
      });
    },

    async listMembers(user, query = {}) {
      if (user.role === 'branch_secretary') {
        return repository.list({
          branchId: user.branchId,
          q: query.q,
          status: query.status
        });
      }
      return repository.list({
        wardId: user.wardId,
        branchId: query.branchId || '',
        q: query.q,
        status: query.status
      });
    },

    async createMember(user, payload) {
      if (user.role !== 'branch_secretary' || !user.branchId) {
        throw new ForbiddenError('Chỉ Bí thư chi đoàn mới có quyền thêm đoàn viên thuộc chi đoàn mình');
      }
      if (await repository.findByCode(payload.maDoanVien)) {
        throw new ConflictError('Mã đoàn viên đã tồn tại');
      }
      return repository.create({
        ...payload,
        branchId: user.branchId,
        wardId: user.wardId,
        awardedByUserId: user.id
      });
    },

    async importMembers(user, items) {
      if (user.role !== 'branch_secretary' || !user.branchId) {
        throw new ForbiddenError('Chỉ Bí thư chi đoàn mới có quyền import đoàn viên');
      }
      const inserted = [];
      for (const item of items) {
        if (!(await repository.findByCode(item.maDoanVien))) {
          inserted.push(
            await repository.create({
              ...item,
              branchId: user.branchId,
              wardId: user.wardId,
              awardedByUserId: user.id
            })
          );
        }
      }
      return { importedCount: inserted.length, items: inserted };
    },

    async updateMember(user, id, updates) {
      if (user.role !== 'branch_secretary' || !user.branchId) {
        throw new ForbiddenError('Chỉ Bí thư chi đoàn mới có quyền chỉnh sửa đoàn viên');
      }
      const existing = await repository.findById(id);
      if (!existing) throw new NotFoundError('Không tìm thấy đoàn viên');
      if (existing.branchId !== user.branchId) {
        throw new ForbiddenError('Bí thư chỉ được quản lý đoàn viên thuộc chi đoàn mình');
      }
      return repository.update(id, updates);
    },

    async deleteMember(user, id) {
      if (user.role !== 'branch_secretary' || !user.branchId) {
        throw new ForbiddenError('Chỉ Bí thư chi đoàn mới có quyền xóa đoàn viên');
      }
      const existing = await repository.findById(id);
      if (!existing) throw new NotFoundError('Không tìm thấy đoàn viên');
      if (existing.branchId !== user.branchId) {
        throw new ForbiddenError('Bí thư chỉ được xóa đoàn viên thuộc chi đoàn mình');
      }
      await repository.remove(id);
      return { deletedId: id };
    },

    async addSocialHours(user, memberId, deltaHours, meta = {}) {
      const existing = await repository.findById(memberId);
      if (!existing) throw new NotFoundError('Không tìm thấy đoàn viên để cộng điểm thi đua');
      if (user.branchId && existing.branchId !== user.branchId) {
        throw new ForbiddenError('Không có quyền thao tác đoàn viên chi đoàn khác');
      }
      if (!user.branchId && user.wardId && existing.wardId !== user.wardId) {
        throw new ForbiddenError('Không có quyền thao tác đoàn viên đơn vị khác');
      }
      return repository.addEmulationPoints({
        memberId,
        activityId: meta.activityId || null,
        points: deltaHours,
        reason: meta.reason || 'Điểm danh hoạt động Đoàn',
        awardedByUserId: user.id
      });
    }
  };
}
