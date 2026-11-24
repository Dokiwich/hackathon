import { ForbiddenError, NotFoundError } from '../../common/errors.js';

export function createRemindersService({ repository }) {
  return {
    async listReminders(user) {
      return repository.listForUser({
        role: user.role,
        branchId: user.branchId,
        wardId: user.wardId
      });
    },

    async createReminder(user, payload) {
      if (user.role === 'branch_secretary' && user.branchId) {
        return repository.create({
          ...payload,
          scope: 'branch',
          branchId: user.branchId,
          wardId: null,
          effectiveWardId: user.wardId
        });
      }
      if (user.role === 'ward_officer' && user.wardId) {
        return repository.create({
          ...payload,
          scope: 'ward',
          branchId: null,
          wardId: user.wardId,
          effectiveWardId: user.wardId
        });
      }
      throw new ForbiddenError('Không có quyền tạo lịch nhắc');
    },

    async updateReminder(user, id, updates) {
      const existing = await repository.findById(id);
      if (!existing) throw new NotFoundError('Không tìm thấy lịch nhắc việc');
      if (user.role === 'branch_secretary' && (existing.scope !== 'branch' || existing.branchId !== user.branchId)) {
        throw new ForbiddenError('Bí thư chỉ được sửa lịch nhắc của chi đoàn mình');
      }
      if (user.role === 'ward_officer' && existing.wardId !== user.wardId) {
        throw new ForbiddenError('Không có quyền sửa lịch nhắc đơn vị khác');
      }
      return repository.update(id, updates);
    }
  };
}
