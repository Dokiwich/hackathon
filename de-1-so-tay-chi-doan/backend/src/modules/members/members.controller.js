import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import {
  createMemberSchema,
  importMembersSchema,
  listMembersQuerySchema,
  memberParamsSchema,
  updateMemberSchema
} from './members.schema.js';

export function createMembersController(service) {
  return {
    async list(request) {
      const query = validateSchema(listMembersQuerySchema, request.query || {});
      const data = await service.listMembers(request.user, query);
      return okResponse(request, data, { total: data.length });
    },

    async getMe(request) {
      const data = await service.getMyProfile(request.user);
      return okResponse(request, data);
    },

    async getLedger(request) {
      const data = await service.getLedger(request.user);
      return okResponse(request, data, { total: data.length });
    },

    async create(request, reply) {
      const body = validateSchema(createMemberSchema, request.body || {});
      const data = await service.createMember(request.user, body);
      return reply.code(201).send(okResponse(request, data));
    },

    async importBatch(request, reply) {
      const body = validateSchema(importMembersSchema, request.body || {});
      const data = await service.importMembers(request.user, body.members);
      return reply.code(201).send(okResponse(request, data));
    },

    async update(request) {
      const { id } = validateSchema(memberParamsSchema, request.params || {});
      const body = validateSchema(updateMemberSchema, request.body || {});
      const data = await service.updateMember(request.user, id, body);
      return okResponse(request, data);
    },

    async remove(request) {
      const { id } = validateSchema(memberParamsSchema, request.params || {});
      const data = await service.deleteMember(request.user, id);
      return okResponse(request, data);
    }
  };
}
