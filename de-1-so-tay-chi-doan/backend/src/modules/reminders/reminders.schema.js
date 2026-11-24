import { z } from 'zod';

export const createReminderSchema = z.object({
  tieuDe: z.string().trim().min(2).max(200),
  hanChot: z.string().trim().min(4),
  chuKy: z.enum(['Hàng tuần', 'Hàng tháng', 'Một lần']).optional().default('Hàng tháng'),
  kenhNhac: z.string().trim().optional().default('Zalo OA + Web Push')
});

export const updateReminderSchema = z.object({
  batNhacTuDong: z.boolean().optional(),
  daHoanThanh: z.boolean().optional()
});

export const reminderParamsSchema = z.object({
  id: z.string().trim().min(1)
});
