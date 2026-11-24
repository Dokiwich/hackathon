-- Sổ Tay Chi Đoàn Số (Đề 1) — Neon PostgreSQL Seed Data (Chuẩn 3NF + Đúng dữ liệu mẫu Đề 1)
-- Chi đoàn Khu phố 5: 46 đoàn viên (31 ở địa phương, 12 đi làm xa, 3 chuyển sinh hoạt)
-- 03 buổi sinh hoạt gần nhất: 28, 19, 33 người tham dự + 2 chi đoàn cùng phường Tam Hiệp

INSERT INTO roles (
  code, label, can_manage_members, can_create_branch_event, can_create_ward_event, can_create_qr, can_view_ward_summary
) VALUES
  ('branch_secretary', 'Bí thư chi đoàn', TRUE, FALSE, FALSE, FALSE, FALSE),
  ('ward_officer', 'Cán bộ Đoàn xã/phường', FALSE, FALSE, TRUE, TRUE, TRUE),
  ('member', 'Đoàn viên', FALSE, FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (code) DO UPDATE SET
  can_manage_members = EXCLUDED.can_manage_members,
  can_create_branch_event = EXCLUDED.can_create_branch_event,
  can_create_ward_event = EXCLUDED.can_create_ward_event,
  can_create_qr = EXCLUDED.can_create_qr,
  can_view_ward_summary = EXCLUDED.can_view_ward_summary;

INSERT INTO wards (id, province_name, district_name, name) VALUES
  ('WARD-TAMHIEP', 'Tỉnh Đồng Nai', 'TP. Biên Hòa', 'Đoàn Phường Tam Hiệp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO branches (id, ward_id, code, name) VALUES
  ('BR-KP5', 'WARD-TAMHIEP', 'KP5', 'Chi đoàn Khu phố 5'),
  ('BR-KP2', 'WARD-TAMHIEP', 'KP2', 'Chi đoàn Khu phố 2'),
  ('BR-KP3', 'WARD-TAMHIEP', 'KP3', 'Chi đoàn Khu phố 3')
ON CONFLICT (id) DO NOTHING;

-- Mật khẩu khởi tạo cho 3 tài khoản demo đều là: 123456 (scrypt hash verified)
INSERT INTO users (
  id, role_code, ward_id, branch_id, username, phone, member_code, password_hash, full_name, is_active
) VALUES
  (
    'USR-BT-KP5',
    'branch_secretary',
    NULL,
    'BR-KP5',
    'bithu.kp5',
    '0912345001',
    'DN-KP5-001',
    'scrypt$kp502026aa11bb22cc33dd44ee550001$10ac46a25f3ad7e691ebe8e0a3bddaa05ac4ac542d262a140de51d4c337a85020b47591b64f8705fa2d4f4db3b040b27601676f10078b226c5a943a75f52fd1e',
    'Trần Minh Khôi',
    TRUE
  ),
  (
    'USR-CB-TH',
    'ward_officer',
    'WARD-TAMHIEP',
    NULL,
    'canbo.tamhiep',
    '0912345900',
    'CB-TH-001',
    'scrypt$kp502026aa11bb22cc33dd44ee550002$f5e6762bb46f9b6c5f4721f624f7a27a856691948a140998b6c6be202f5295ad91a82fde3059f66f3ea71f4a3999a234929abe1a5ff144be58cc1ceaf037a331',
    'Lê Thị Hồng Nhung',
    TRUE
  ),
  (
    'USR-DV-KP5',
    'member',
    NULL,
    'BR-KP5',
    'doanvien.kp5',
    '0912345002',
    'DN-KP5-002',
    'scrypt$kp502026aa11bb22cc33dd44ee550003$13e1a9e2e8f3ca53ed8901ef1be935cce3e677e303b497f0155d6baf1ced831069e4641482faeb05ce9e4c45773dc0cdae09dee0d12886ad47b8c0c54ecdd8e2',
    'Nguyễn Hoàng Anh',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- 46 đoàn viên Chi đoàn Khu phố 5 (31 local, 12 migrant_worker, 3 transferred) + 14 đoàn viên KP2/KP3
INSERT INTO members (
  id, branch_id, user_id, member_code, full_name, dob, phone, joined_date, position_title, residence_status, work_shift, fee_paid
) VALUES
  -- 31 đoàn viên đang ở địa phương (local) — BR-KP5
  ('DV-KP5-001', 'BR-KP5', 'USR-BT-KP5', 'DN-KP5-001', 'Trần Minh Khôi', '1999-04-30', '0912 345 001', '2018-03-26', 'Bí thư Chi đoàn', 'local', 'day', TRUE),
  ('DV-KP5-002', 'BR-KP5', 'USR-DV-KP5', 'DN-KP5-002', 'Nguyễn Hoàng Anh', '2003-05-14', '0912 345 002', '2021-03-26', 'Đoàn viên', 'local', 'rotating_shift', TRUE),
  ('DV-KP5-003', 'BR-KP5', NULL, 'DN-KP5-003', 'Lê Thị Minh Thư', '2002-09-02', '0912 345 003', '2021-05-19', 'Phó Bí thư Chi đoàn', 'local', 'day', TRUE),
  ('DV-KP5-004', 'BR-KP5', NULL, 'DN-KP5-004', 'Phạm Quốc Bảo', '2003-11-21', '0912 345 004', '2020-03-26', 'Ủy viên BCH', 'local', 'day', TRUE),
  ('DV-KP5-005', 'BR-KP5', NULL, 'DN-KP5-005', 'Võ Ngọc Hân', '2004-03-08', '0912 345 005', '2022-10-15', 'Đoàn viên', 'local', 'student', TRUE),
  ('DV-KP5-006', 'BR-KP5', NULL, 'DN-KP5-006', 'Đặng Gia Huy', '2005-07-17', '0912 345 006', '2023-03-26', 'Đoàn viên', 'local', 'rotating_shift', TRUE),
  ('DV-KP5-007', 'BR-KP5', NULL, 'DN-KP5-007', 'Huỳnh Thanh Trúc', '2001-01-29', '0912 345 007', '2021-09-02', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-008', 'BR-KP5', NULL, 'DN-KP5-008', 'Bùi Khánh Linh', '2004-08-24', '0912 345 008', '2023-05-19', 'Đoàn viên', 'local', 'student', TRUE),
  ('DV-KP5-009', 'BR-KP5', NULL, 'DN-KP5-009', 'Ngô Đức Thịnh', '2002-12-06', '0912 345 009', '2022-03-26', 'Đoàn viên', 'local', 'rotating_shift', TRUE),
  ('DV-KP5-010', 'BR-KP5', NULL, 'DN-KP5-010', 'Phan Bảo Ngọc', '2003-10-19', '0912 345 010', '2022-11-20', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-011', 'BR-KP5', NULL, 'DN-KP5-011', 'Lý Nhật Minh', '2006-02-03', '0912 345 011', '2024-03-26', 'Đoàn viên', 'local', 'student', TRUE),
  ('DV-KP5-012', 'BR-KP5', NULL, 'DN-KP5-012', 'Mai Phương Thảo', '2002-06-27', '0912 345 012', '2021-05-15', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-013', 'BR-KP5', NULL, 'DN-KP5-013', 'Đoàn Văn Kiệt', '2004-09-09', '0912 345 013', '2023-03-26', 'Đoàn viên', 'local', 'rotating_shift', TRUE),
  ('DV-KP5-014', 'BR-KP5', NULL, 'DN-KP5-014', 'Tăng Mỹ Duyên', '2005-01-15', '0912 345 014', '2024-05-19', 'Đoàn viên', 'local', 'student', TRUE),
  ('DV-KP5-015', 'BR-KP5', NULL, 'DN-KP5-015', 'Nguyễn Tuấn Kiệt', '2001-04-12', '0912 345 015', '2020-05-19', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-016', 'BR-KP5', NULL, 'DN-KP5-016', 'Trịnh Thảo Nhi', '2003-08-19', '0912 345 016', '2022-03-26', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-017', 'BR-KP5', NULL, 'DN-KP5-017', 'Vũ Hoàng Long', '2000-11-04', '0912 345 017', '2019-03-26', 'Đoàn viên', 'local', 'rotating_shift', TRUE),
  ('DV-KP5-018', 'BR-KP5', NULL, 'DN-KP5-018', 'Lâm Gia Hân', '2005-03-22', '0912 345 018', '2024-03-26', 'Đoàn viên', 'local', 'student', TRUE),
  ('DV-KP5-019', 'BR-KP5', NULL, 'DN-KP5-019', 'Châu Minh Quân', '2002-07-08', '0912 345 019', '2021-03-26', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-020', 'BR-KP5', NULL, 'DN-KP5-020', 'Hồ Thị Yến Vy', '2004-02-14', '0912 345 020', '2023-03-26', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-021', 'BR-KP5', NULL, 'DN-KP5-021', 'Dương Hải Đăng', '2001-09-25', '0912 345 021', '2020-03-26', 'Đoàn viên', 'local', 'rotating_shift', TRUE),
  ('DV-KP5-022', 'BR-KP5', NULL, 'DN-KP5-022', 'Cao Thị Kim Anh', '2003-12-11', '0912 345 022', '2022-05-19', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-023', 'BR-KP5', NULL, 'DN-KP5-023', 'Tô Quốc Hưng', '2002-01-30', '0912 345 023', '2021-03-26', 'Đoàn viên', 'local', 'night', FALSE),
  ('DV-KP5-024', 'BR-KP5', NULL, 'DN-KP5-024', 'Đinh Bảo Trâm', '2006-05-05', '0912 345 024', '2025-03-26', 'Đoàn viên', 'local', 'student', TRUE),
  ('DV-KP5-025', 'BR-KP5', NULL, 'DN-KP5-025', 'Nguyễn Phúc Khang', '2004-10-16', '0912 345 025', '2023-03-26', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-026', 'BR-KP5', NULL, 'DN-KP5-026', 'Trần Thị Thu Hà', '2001-06-21', '0912 345 026', '2020-05-19', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-027', 'BR-KP5', NULL, 'DN-KP5-027', 'Lê Văn Thành Đạt', '2003-03-13', '0912 345 027', '2022-03-26', 'Đoàn viên', 'local', 'rotating_shift', TRUE),
  ('DV-KP5-028', 'BR-KP5', NULL, 'DN-KP5-028', 'Phạm Ngọc Minh Châu', '2005-08-29', '0912 345 028', '2024-03-26', 'Đoàn viên', 'local', 'student', TRUE),
  ('DV-KP5-029', 'BR-KP5', NULL, 'DN-KP5-029', 'Nguyễn Hữu Phước', '2000-02-18', '0912 345 029', '2019-05-19', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-030', 'BR-KP5', NULL, 'DN-KP5-030', 'Võ Thị Thanh Ngân', '2004-11-07', '0912 345 030', '2023-03-26', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP5-031', 'BR-KP5', NULL, 'DN-KP5-031', 'Hoàng Đức Trọng', '2002-04-03', '0912 345 031', '2021-03-26', 'Đoàn viên', 'local', 'rotating_shift', TRUE),

  -- 12 đoàn viên đi làm xa / công nhân KCN (migrant_worker) — BR-KP5
  ('DV-KP5-032', 'BR-KP5', NULL, 'DN-KP5-032', 'Nguyễn Văn Tùng', '1998-08-11', '0912 345 032', '2018-03-26', 'Đoàn viên', 'migrant_worker', 'rotating_shift', TRUE),
  ('DV-KP5-033', 'BR-KP5', NULL, 'DN-KP5-033', 'Trần Thị Mai Linh', '2000-05-20', '0912 345 033', '2019-03-26', 'Đoàn viên', 'migrant_worker', 'night', TRUE),
  ('DV-KP5-034', 'BR-KP5', NULL, 'DN-KP5-034', 'Lê Quang Hải', '1999-12-01', '0912 345 034', '2018-05-19', 'Đoàn viên', 'migrant_worker', 'rotating_shift', TRUE),
  ('DV-KP5-035', 'BR-KP5', NULL, 'DN-KP5-035', 'Phạm Thị Kim Cương', '2001-03-17', '0912 345 035', '2020-03-26', 'Đoàn viên', 'migrant_worker', 'night', FALSE),
  ('DV-KP5-036', 'BR-KP5', NULL, 'DN-KP5-036', 'Võ Minh Trí', '2002-07-23', '0912 345 036', '2021-03-26', 'Đoàn viên', 'migrant_worker', 'rotating_shift', TRUE),
  ('DV-KP5-037', 'BR-KP5', NULL, 'DN-KP5-037', 'Đặng Thị Tuyết Nhung', '2000-09-14', '0912 345 037', '2019-05-19', 'Đoàn viên', 'migrant_worker', 'rotating_shift', TRUE),
  ('DV-KP5-038', 'BR-KP5', NULL, 'DN-KP5-038', 'Bùi Văn Hậu', '1999-01-09', '0912 345 038', '2018-03-26', 'Đoàn viên', 'migrant_worker', 'night', FALSE),
  ('DV-KP5-039', 'BR-KP5', NULL, 'DN-KP5-039', 'Huỳnh Công Danh', '2001-10-28', '0912 345 039', '2020-03-26', 'Đoàn viên', 'migrant_worker', 'rotating_shift', TRUE),
  ('DV-KP5-040', 'BR-KP5', NULL, 'DN-KP5-040', 'Ngô Thị Hồng Gấm', '2003-02-06', '0912 345 040', '2022-03-26', 'Đoàn viên', 'migrant_worker', 'rotating_shift', TRUE),
  ('DV-KP5-041', 'BR-KP5', NULL, 'DN-KP5-041', 'Trương Gia Bảo', '2002-06-15', '0912 345 041', '2021-05-19', 'Đoàn viên', 'migrant_worker', 'night', TRUE),
  ('DV-KP5-042', 'BR-KP5', NULL, 'DN-KP5-042', 'Phan Văn Hào', '2000-11-27', '0912 345 042', '2019-03-26', 'Đoàn viên', 'migrant_worker', 'rotating_shift', FALSE),
  ('DV-KP5-043', 'BR-KP5', NULL, 'DN-KP5-043', 'Lý Thị Thảo Trang', '2001-04-25', '0912 345 043', '2020-03-26', 'Đoàn viên', 'migrant_worker', 'rotating_shift', TRUE),

  -- 3 đoàn viên chuyển sinh hoạt (transferred) — BR-KP5
  ('DV-KP5-044', 'BR-KP5', NULL, 'DN-KP5-044', 'Trương Tấn Phát', '2003-04-11', '0912 345 044', '2021-03-26', 'Đoàn viên', 'transferred', 'student', TRUE),
  ('DV-KP5-045', 'BR-KP5', NULL, 'DN-KP5-045', 'Đỗ Thị Quỳnh Hương', '2004-08-03', '0912 345 045', '2022-03-26', 'Đoàn viên', 'transferred', 'student', TRUE),
  ('DV-KP5-046', 'BR-KP5', NULL, 'DN-KP5-046', 'Nguyễn Thành Luân', '2002-12-19', '0912 345 046', '2021-05-19', 'Đoàn viên', 'transferred', 'day', FALSE),

  -- Đoàn viên các chi đoàn cùng Phường Tam Hiệp (phục vụ trang tổng hợp Cán bộ Đoàn xã/phường)
  ('DV-KP2-001', 'BR-KP2', NULL, 'DN-KP2-001', 'Lê Hoàng Nam', '2001-05-10', '0912 346 001', '2020-03-26', 'Bí thư Chi đoàn', 'local', 'day', TRUE),
  ('DV-KP2-002', 'BR-KP2', NULL, 'DN-KP2-002', 'Nguyễn Thị Kiều Oanh', '2002-07-12', '0912 346 002', '2021-03-26', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP2-003', 'BR-KP2', NULL, 'DN-KP2-003', 'Trần Quốc Trung', '2003-09-14', '0912 346 003', '2022-03-26', 'Đoàn viên', 'local', 'rotating_shift', TRUE),
  ('DV-KP2-004', 'BR-KP2', NULL, 'DN-KP2-004', 'Phạm Thị Ngọc Ánh', '2004-01-22', '0912 346 004', '2023-03-26', 'Đoàn viên', 'local', 'student', TRUE),
  ('DV-KP2-005', 'BR-KP2', NULL, 'DN-KP2-005', 'Võ Tấn Dũng', '2001-11-03', '0912 346 005', '2020-05-19', 'Đoàn viên', 'migrant_worker', 'rotating_shift', TRUE),
  ('DV-KP2-006', 'BR-KP2', NULL, 'DN-KP2-006', 'Đỗ Gia Huy', '2002-03-19', '0912 346 006', '2021-03-26', 'Đoàn viên', 'migrant_worker', 'night', FALSE),
  ('DV-KP2-007', 'BR-KP2', NULL, 'DN-KP2-007', 'Hoàng Thảo Vy', '2005-06-28', '0912 346 007', '2024-03-26', 'Đoàn viên', 'local', 'student', TRUE),
  ('DV-KP2-008', 'BR-KP2', NULL, 'DN-KP2-008', 'Bùi Minh Nhật', '2003-10-05', '0912 346 008', '2022-03-26', 'Đoàn viên', 'transferred', 'day', TRUE),

  ('DV-KP3-001', 'BR-KP3', NULL, 'DN-KP3-001', 'Nguyễn Thanh Phong', '2000-08-18', '0912 347 001', '2019-03-26', 'Bí thư Chi đoàn', 'local', 'day', TRUE),
  ('DV-KP3-002', 'BR-KP3', NULL, 'DN-KP3-002', 'Trần Ngọc Trâm', '2002-02-24', '0912 347 002', '2021-03-26', 'Đoàn viên', 'local', 'day', TRUE),
  ('DV-KP3-003', 'BR-KP3', NULL, 'DN-KP3-003', 'Lý Văn Tài', '2001-12-09', '0912 347 003', '2020-05-19', 'Đoàn viên', 'migrant_worker', 'rotating_shift', TRUE),
  ('DV-KP3-004', 'BR-KP3', NULL, 'DN-KP3-004', 'Phan Thị Tường Vy', '2004-04-30', '0912 347 004', '2023-03-26', 'Đoàn viên', 'local', 'student', TRUE),
  ('DV-KP3-005', 'BR-KP3', NULL, 'DN-KP3-005', 'Đặng Công Sơn', '2003-07-01', '0912 347 005', '2022-03-26', 'Đoàn viên', 'local', 'day', FALSE),
  ('DV-KP3-006', 'BR-KP3', NULL, 'DN-KP3-006', 'Hồ Ngọc Bích', '2002-09-16', '0912 347 006', '2021-03-26', 'Đoàn viên', 'migrant_worker', 'night', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO activities (
  id, scope, branch_id, ward_id, title, activity_type, parent_activity_id, activity_date, start_time, end_time, location, emulation_points, geofence_radius_m, is_closed, status, created_by_user_id
) VALUES
  -- 03 buổi sinh hoạt gần nhất của Chi đoàn Khu phố 5 (28, 19, 33 người tham dự)
  ('ACT-KP5-01', 'branch', 'BR-KP5', NULL, 'Sinh hoạt Chi đoàn KP5 tháng 11 — Chuyên đề Chuyển đổi số cơ sở', 'regular_meeting', NULL, '2026-11-16', '19:00', '20:30', 'Nhà văn hóa Khu phố 5, P. Tam Hiệp', 8, 120, TRUE, 'completed', 'USR-BT-KP5'),
  ('ACT-KP5-02', 'branch', 'BR-KP5', NULL, 'Sinh hoạt Chi đoàn KP5 đầu tháng 11 — Triển khai VNeID & an toàn mạng', 'regular_meeting', NULL, '2026-11-02', '19:00', '20:30', 'Nhà văn hóa Khu phố 5, P. Tam Hiệp', 8, 120, TRUE, 'completed', 'USR-BT-KP5'),
  ('ACT-KP5-03', 'branch', 'BR-KP5', NULL, 'Sinh hoạt Chi đoàn KP5 tháng 10 — Kỷ niệm Ngày truyền thống Hội LHTN', 'regular_meeting', NULL, '2026-10-19', '19:00', '21:00', 'Nhà văn hóa Khu phố 5, P. Tam Hiệp', 10, 150, TRUE, 'completed', 'USR-BT-KP5'),
  -- Buổi sinh hoạt bù cho đoàn viên làm ca + tình nguyện tích điểm thi đua
  ('ACT-KP5-04', 'branch', 'BR-KP5', NULL, 'Sinh hoạt bù KP5 dành cho đoàn viên công nhân làm ca tối Thứ 7', 'makeup_meeting', 'ACT-KP5-01', '2026-11-28', '19:30', '20:45', 'Điểm sinh hoạt công nhân KCN Amata / KP5', 6, 150, FALSE, 'ongoing', 'USR-BT-KP5'),
  ('ACT-KP5-05', 'branch', 'BR-KP5', NULL, 'Ngày Chủ Nhật Xanh KP5 — Xóa điểm đen rác tuyến đường Phạm Văn Thuận', 'volunteer', NULL, '2026-11-29', '07:00', '10:00', 'Tuyến đường Phạm Văn Thuận — Khu phố 5', 6, 200, FALSE, 'ongoing', 'USR-BT-KP5'),
  -- Sự kiện cấp Phường do Cán bộ Đoàn phường tổ chức & tạo QR
  ('ACT-WARD-01', 'ward', NULL, 'WARD-TAMHIEP', 'Ngày hội Hiến máu tình nguyện Phường Tam Hiệp đợt IV/2026', 'volunteer', NULL, '2026-12-05', '06:30', '11:00', 'Hội trường UBND Phường Tam Hiệp, TP. Biên Hòa', 8, 250, FALSE, 'ongoing', 'USR-CB-TH'),
  -- Hoạt động chi đoàn bạn cùng phường phục vụ bảng tổng hợp
  ('ACT-KP2-01', 'branch', 'BR-KP2', NULL, 'Sinh hoạt Chi đoàn KP2 tháng 11', 'regular_meeting', NULL, '2026-11-17', '19:00', '20:30', 'Nhà văn hóa Khu phố 2', 12, 120, TRUE, 'completed', NULL),
  ('ACT-KP3-01', 'branch', 'BR-KP3', NULL, 'Sinh hoạt Chi đoàn KP3 tháng 11', 'regular_meeting', NULL, '2026-11-18', '19:00', '20:30', 'Nhà văn hóa Khu phố 3', 12, 120, TRUE, 'completed', NULL)
ON CONFLICT (id) DO NOTHING;

-- Đúng 28 người tham dự ACT-KP5-01
INSERT INTO attendance_records (activity_id, member_id, check_in_method, verified_by_user_id)
SELECT 'ACT-KP5-01', id, 'qr_dynamic', 'USR-BT-KP5'
FROM members
WHERE branch_id = 'BR-KP5' AND id BETWEEN 'DV-KP5-001' AND 'DV-KP5-028'
ON CONFLICT (activity_id, member_id) DO NOTHING;

-- Đúng 19 người tham dự ACT-KP5-02
INSERT INTO attendance_records (activity_id, member_id, check_in_method, verified_by_user_id)
SELECT 'ACT-KP5-02', id, 'qr_dynamic', 'USR-BT-KP5'
FROM members
WHERE branch_id = 'BR-KP5' AND id BETWEEN 'DV-KP5-001' AND 'DV-KP5-019'
ON CONFLICT (activity_id, member_id) DO NOTHING;

-- Đúng 33 người tham dự ACT-KP5-03
INSERT INTO attendance_records (activity_id, member_id, check_in_method, verified_by_user_id)
SELECT 'ACT-KP5-03', id, 'qr_dynamic', 'USR-BT-KP5'
FROM members
WHERE branch_id = 'BR-KP5' AND id BETWEEN 'DV-KP5-001' AND 'DV-KP5-033'
ON CONFLICT (activity_id, member_id) DO NOTHING;

-- Điểm danh mẫu của KP2 (6 người) và KP3 (4 người)
INSERT INTO attendance_records (activity_id, member_id, check_in_method, verified_by_user_id)
SELECT 'ACT-KP2-01', id, 'qr_dynamic', NULL
FROM members
WHERE branch_id = 'BR-KP2' AND id BETWEEN 'DV-KP2-001' AND 'DV-KP2-006'
ON CONFLICT (activity_id, member_id) DO NOTHING;

INSERT INTO attendance_records (activity_id, member_id, check_in_method, verified_by_user_id)
SELECT 'ACT-KP3-01', id, 'qr_dynamic', NULL
FROM members
WHERE branch_id = 'BR-KP3' AND id BETWEEN 'DV-KP3-001' AND 'DV-KP3-004'
ON CONFLICT (activity_id, member_id) DO NOTHING;

-- Đăng ký sinh hoạt bù cho đoàn viên làm ca KP5
INSERT INTO makeup_registrations (member_id, missed_activity_id, makeup_activity_id, shift_reason, status) VALUES
  ('DV-KP5-002', 'ACT-KP5-01', 'ACT-KP5-04', 'Ca tối KCN Amata 14:00 - 22:00', 'approved'),
  ('DV-KP5-032', 'ACT-KP5-01', 'ACT-KP5-04', 'Tăng ca xưởng cơ khí Biên Hòa', 'approved'),
  ('DV-KP5-034', 'ACT-KP5-02', 'ACT-KP5-04', 'Làm ca xoay KCN Loteco', 'pending')
ON CONFLICT (member_id, missed_activity_id) DO NOTHING;

-- Sổ điểm thi đua & giờ CTXH đồng bộ từ toàn bộ bản ghi điểm danh thực
INSERT INTO emulation_point_ledger (member_id, activity_id, points, reason, awarded_by_user_id)
SELECT
  ar.member_id,
  ar.activity_id,
  a.emulation_points,
  a.title,
  COALESCE(ar.verified_by_user_id, 'USR-BT-KP5')
FROM attendance_records ar
JOIN activities a ON a.id = ar.activity_id
WHERE NOT EXISTS (
  SELECT 1 FROM emulation_point_ledger e
  WHERE e.member_id = ar.member_id AND e.activity_id = ar.activity_id
);

-- Cộng thêm giờ tình nguyện cơ sở đầu năm cho đoàn viên tích cực để sát thực tế chỉ tiêu 24h
INSERT INTO emulation_point_ledger (member_id, activity_id, points, reason, awarded_by_user_id)
SELECT
  m.id,
  NULL,
  CASE
    WHEN m.residence_status = 'local' THEN 8
    WHEN m.residence_status = 'migrant_worker' THEN 6
    ELSE 4
  END,
  'Chiến dịch Xuân Tình Nguyện & Tháng Thanh Niên 2026',
  'USR-BT-KP5'
FROM members m
WHERE NOT EXISTS (
  SELECT 1 FROM emulation_point_ledger e
  WHERE e.member_id = m.id AND e.activity_id IS NULL
);

INSERT INTO reminders (
  id, scope, branch_id, ward_id, activity_id, title, due_at, recurrence, remind_before, target_role_code, auto_enabled, is_completed
) VALUES
  ('RM-KP5-01', 'branch', 'BR-KP5', NULL, 'ACT-KP5-04', 'Nhắc đoàn viên làm ca đăng ký & dự Sinh hoạt bù tối Thứ 7', '2026-11-28 19:30:00+07', 'monthly', 'Trước 24 giờ', 'member', TRUE, FALSE),
  ('RM-KP5-02', 'branch', 'BR-KP5', NULL, 'ACT-KP5-05', 'Điểm danh QR động Ngày Chủ Nhật Xanh Khu phố 5', '2026-11-29 07:00:00+07', 'monthly', 'Trước 12 giờ', 'member', TRUE, FALSE),
  ('RM-KP5-03', 'branch', 'BR-KP5', NULL, NULL, 'Thu đoàn phí tháng 11/2026 Khu phố 5 (còn 5 ĐV chưa đóng)', '2026-11-30 17:00:00+07', 'monthly', 'Trước 48 giờ', 'branch_secretary', TRUE, FALSE),
  ('RM-KP5-04', 'branch', 'BR-KP5', NULL, NULL, 'Chốt báo cáo tháng gửi Đoàn Phường Tam Hiệp', '2026-11-29 17:00:00+07', 'monthly', 'Trước 24 giờ', 'branch_secretary', TRUE, FALSE),
  ('RM-WARD-01', 'ward', NULL, 'WARD-TAMHIEP', 'ACT-WARD-01', 'Tổng hợp danh sách đoàn viên tham gia Hiến máu Phường Tam Hiệp', '2026-12-03 18:00:00+07', 'once', 'Trước 48 giờ', 'ward_officer', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO reminder_channels (reminder_id, channel_code) VALUES
  ('RM-KP5-01', 'zalo_group'),
  ('RM-KP5-01', 'web_push'),
  ('RM-KP5-02', 'zalo_oa'),
  ('RM-KP5-02', 'web_push'),
  ('RM-KP5-03', 'zalo_oa'),
  ('RM-KP5-04', 'web_push'),
  ('RM-WARD-01', 'zalo_oa'),
  ('RM-WARD-01', 'zalo_group'),
  ('RM-WARD-01', 'sms')
ON CONFLICT (reminder_id, channel_code) DO NOTHING;

INSERT INTO news (
  id, ward_id, category, source_name, location, published_at_label, image_path, title, summary, content, is_featured, author_user_id
) VALUES
  (
    'NEWS-01',
    'WARD-TAMHIEP',
    'Phong trào',
    'Tỉnh đoàn Đồng Nai',
    'Quảng trường Tỉnh Đồng Nai',
    '24/11/2026',
    'news/ra-quan.jpg',
    'Ra quân Tháng Thanh niên & Chuyển đổi số đồng loạt tại 95 xã, phường',
    'Hàng trăm cán bộ Đoàn và đoàn viên phất cờ xuất quân triển khai Sổ tay Đoàn viên số, mã QR động chấm công và lịch sinh hoạt bù cho công nhân KCN.',
    'Ban Thường vụ Tỉnh đoàn Đồng Nai phát động đợt cao điểm chuyển đổi số tại 95 xã, phường trên toàn địa bàn. Cán bộ Đoàn cơ sở sử dụng bảng tin số điều phối hoạt động, phát mã QR điểm danh 45 giây và tổng hợp báo cáo tháng theo thời gian thực. Đoàn viên đi làm xa hoặc làm ca xoay tại KCN có thể đăng ký sinh hoạt bù linh hoạt ngay trên ứng dụng.',
    TRUE,
    'USR-CB-TH'
  ),
  (
    'NEWS-02',
    'WARD-TAMHIEP',
    'Phong trào',
    'Đoàn Phường Tam Hiệp',
    'Hội trường UBND Phường Tam Hiệp',
    '22/11/2026',
    'news/hien-mau.jpg',
    'Ngày hội Hiến máu tình nguyện "Mỗi giọt máu cho đi — Một cuộc đời ở lại"',
    'Đội hình tình nguyện viên Phường Tam Hiệp túc trực hỗ trợ tiếp đón, hướng dẫn quét mã QR đăng ký nhanh và ghi nhận +25 điểm thi đua.',
    'Chương trình hiến máu tình nguyện đợt IV/2026 quy tụ đông đảo đoàn viên thanh niên từ Chi đoàn Khu phố 2, Khu phố 3 và Khu phố 5. Đoàn viên chỉ cần quét QR động tại bàn check-in là hệ thống tự động cộng 25 điểm thi đua và cập nhật giờ công tác xã hội vào sổ cá nhân.',
    FALSE,
    'USR-CB-TH'
  ),
  (
    'NEWS-03',
    'WARD-TAMHIEP',
    'Chỉ đạo Đoàn',
    'Thành đoàn Biên Hòa',
    'Trung tâm Hội nghị TP. Biên Hòa',
    '20/11/2026',
    'news/giao-thong.jpg',
    'Ngày hội Thanh niên với Văn hóa giao thông & Tổng kết Chiến dịch Tình nguyện Hè',
    'Phát động mô hình Cổng trường An toàn giao thông, đội hình thanh niên xung kích giữ gìn trật tự đô thị và tuyên dương tập thể xuất sắc.',
    'Thành đoàn Biên Hòa phối hợp lực lượng Công an địa phương triển khai ký cam kết văn hóa giao thông trong thanh niên công nhân và học sinh, sinh viên. Các chi đoàn khu phố duy trì tổ phản ứng nhanh vào giờ cao điểm và tổ chức sinh hoạt chuyên đề định kỳ hàng tháng.',
    FALSE,
    'USR-CB-TH'
  ),
  (
    'NEWS-04',
    'WARD-TAMHIEP',
    'Chi đoàn KP5',
    'Chi đoàn Khu phố 5',
    'Nhà văn hóa Khu phố 5, P. Tam Hiệp',
    '18/11/2026',
    'news/sinh-hoat.jpg',
    'Sinh hoạt Chi đoàn KP5 — Trao sổ tay Đoàn viên & mở ca sinh hoạt bù tối Thứ 7',
    'Hội nghị chi đoàn trao tặng ấn phẩm tuyên truyền cho đoàn viên trẻ và thống nhất khung giờ 19:30 tối Thứ 7 dành riêng cho 12 công nhân làm ca.',
    'Chi đoàn Khu phố 5 hiện có 46 đoàn viên (31 đang ở địa phương, 12 đi làm xa, 3 chuyển sinh hoạt). Nhằm bảo đảm tỷ lệ sinh hoạt đạt trên 70%, Bí thư chi đoàn mở thêm phiên sinh hoạt bù vào tối Thứ 7 hàng tuần để công nhân tại KCN Amata và Loteco vẫn tham gia đầy đủ.',
    FALSE,
    'USR-CB-TH'
  ),
  (
    'NEWS-05',
    'WARD-TAMHIEP',
    'Thông báo',
    'Đoàn Phường Tam Hiệp',
    '95 Xã / Phường — TP. Biên Hòa',
    '15/11/2026',
    'news/ra-quan.jpg',
    'Hướng dẫn chuẩn hóa báo cáo tháng & minh bạch trạng thái cư trú đoàn viên',
    'Cán bộ Đoàn phường theo dõi tỷ lệ chuyên cần 3 kỳ gần nhất của các chi đoàn trực thuộc và xuất báo cáo Word/CSV/PDF A4 chỉ với 1 lần bấm.',
    'Từ tháng 11/2026, số liệu sinh hoạt của từng chi đoàn được tự động khóa qua điểm danh QR động và đăng ký sinh hoạt bù. Các chi đoàn dưới ngưỡng 70% sẽ được Đoàn phường hỗ trợ kịp thời trước hạn nộp báo cáo ngày 30 hàng tháng.',
    FALSE,
    'USR-CB-TH'
  )
ON CONFLICT (id) DO NOTHING;
