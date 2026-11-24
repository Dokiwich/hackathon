-- Sổ Tay Chi Đoàn Số (Đề 1) — Neon PostgreSQL Schema (Chuẩn 3NF)
-- Có thể chạy trực tiếp trong Neon SQL Editor hoặc qua: npm run db:reset-3nf

CREATE TABLE IF NOT EXISTS roles (
  code TEXT PRIMARY KEY CHECK (code IN ('branch_secretary', 'ward_officer', 'member')),
  label TEXT NOT NULL,
  can_manage_members BOOLEAN NOT NULL DEFAULT FALSE,
  can_create_branch_event BOOLEAN NOT NULL DEFAULT FALSE,
  can_create_ward_event BOOLEAN NOT NULL DEFAULT FALSE,
  can_create_qr BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_ward_summary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS wards (
  id TEXT PRIMARY KEY,
  province_name TEXT NOT NULL,
  district_name TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  ward_id TEXT NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Người dùng gắn theo phạm vi: ward_officer -> ward_id; branch_secretary/member -> branch_id (tránh phụ thuộc bắc cầu)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role_code TEXT NOT NULL REFERENCES roles(code),
  ward_id TEXT REFERENCES wards(id) ON DELETE CASCADE,
  branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  member_code TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  password_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_user_scope_3nf CHECK (
    (role_code = 'ward_officer' AND ward_id IS NOT NULL AND branch_id IS NULL)
    OR (role_code IN ('branch_secretary', 'member') AND branch_id IS NOT NULL AND ward_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  member_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  dob DATE,
  phone TEXT NOT NULL DEFAULT '',
  joined_date DATE,
  position_title TEXT NOT NULL DEFAULT 'Đoàn viên',
  residence_status TEXT NOT NULL DEFAULT 'local'
    CHECK (residence_status IN ('local', 'migrant_worker', 'transferred')),
  work_shift TEXT NOT NULL DEFAULT 'day'
    CHECK (work_shift IN ('day', 'rotating_shift', 'night', 'student')),
  fee_paid BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('branch', 'ward')),
  branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
  ward_id TEXT REFERENCES wards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('regular_meeting', 'makeup_meeting', 'volunteer')),
  parent_activity_id TEXT REFERENCES activities(id) ON DELETE SET NULL,
  activity_date DATE NOT NULL,
  start_time TEXT NOT NULL DEFAULT '19:00',
  end_time TEXT NOT NULL DEFAULT '20:30',
  location TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL DEFAULT 10.9574120,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 106.8426850,
  emulation_points INT NOT NULL DEFAULT 10 CHECK (emulation_points >= 0),
  geofence_radius_m INT NOT NULL DEFAULT 150,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_activity_scope_3nf CHECK (
    (scope = 'branch' AND branch_id IS NOT NULL AND ward_id IS NULL)
    OR (scope = 'ward' AND ward_id IS NOT NULL AND branch_id IS NULL)
  )
);

ALTER TABLE activities ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION NOT NULL DEFAULT 10.9574120;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION NOT NULL DEFAULT 106.8426850;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_closed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS qr_sessions (
  token TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at BIGINT NOT NULL,
  ttl_seconds INT NOT NULL DEFAULT 45,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_in_method TEXT NOT NULL DEFAULT 'qr_dynamic'
    CHECK (check_in_method IN ('qr_dynamic', 'manual_secretary', 'makeup_qr')),
  distance_m INT,
  accuracy_m INT,
  verified_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (activity_id, member_id)
);

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS distance_m INT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS accuracy_m INT;

CREATE TABLE IF NOT EXISTS makeup_registrations (
  id SERIAL PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  missed_activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  makeup_activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  shift_reason TEXT NOT NULL DEFAULT 'Trùng ca sản xuất KCN',
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, missed_activity_id)
);

CREATE TABLE IF NOT EXISTS emulation_point_ledger (
  id SERIAL PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activity_id TEXT REFERENCES activities(id) ON DELETE SET NULL,
  points INT NOT NULL,
  reason TEXT NOT NULL,
  awarded_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('branch', 'ward')),
  branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE,
  ward_id TEXT REFERENCES wards(id) ON DELETE CASCADE,
  activity_id TEXT REFERENCES activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'monthly' CHECK (recurrence IN ('weekly', 'monthly', 'once')),
  remind_before TEXT NOT NULL DEFAULT 'Trước 24 giờ',
  target_role_code TEXT REFERENCES roles(code) ON DELETE SET NULL,
  auto_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_reminder_scope_3nf CHECK (
    (scope = 'branch' AND branch_id IS NOT NULL AND ward_id IS NULL)
    OR (scope = 'ward' AND ward_id IS NOT NULL AND branch_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS reminder_channels (
  reminder_id TEXT NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  channel_code TEXT NOT NULL CHECK (channel_code IN ('zalo_oa', 'zalo_group', 'web_push', 'sms')),
  PRIMARY KEY (reminder_id, channel_code)
);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  ward_id TEXT NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Phong trào', 'Chỉ đạo Đoàn', 'Chi đoàn KP5', 'Thông báo')),
  source_name TEXT NOT NULL,
  location TEXT NOT NULL,
  published_at_label TEXT NOT NULL,
  image_path TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_ward ON branches(ward_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_code);
CREATE INDEX IF NOT EXISTS idx_members_branch_status ON members(branch_id, residence_status);
CREATE INDEX IF NOT EXISTS idx_activities_scope ON activities(scope, branch_id, ward_id);
CREATE INDEX IF NOT EXISTS idx_attendance_activity ON attendance_records(activity_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance_records(member_id);
CREATE INDEX IF NOT EXISTS idx_emulation_member ON emulation_point_ledger(member_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scope ON reminders(scope, branch_id, ward_id);
CREATE INDEX IF NOT EXISTS idx_news_ward_created ON news(ward_id, is_featured DESC, created_at DESC);

CREATE OR REPLACE VIEW v_member_emulation_totals AS
SELECT
  m.id AS member_id,
  COALESCE(e.total_points, 0)::INT AS total_points,
  COALESCE(a.attended_count, 0)::INT AS attended_count
FROM members m
LEFT JOIN (
  SELECT member_id, SUM(points) AS total_points
  FROM emulation_point_ledger
  GROUP BY member_id
) e ON e.member_id = m.id
LEFT JOIN (
  SELECT member_id, COUNT(*) AS attended_count
  FROM attendance_records
  GROUP BY member_id
) a ON a.member_id = m.id;

CREATE OR REPLACE VIEW v_branch_monthly_summary AS
WITH member_stats AS (
  SELECT
    branch_id,
    COUNT(*)::INT AS total_members,
    COUNT(*) FILTER (WHERE residence_status = 'local')::INT AS local_count,
    COUNT(*) FILTER (WHERE residence_status = 'migrant_worker')::INT AS migrant_worker_count,
    COUNT(*) FILTER (WHERE residence_status = 'transferred')::INT AS transferred_count,
    COUNT(*) FILTER (WHERE fee_paid)::INT AS fee_paid_count
  FROM members
  GROUP BY branch_id
),
activity_stats AS (
  SELECT
    branch_id,
    COUNT(*)::INT AS branch_activities_count
  FROM activities
  WHERE scope = 'branch'
  GROUP BY branch_id
),
attendance_stats AS (
  SELECT
    a.branch_id,
    COUNT(ar.id)::INT AS total_checkins
  FROM activities a
  JOIN attendance_records ar ON ar.activity_id = a.id
  WHERE a.scope = 'branch'
  GROUP BY a.branch_id
)
SELECT
  b.id AS branch_id,
  b.ward_id,
  b.code AS branch_code,
  b.name AS branch_name,
  COALESCE(ms.total_members, 0) AS total_members,
  COALESCE(ms.local_count, 0) AS local_count,
  COALESCE(ms.migrant_worker_count, 0) AS migrant_worker_count,
  COALESCE(ms.transferred_count, 0) AS transferred_count,
  COALESCE(ms.fee_paid_count, 0) AS fee_paid_count,
  COALESCE(acts.branch_activities_count, 0) AS branch_activities_count,
  COALESCE(atts.total_checkins, 0) AS total_checkins
FROM branches b
LEFT JOIN member_stats ms ON ms.branch_id = b.id
LEFT JOIN activity_stats acts ON acts.branch_id = b.id
LEFT JOIN attendance_stats atts ON atts.branch_id = b.id;
