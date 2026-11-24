import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import {
  createNewsSchema,
  listNewsQuerySchema,
  newsParamsSchema,
  updateNewsSchema
} from './news.schema.js';

export function createNewsController(service) {
  return {
    async list(request) {
      const query = validateSchema(listNewsQuerySchema, request.query || {});
      const data = await service.listNews(request.user, query);
      return okResponse(request, data, { total: data.length });
    },

    async create(request, reply) {
      const body = validateSchema(createNewsSchema, request.body || {});
      const data = await service.createNews(request.user, body);
      return reply.code(201).send(okResponse(request, data));
    },

    async update(request) {
      const { id } = validateSchema(newsParamsSchema, request.params || {});
      const body = validateSchema(updateNewsSchema, request.body || {});
      const data = await service.updateNews(request.user, id, body);
      return okResponse(request, data);
    },

    async remove(request) {
      const { id } = validateSchema(newsParamsSchema, request.params || {});
      const data = await service.deleteNews(request.user, id);
      return okResponse(request, data);
    }
  };
}
