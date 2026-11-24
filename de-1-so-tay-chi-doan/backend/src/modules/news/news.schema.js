import { z } from 'zod';

export const NEWS_CATEGORIES = ['Phong trào', 'Chỉ đạo Đoàn', 'Chi đoàn KP5', 'Thông báo'];

export const listNewsQuerySchema = z.object({
  category: z.string().trim().optional().default('all')
});

export const createNewsSchema = z.object({
  title: z.string().trim().min(4).max(220),
  category: z.enum(NEWS_CATEGORIES).optional().default('Phong trào'),
  source: z.string().trim().min(2).max(120).optional().default('Đoàn Phường Tam Hiệp'),
  location: z.string().trim().min(2).max(160).optional().default('Phường Tam Hiệp, TP. Biên Hòa'),
  publishedAt: z.string().trim().min(4).max(40).optional(),
  image: z.string().trim().min(4).optional().default('news/ra-quan.jpg'),
  summary: z.string().trim().min(8).max(500),
  content: z.string().trim().max(4000).optional(),
  featured: z.boolean().optional().default(false)
});

export const updateNewsSchema = createNewsSchema.partial();

export const newsParamsSchema = z.object({
  id: z.string().trim().min(1)
});
