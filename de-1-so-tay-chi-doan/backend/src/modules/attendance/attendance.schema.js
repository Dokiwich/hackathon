import { z } from 'zod';

export const createActivitySchema = z.object({
  tenHoatDong: z.string().trim().min(3).max(200),
  ngayToChuc: z.string().trim().min(4),
  khungGio: z.string().trim().optional().default('19:00 - 20:30'),
  diaDiem: z.string().trim().min(2),
  activityType: z.enum(['regular_meeting', 'makeup_meeting', 'volunteer']).optional().default('regular_meeting'),
  gioCongTacXaHoi: z.coerce.number().int().min(1).max(100).optional(),
  emulationPoints: z.coerce.number().int().min(1).max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().default(10.957412),
  longitude: z.coerce.number().min(-180).max(180).optional().default(106.842685),
  geofenceRadiusM: z.coerce.number().int().min(25).max(1000).optional().default(150),
  startsAt: z.string().optional(),
  endsAt: z.string().optional()
});

export const activityParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const createQrSessionSchema = z.object({
  ttlSeconds: z.coerce.number().int().min(15).max(3600).optional().default(900)
});

export const checkInSchema = z.object({
  activityId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
  token: z.string().trim().min(6),
  position: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
    timestamp: z.number()
  })
});
