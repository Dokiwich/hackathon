import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import {
  createReminderSchema,
  reminderParamsSchema,
  updateReminderSchema
} from './reminders.schema.js';

export function createRemindersController(service) {
  return {
    async list(request) {
      const data = await service.listReminders(request.user);
      return okResponse(request, data, { total: data.length });
    },

    async create(request, reply) {
      const body = validateSchema(createReminderSchema, request.body || {});
      const data = await service.createReminder(request.user, body);
      return reply.code(201).send(okResponse(request, data));
    },

    async update(request) {
      const { id } = validateSchema(reminderParamsSchema, request.params || {});
      const body = validateSchema(updateReminderSchema, request.body || {});
      const data = await service.updateReminder(request.user, id, body);
      return okResponse(request, data);
    }
  };
}
