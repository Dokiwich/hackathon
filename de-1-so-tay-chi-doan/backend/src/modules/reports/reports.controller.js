import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import { summaryQuerySchema } from './reports.schema.js';

export function createReportsController(service) {
  return {
    async getSummary(request) {
      const query = validateSchema(summaryQuerySchema, request.query || {});
      const data = await service.buildSummary(request.user, query.period);
      return okResponse(request, data);
    },

    async exportCsv(request, reply) {
      const csv = await service.buildMembersCsv(request.user);
      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', 'attachment; filename="bao-cao-doan-vien.csv"')
        .send(csv);
    }
  };
}
