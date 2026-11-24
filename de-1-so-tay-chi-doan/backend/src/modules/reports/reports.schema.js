import { z } from 'zod';

export const summaryQuerySchema = z.object({
  period: z.enum(['week', 'month']).optional().default('week')
});
