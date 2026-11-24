const MEMORY_REMINDERS = [
  {
    id: 'RM-KP5-01',
    scope: 'branch',
    branchId: 'BR-KP5',
    wardId: 'WARD-TAMHIEP',
    tieuDe: 'Nhắc đoàn viên làm ca đăng ký & dự Sinh hoạt bù tối Thứ 7',
    hanChot: '2026-11-28 19:30',
    chuKy: 'Hàng tháng',
    kenhNhac: 'Zalo Nhóm + Web Push',
    batNhacTuDong: true,
    daHoanThanh: false
  }
];

const RECURRENCE_TO_DB = {
  'Hàng tuần': 'weekly',
  'Hàng tháng': 'monthly',
  'Một lần': 'once',
  weekly: 'weekly',
  monthly: 'monthly',
  once: 'once'
};

const DB_TO_RECURRENCE = {
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
  once: 'Một lần'
};

const CHANNEL_TO_LABEL = {
  zalo_oa: 'Zalo OA',
  zalo_group: 'Zalo Nhóm',
  web_push: 'Web Push',
  sms: 'SMS'
};

function mapReminderRow(row) {
  if (!row) return null;
  const channels = Array.isArray(row.channels) ? row.channels : [];
  const kenhNhac =
    channels.length > 0
      ? channels.map((c) => CHANNEL_TO_LABEL[c] || c).join(' + ')
      : 'Zalo OA + Web Push';
  const dueStr =
    row.due_at instanceof Date
      ? row.due_at.toISOString().slice(0, 16).replace('T', ' ')
      : String(row.due_at || '').slice(0, 16).replace('T', ' ');

  return {
    id: row.id,
    scope: row.scope,
    branchId: row.branch_id || null,
    wardId: row.effective_ward_id || row.ward_id || 'WARD-TAMHIEP',
    tieuDe: row.title,
    hanChot: dueStr,
    chuKy: DB_TO_RECURRENCE[row.recurrence] || 'Hàng tháng',
    kenhNhac,
    batNhacTuDong: Boolean(row.auto_enabled),
    daHoanThanh: Boolean(row.is_completed)
  };
}

const REMINDER_SELECT_SQL = `
  SELECT
    r.id,
    r.scope,
    r.branch_id,
    COALESCE(r.ward_id, b.ward_id) AS effective_ward_id,
    r.title,
    r.due_at,
    r.recurrence,
    r.auto_enabled,
    r.is_completed,
    COALESCE(ARRAY_AGG(rc.channel_code) FILTER (WHERE rc.channel_code IS NOT NULL), '{}') AS channels
  FROM reminders r
  LEFT JOIN branches b ON b.id = r.branch_id
  LEFT JOIN reminder_channels rc ON rc.reminder_id = r.id
`;

export function createRemindersRepository({ db } = {}) {
  const isPostgres = db?.mode === 'postgres';
  const rows = MEMORY_REMINDERS.map((r) => ({ ...r }));

  return {
    async listForUser({ role, branchId, wardId }) {
      if (isPostgres) {
        if (role === 'ward_officer') {
          const res = await db.query(
            `${REMINDER_SELECT_SQL}
             WHERE COALESCE(r.ward_id, b.ward_id) = $1
             GROUP BY r.id, b.ward_id
             ORDER BY r.created_at DESC, r.id ASC`,
            [wardId]
          );
          return res.rows.map(mapReminderRow);
        }
        const res = await db.query(
          `${REMINDER_SELECT_SQL}
           WHERE r.branch_id = $1 OR (r.scope = 'ward' AND r.ward_id = $2)
           GROUP BY r.id, b.ward_id
           ORDER BY r.created_at DESC, r.id ASC`,
          [branchId, wardId]
        );
        return res.rows.map(mapReminderRow);
      }

      return rows.filter((r) => {
        if (role === 'ward_officer') return r.wardId === wardId;
        return r.branchId === branchId || (r.scope === 'ward' && r.wardId === wardId);
      });
    },

    async findById(id) {
      if (isPostgres) {
        const res = await db.query(
          `${REMINDER_SELECT_SQL}
           WHERE r.id = $1
           GROUP BY r.id, b.ward_id
           LIMIT 1`,
          [id]
        );
        return mapReminderRow(res.rows[0]);
      }
      return rows.find((r) => r.id === id) || null;
    },

    async create(payload) {
      if (isPostgres) {
        const id = `RM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
        const dueIso = payload.hanChot.includes('T')
          ? payload.hanChot
          : `${payload.hanChot}:00+07`;
        await db.query(
          `INSERT INTO reminders (id, scope, branch_id, ward_id, title, due_at, recurrence, auto_enabled, is_completed)
           VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, TRUE, FALSE)`,
          [
            id,
            payload.scope,
            payload.branchId || null,
            payload.wardId || null,
            payload.tieuDe,
            dueIso,
            RECURRENCE_TO_DB[payload.chuKy] || 'monthly'
          ]
        );
        await db.query(
          `INSERT INTO reminder_channels (reminder_id, channel_code)
           VALUES ($1, 'zalo_oa'), ($1, 'web_push')
           ON CONFLICT (reminder_id, channel_code) DO NOTHING`,
          [id]
        );
        return this.findById(id);
      }

      const created = {
        id: `RM-${Date.now().toString().slice(-4)}-${rows.length + 1}`,
        scope: payload.scope,
        branchId: payload.branchId || null,
        wardId: payload.effectiveWardId || payload.wardId || 'WARD-TAMHIEP',
        tieuDe: payload.tieuDe,
        hanChot: payload.hanChot,
        chuKy: payload.chuKy || 'Hàng tháng',
        kenhNhac: payload.kenhNhac || 'Zalo OA + Web Push',
        batNhacTuDong: true,
        daHoanThanh: false
      };
      rows.unshift(created);
      return created;
    },

    async update(id, updates) {
      if (isPostgres) {
        const setClauses = [];
        const params = [id];
        if (updates.batNhacTuDong !== undefined) {
          params.push(Boolean(updates.batNhacTuDong));
          setClauses.push(`auto_enabled = $${params.length}`);
        }
        if (updates.daHoanThanh !== undefined) {
          params.push(Boolean(updates.daHoanThanh));
          setClauses.push(`is_completed = $${params.length}`);
        }
        if (setClauses.length > 0) {
          await db.query(`UPDATE reminders SET ${setClauses.join(', ')} WHERE id = $1`, params);
        }
        return this.findById(id);
      }

      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...updates };
      return rows[idx];
    }
  };
}
