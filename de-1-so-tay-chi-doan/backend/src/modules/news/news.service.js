import { ForbiddenError, NotFoundError } from '../../common/errors.js';

export function createNewsService({ repository }) {
  return {
    async listNews(user, { category }) {
      const wardId = user.wardId || 'WARD-TAMHIEP';
      return repository.list({ wardId, category });
    },

    async createNews(user, payload) {
      if (user.role !== 'ward_officer') {
        throw new ForbiddenError('Chỉ Cán bộ Đoàn phường mới được đăng tin tức tổng quan');
      }
      return repository.create({
        ...payload,
        wardId: user.wardId || 'WARD-TAMHIEP',
        authorUserId: user.id
      });
    },

    async updateNews(user, id, updates) {
      if (user.role !== 'ward_officer') {
        throw new ForbiddenError('Chỉ Cán bộ Đoàn phường mới được chỉnh sửa tin tức');
      }
      const existing = await repository.findById(id);
      if (!existing) throw new NotFoundError('Không tìm thấy bản tin');
      if (user.wardId && existing.wardId !== user.wardId) {
        throw new ForbiddenError('Không có quyền sửa bản tin đơn vị khác');
      }
      return repository.update(id, existing.wardId, updates);
    },

    async deleteNews(user, id) {
      if (user.role !== 'ward_officer') {
        throw new ForbiddenError('Chỉ Cán bộ Đoàn phường mới được xóa tin tức');
      }
      const existing = await repository.findById(id);
      if (!existing) throw new NotFoundError('Không tìm thấy bản tin');
      if (user.wardId && existing.wardId !== user.wardId) {
        throw new ForbiddenError('Không có quyền xóa bản tin đơn vị khác');
      }
      await repository.remove(id);
      return { deleted: true, id };
    }
  };
}
