import { z } from 'zod';

const statusInputEnum = z.enum([
  'local',
  'migrant_worker',
  'transferred',
  'Đang ở địa phương',
  'Đi làm xa',
  'Chuyển sinh hoạt',
  'Đang sinh hoạt',
  'Mới kết nạp',
  'Tạm vắng'
]);

export const listMembersQuerySchema = z.object({
  q: z.string().trim().optional().default(''),
  status: z.string().trim().optional().default('all'),
  branchId: z.string().trim().optional().default('')
});

export const createMemberSchema = z.object({
  maDoanVien: z.string().trim().min(2).max(40),
  hoTen: z.string().trim().min(2).max(120),
  sdt: z.string().trim().optional().default(''),
  chucVu: z.string().trim().optional().default('Đoàn viên'),
  trangThai: statusInputEnum.optional().default('local'),
  residenceStatus: z.enum(['local', 'migrant_worker', 'transferred']).optional(),
  workShift: z.enum(['day', 'rotating_shift', 'night', 'student']).optional().default('day'),
  gioCtxh: z.coerce.number().int().min(0).max(500).optional().default(0),
  daDongDoanPhi: z.boolean().optional().default(true)
});

export const updateMemberSchema = createMemberSchema.partial();

export const importMembersSchema = z.object({
  members: z.array(createMemberSchema).min(1).max(500)
});

export const memberParamsSchema = z.object({
  id: z.string().trim().min(1)
});
