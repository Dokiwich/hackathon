const MEMORY_ACTIVITIES = [
  {
    id: 'ACT-KP5-01',
    scope: 'branch',
    branchId: 'BR-KP5',
    wardId: 'WARD-TAMHIEP',
    tenHoatDong: 'Sinh hoạt Chi đoàn KP5 tháng 11 — Chuyên đề Chuyển đổi số cơ sở',
    activityType: 'regular_meeting',
    ngayToChuc: '2026-11-16',
    khungGio: '19:00 - 20:30',
    diaDiem: 'Nhà văn hóa Khu phố 5, P. Tam Hiệp',
    latitude: 10.957412,
    longitude: 106.842685,
    geofenceRadiusM: 150,
    isClosed: false,
    gioCongTacXaHoi: 10,
    emulationPoints: 10,
    checkedInMemberIds: ['DV-KP5-001', 'DV-KP5-002'],
    checkedInRecords: [
      { memberId: 'DV-KP5-001', checkedInAt: '2026-11-16 19:08', method: 'QR động', distanceM: 15, accuracyM: 10 },
      { memberId: 'DV-KP5-002', checkedInAt: '2026-11-16 19:09', method: 'QR động', distanceM: 21, accuracyM: 12 }
    ],
    qrSession: null
  },
  {
    id: 'ACT-KP5-04',
    scope: 'branch',
    branchId: 'BR-KP5',
    wardId: 'WARD-TAMHIEP',
    tenHoatDong: 'Sinh hoạt bù KP5 dành cho đoàn viên công nhân làm ca tối Thứ 7',
    activityType: 'makeup_meeting',
    ngayToChuc: '2026-11-28',
    khungGio: '19:30 - 20:45',
    diaDiem: 'Điểm sinh hoạt công nhân KCN Amata / KP5',
    latitude: 10.957412,
    longitude: 106.842685,
    geofenceRadiusM: 150,
    isClosed: false,
    gioCongTacXaHoi: 10,
    emulationPoints: 10,
    checkedInMemberIds: [],
    checkedInRecords: [],
    qrSession: null
  },
  {
    id: 'ACT-WARD-01',
    scope: 'ward',
    branchId: null,
    wardId: 'WARD-TAMHIEP',
    tenHoatDong: 'Ngày hội Hiến máu tình nguyện Phường Tam Hiệp đợt IV/2026',
    activityType: 'volunteer',
    ngayToChuc: '2026-12-05',
    khungGio: '06:30 - 11:00',
    diaDiem: 'Hội trường UBND Phường Tam Hiệp, TP. Biên Hòa',
    latitude: 10.957412,
    longitude: 106.842685,
    geofenceRadiusM: 150,
    isClosed: false,
    gioCongTacXaHoi: 25,
    emulationPoints: 25,
    checkedInMemberIds: [],
    checkedInRecords: [],
    qrSession: null
  }
];

function mapActivityRow(row) {
  if (!row) return null;
  const pts = Number(row.emulation_points || 10);
  const dateStr =
    row.activity_date instanceof Date
      ? row.activity_date.toISOString().slice(0, 10)
      : String(row.activity_date || '').slice(0, 10);
  const checkedInRecords = Array.isArray(row.checked_in_records) ? row.checked_in_records : [];
  let qrSession = null;
  if (row.latest_qr_token) {
    const parts = String(row.latest_qr_token).split('.');
    qrSession = {
      activityId: row.id,
      token: row.latest_qr_token,
      code: parts[1] || String(row.latest_qr_token).slice(0, 6).toUpperCase(),
      expiresAt: Number(row.latest_qr_expires_at || 0),
      ttlSeconds: Number(row.latest_qr_ttl_seconds || 900)
    };
  }
  return {
    id: row.id,
    scope: row.scope,
    branchId: row.branch_id || null,
    wardId: row.effective_ward_id || row.ward_id || 'WARD-TAMHIEP',
    tenHoatDong: row.title,
    activityType: row.activity_type,
    ngayToChuc: dateStr,
    khungGio: `${row.start_time || '19:00'} - ${row.end_time || '20:30'}`,
    diaDiem: row.location || '',
    latitude: Number(row.latitude ?? 10.957412),
    longitude: Number(row.longitude ?? 106.842685),
    geofenceRadiusM: Number(row.geofence_radius_m || 150),
    isClosed: Boolean(row.is_closed),
    gioCongTacXaHoi: pts,
    emulationPoints: pts,
    checkedInMemberIds: Array.isArray(row.checked_in_member_ids) ? row.checked_in_member_ids : [],
    checkedInRecords,
    qrSession
  };
}

const ACTIVITY_SELECT_SQL = `
  SELECT
    a.id,
    a.scope,
    a.branch_id,
    COALESCE(a.ward_id, b.ward_id) AS effective_ward_id,
    a.title,
    a.activity_type,
    a.activity_date,
    a.start_time,
    a.end_time,
    a.location,
    a.latitude,
    a.longitude,
    a.geofence_radius_m,
    a.is_closed,
    a.emulation_points,
    COALESCE(ARRAY_AGG(ar.member_id) FILTER (WHERE ar.member_id IS NOT NULL), '{}') AS checked_in_member_ids,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'memberId', ar.member_id,
          'checkedInAt', TO_CHAR(ar.checked_in_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI'),
          'method', CASE WHEN ar.distance_m IS NOT NULL THEN 'QR + GPS' WHEN ar.check_in_method = 'makeup_qr' THEN 'Sinh hoạt bù' ELSE 'QR động' END,
          'distanceM', ar.distance_m,
          'accuracyM', ar.accuracy_m
        )
      ) FILTER (WHERE ar.member_id IS NOT NULL),
      '[]'::json
    ) AS checked_in_records,
    q.token AS latest_qr_token,
    q.expires_at AS latest_qr_expires_at,
    q.ttl_seconds AS latest_qr_ttl_seconds
  FROM activities a
  LEFT JOIN branches b ON b.id = a.branch_id
  LEFT JOIN attendance_records ar ON ar.activity_id = a.id
  LEFT JOIN LATERAL (
    SELECT token, expires_at, ttl_seconds
    FROM qr_sessions
    WHERE activity_id = a.id
    ORDER BY created_at DESC
    LIMIT 1
  ) q ON TRUE
`;

export function createAttendanceRepository({ db } = {}) {
  const isPostgres = db?.mode === 'postgres';
  const activities = MEMORY_ACTIVITIES.map((a) => ({
    ...a,
    checkedInMemberIds: [...a.checkedInMemberIds],
    checkedInRecords: a.checkedInRecords.map((r) => ({ ...r }))
  }));
  const qrSessions = new Map();

  return {
    async listForUser({ role, branchId, wardId }) {
      if (isPostgres) {
        if (role === 'ward_officer') {
          const res = await db.query(
            `${ACTIVITY_SELECT_SQL}
             WHERE COALESCE(a.ward_id, b.ward_id) = $1
             GROUP BY a.id, b.ward_id, q.token, q.expires_at, q.ttl_seconds
             ORDER BY a.activity_date DESC, a.id ASC`,
            [wardId]
          );
          return res.rows.map(mapActivityRow);
        }
        const res = await db.query(
          `${ACTIVITY_SELECT_SQL}
           WHERE a.branch_id = $1 OR (a.scope = 'ward' AND a.ward_id = $2)
           GROUP BY a.id, b.ward_id, q.token, q.expires_at, q.ttl_seconds
           ORDER BY a.activity_date DESC, a.id ASC`,
          [branchId, wardId]
        );
        return res.rows.map(mapActivityRow);
      }

      return activities.filter((a) => {
        if (role === 'ward_officer') return a.wardId === wardId;
        return a.branchId === branchId || (a.scope === 'ward' && a.wardId === wardId);
      });
    },

    async findById(id) {
      if (isPostgres) {
        const res = await db.query(
          `${ACTIVITY_SELECT_SQL}
           WHERE a.id = $1
           GROUP BY a.id, b.ward_id, q.token, q.expires_at, q.ttl_seconds
           LIMIT 1`,
          [id]
        );
        return mapActivityRow(res.rows[0]);
      }
      return activities.find((a) => a.id === id) || null;
    },

    async create(payload) {
      const points = Number(payload.emulationPoints ?? payload.gioCongTacXaHoi ?? 10);
      const timeParts = String(payload.khungGio || '19:00 - 20:30').split('-');
      const startTime = (timeParts[0] || '19:00').trim();
      const endTime = (timeParts[1] || '20:30').trim();
      const latitude = Number(payload.latitude ?? 10.957412);
      const longitude = Number(payload.longitude ?? 106.842685);
      const radius = Number(payload.geofenceRadiusM || 150);

      if (isPostgres) {
        const id = `ACT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
        await db.query(
          `INSERT INTO activities (
             id, scope, branch_id, ward_id, title, activity_type, activity_date, start_time, end_time,
             location, latitude, longitude, geofence_radius_m, is_closed, emulation_points, created_by_user_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10, $11, $12, $13, FALSE, $14, $15)`,
          [
            id,
            payload.scope,
            payload.branchId || null,
            payload.wardId || null,
            payload.tenHoatDong,
            payload.activityType || 'regular_meeting',
            payload.ngayToChuc,
            startTime,
            endTime,
            payload.diaDiem || '',
            latitude,
            longitude,
            radius,
            points,
            payload.createdByUserId || null
          ]
        );
        return this.findById(id);
      }

      const created = {
        id: `ACT-${Date.now().toString().slice(-4)}-${activities.length + 1}`,
        scope: payload.scope,
        branchId: payload.branchId || null,
        wardId: payload.effectiveWardId || payload.wardId || 'WARD-TAMHIEP',
        tenHoatDong: payload.tenHoatDong,
        activityType: payload.activityType || 'regular_meeting',
        ngayToChuc: payload.ngayToChuc,
        khungGio: payload.khungGio || '19:00 - 20:30',
        diaDiem: payload.diaDiem || '',
        latitude,
        longitude,
        geofenceRadiusM: radius,
        isClosed: false,
        gioCongTacXaHoi: points,
        emulationPoints: points,
        checkedInMemberIds: [],
        checkedInRecords: [],
        qrSession: null
      };
      activities.unshift(created);
      return created;
    },

    async closeActivity(id) {
      if (isPostgres) {
        await db.query(`UPDATE activities SET is_closed = TRUE, status = 'completed' WHERE id = $1`, [id]);
        return this.findById(id);
      }
      const act = activities.find((a) => a.id === id);
      if (!act) return null;
      act.isClosed = true;
      return act;
    },

    async removeActivity(id) {
      if (isPostgres) {
        const res = await db.query(`DELETE FROM activities WHERE id = $1`, [id]);
        return res.rowCount > 0;
      }
      const idx = activities.findIndex((a) => a.id === id);
      if (idx === -1) return false;
      activities.splice(idx, 1);
      return true;
    },

    async saveQrSession(session) {
      if (isPostgres) {
        await db.query(
          `INSERT INTO qr_sessions (token, activity_id, created_by_user_id, expires_at, ttl_seconds)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (token) DO NOTHING`,
          [
            session.token,
            session.activityId,
            session.createdByUserId || null,
            session.expiresAt,
            session.ttlSeconds
          ]
        );
        return session;
      }
      qrSessions.set(session.token, session);
      const act = activities.find((a) => a.id === session.activityId);
      if (act) act.qrSession = session;
      return session;
    },

    async findQrSession(token) {
      if (isPostgres) {
        const res = await db.query(
          `SELECT token, activity_id, expires_at, ttl_seconds
           FROM qr_sessions WHERE token = $1 LIMIT 1`,
          [token]
        );
        const row = res.rows[0];
        if (!row) return null;
        return {
          token: row.token,
          activityId: row.activity_id,
          expiresAt: Number(row.expires_at),
          ttlSeconds: Number(row.ttl_seconds)
        };
      }
      return qrSessions.get(token) || null;
    },

    async markCheckedIn(activityId, memberId, verifiedByUserId = null, gpsMeta = {}) {
      const distanceM = gpsMeta.distanceM ?? null;
      const accuracyM = gpsMeta.accuracyM ?? null;
      if (isPostgres) {
        await db.query(
          `INSERT INTO attendance_records (activity_id, member_id, check_in_method, distance_m, accuracy_m, verified_by_user_id)
           VALUES ($1, $2, 'qr_dynamic', $3, $4, $5)
           ON CONFLICT (activity_id, member_id) DO NOTHING`,
          [activityId, memberId, distanceM, accuracyM, verifiedByUserId]
        );
        return this.findById(activityId);
      }

      const act = activities.find((a) => a.id === activityId);
      if (!act) return null;
      if (!act.checkedInMemberIds.includes(memberId)) {
        act.checkedInMemberIds.push(memberId);
        act.checkedInRecords.push({
          memberId,
          checkedInAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          method: distanceM !== null ? 'QR + GPS' : 'QR động',
          distanceM,
          accuracyM
        });
      }
      return act;
    }
  };
}
