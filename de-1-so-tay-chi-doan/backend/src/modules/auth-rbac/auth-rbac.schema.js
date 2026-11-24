import { z } from 'zod';

export const identifySchema = z.object({
  identifier: z.string().trim().min(2).max(80)
});

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(2).max(80).optional(),
    username: z.string().trim().min(2).max(80).optional(),
    password: z.string().min(3)
  })
  .refine((data) => Boolean(data.identifier || data.username), {
    message: 'Vui lòng nhập tài khoản, số điện thoại hoặc mã đoàn viên'
  })
  .transform((data) => ({
    identifier: data.identifier || data.username,
    password: data.password
  }));

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(3),
    newPassword: z.string().min(6).max(128),
    confirmNewPassword: z.string().min(6).max(128)
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Xác nhận mật khẩu mới không khớp',
    path: ['confirmNewPassword']
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword']
  });
