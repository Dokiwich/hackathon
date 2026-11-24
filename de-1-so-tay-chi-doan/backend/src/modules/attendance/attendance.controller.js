import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import {
  activityParamsSchema,
  checkInSchema,
  createActivitySchema,
  createQrSessionSchema
} from './attendance.schema.js';

export function createAttendanceController(service) {
  return {
    async list(request) {
      const data = await service.listActivities(request.user);
      return okResponse(request, data, { total: data.length });
    },

    async create(request, reply) {
      const body = validateSchema(createActivitySchema, request.body || {});
      const data = await service.createActivity(request.user, body);
      return reply.code(201).send(okResponse(request, data));
    },

    async issueQrSession(request, reply) {
      const { id } = validateSchema(activityParamsSchema, request.params || {});
      const body = validateSchema(createQrSessionSchema, request.body || {});
      const data = await service.issueQrSession(request.user, id, body.ttlSeconds);
      return reply.code(201).send(okResponse(request, data));
    },

    async closeActivity(request) {
      const { id } = validateSchema(activityParamsSchema, request.params || {});
      const data = await service.closeActivity(request.user, id);
      return okResponse(request, data);
    },

    async removeActivity(request) {
      const { id } = validateSchema(activityParamsSchema, request.params || {});
      const data = await service.deleteActivity(request.user, id);
      return okResponse(request, data);
    },

    async checkIn(request) {
      const body = validateSchema(checkInSchema, request.body || {});
      const data = await service.checkInWithQr(request.user, body);
      return okResponse(request, data);
    }
  };
}
