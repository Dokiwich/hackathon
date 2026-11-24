import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../common/errors.js';
import { verifyGpsPosition } from '../../common/gps.js';

export function createAttendanceService({ repository, membersApi, qrSecret }) {
  const secret =
    qrSecret && qrSecret.trim().length >= 16
      ? qrSecret.trim()
      : 'dev-only-qr-hmac-secret-32-chars-min';

  function signSession(activityId, nonce, expiresAt, len = 32) {
    return createHmac('sha256', secret)
      .update(`${activityId}:${nonce}:${expiresAt}`)
      .digest('hex')
      .slice(0, len);
  }

  return {
    async listActivities(user) {
      return repository.listForUser({
        role: user.role,
        branchId: user.branchId,
        wardId: user.wardId
      });
    },

    async createActivity(user, payload) {
      if (user.role !== 'ward_officer' || !user.wardId) {
        throw new ForbiddenError('Chỉ Cán bộ Đoàn xã/phường được tạo sự kiện và phát mã QR');
      }
      return repository.create({
        ...payload,
        scope: 'ward',
        branchId: null,
        wardId: user.wardId,
        effectiveWardId: user.wardId,
        createdByUserId: user.id
      });
    },

    async issueQrSession(user, activityId, ttlSeconds = 900) {
      if (user.role !== 'ward_officer') {
        throw new ForbiddenError('Chỉ Cán bộ Đoàn xã/phường được phát mã QR điểm danh');
      }
      const act = await repository.findById(activityId);
      if (!act) throw new NotFoundError('Không tìm thấy hoạt động');
      if (act.wardId !== user.wardId) {
        throw new ForbiddenError('Không có quyền tạo QR cho đơn vị khác');
      }
      if (act.isClosed) {
        throw new ValidationError('Sự kiện đã đóng điểm danh');
      }

      const nonce = randomBytes(4).toString('hex').toUpperCase();
      const expiresAt = Date.now() + ttlSeconds * 1000;
      const sig = signSession(activityId, nonce, expiresAt);
      const token = `${activityId}.${nonce}.${expiresAt}.${sig}`;

      return repository.saveQrSession({
        activityId,
        createdByUserId: user.id,
        code: nonce,
        token,
        expiresAt,
        ttlSeconds
      });
    },

    async closeActivity(user, activityId) {
      if (user.role !== 'ward_officer') {
        throw new ForbiddenError('Chỉ Cán bộ Đoàn xã/phường được đóng điểm danh sự kiện');
      }
      const act = await repository.findById(activityId);
      if (!act) throw new NotFoundError('Không tìm thấy hoạt động');
      if (act.wardId !== user.wardId) {
        throw new ForbiddenError('Không có quyền đóng sự kiện đơn vị khác');
      }
      return repository.closeActivity(activityId);
    },

    async deleteActivity(user, activityId) {
      if (user.role !== 'ward_officer') {
        throw new ForbiddenError('Chỉ Cán bộ Đoàn xã/phường được xóa sự kiện');
      }
      const act = await repository.findById(activityId);
      if (!act) throw new NotFoundError('Không tìm thấy hoạt động');
      if (act.wardId !== user.wardId) {
        throw new ForbiddenError('Không có quyền xóa sự kiện đơn vị khác');
      }
      await repository.removeActivity(activityId);
      return { deleted: true, id: activityId };
    },

    async checkInWithQr(user, { activityId, memberId, token, position }, nowMs = Date.now()) {
      const act = await repository.findById(activityId);
      if (!act) throw new NotFoundError('Không tìm thấy hoạt động');

      if (act.wardId !== user.wardId) {
        throw new ForbiddenError('Không có quyền điểm danh hoạt động đơn vị khác');
      }
      if (act.isClosed) {
        throw new ValidationError('Đoàn phường, xã đã đóng điểm danh');
      }
      if (
        (user.role === 'member' || user.role === 'branch_secretary') &&
        user.memberId &&
        memberId !== user.memberId
      ) {
        throw new ForbiddenError('Chỉ được quét điểm danh QR + GPS cho chính mình');
      }

      const parts = String(token || '').split('.');
      if (parts.length !== 4 || parts[0] !== activityId) {
        throw new ValidationError('Mã QR không đúng định dạng hoặc sai hoạt động');
      }
      const [partActId, nonce, expStr, sig] = parts;
      const expiresAt = Number(expStr);
      const expectedSig = signSession(partActId, nonce, expiresAt, sig.length === 16 ? 16 : 32);

      const a = Buffer.from(sig);
      const b = Buffer.from(expectedSig);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new ValidationError('Chữ ký QR không hợp lệ');
      }

      const stored = await repository.findQrSession(token);
      if (!stored) {
        throw new ValidationError('Phiên QR không tồn tại');
      }

      if (nowMs > expiresAt) {
        throw new ValidationError('Mã QR đã hết hiệu lực');
      }

      const gps = verifyGpsPosition(act, position, nowMs);

      if (act.checkedInMemberIds.includes(memberId)) {
        throw new ConflictError('Đoàn viên đã điểm danh cho hoạt động này');
      }

      await repository.markCheckedIn(activityId, memberId, user.id, {
        distanceM: gps.distance,
        accuracyM: gps.accuracy
      });
      const updatedMember = await membersApi.addSocialHours(user, memberId, act.emulationPoints, {
        activityId,
        reason: act.tenHoatDong
      });

      return {
        activityId,
        memberId,
        addedHours: act.emulationPoints,
        totalMemberHours: updatedMember.gioCtxh,
        distanceM: gps.distance,
        accuracyM: gps.accuracy,
        radiusM: gps.radius
      };
    }
  };
}
