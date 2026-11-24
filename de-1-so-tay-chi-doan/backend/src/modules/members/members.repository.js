const STATUS_LABEL = {
  local: 'Đang ở địa phương',
  migrant_worker: 'Đi làm xa',
  transferred: 'Chuyển sinh hoạt'
};

export function normalizeResidenceStatus(input) {
  const val = String(input || '').trim();
  if (val === 'local' || val === 'migrant_worker' || val === 'transferred') return val;
  if (val === 'Đi làm xa' || val === 'Tạm vắng') return 'migrant_worker';
  if (val === 'Chuyển sinh hoạt') return 'transferred';
  return 'local';
}

const MEMORY_SEED = [
  {
    id: 'DV-KP5-001',
    branchId: 'BR-KP5',
    wardId: 'WARD-TAMHIEP',
    chiDoan: 'Chi đoàn Khu phố 5',
    maDoanVien: 'DN-KP5-001',
    hoTen: 'Trần Minh Khôi',
    sdt: '0912 345 001',
    chucVu: 'Bí thư Chi đoàn',
    residenceStatus: 'local',
    trangThai: 'Đang ở địa phương',
    workShift: 'day',
    gioCtxh: 20,
    daDongDoanPhi: true
  },
  {
    id: 'DV-KP5-002',
    branchId: 'BR-KP5',
    wardId: 'WARD-TAMHIEP',
    chiDoan: 'Chi đoàn Khu phố 5',
    maDoanVien: 'DN-KP5-002',
    hoTen: 'Nguyễn Hoàng Anh',
    sdt: '0912 345 002',
    chucVu: 'Đoàn viên',
    residenceStatus: 'local',
    trangThai: 'Đang ở địa phương',
    workShift: 'rotating_shift',
    gioCtxh: 10,
    daDongDoanPhi: true
  },
  {
    id: 'DV-KP5-032',
    branchId: 'BR-KP5',
    wardId: 'WARD-TAMHIEP',
    chiDoan: 'Chi đoàn Khu phố 5',
    maDoanVien: 'DN-KP5-032',
    hoTen: 'Nguyễn Văn Tùng',
    sdt: '0912 345 032',
    chucVu: 'Đoàn viên',
    residenceStatus: 'migrant_worker',
    trangThai: 'Đi làm xa',
    workShift: 'rotating_shift',
    gioCtxh: 10,
    daDongDoanPhi: true
  },
  {
    id: 'DV-KP2-001',
    branchId: 'BR-KP2',
    wardId: 'WARD-TAMHIEP',
    chiDoan: 'Chi đoàn Khu phố 2',
    maDoanVien: 'DN-KP2-001',
    hoTen: 'Lê Hoàng Nam',
    sdt: '0912 346 001',
    chucVu: 'Bí thư Chi đoàn',
    residenceStatus: 'local',
    trangThai: 'Đang ở địa phương',
    workShift: 'day',
    gioCtxh: 15,
    daDongDoanPhi: true
  }
];

function mapMemberRow(row) {
  if (!row) return null;
  const resStatus = row.residence_status || 'local';
  return {
    id: row.id,
    branchId: row.branch_id,
    wardId: row.ward_id,
    chiDoan: row.branch_name || 'Chi đoàn Khu phố 5',
    maDoanVien: row.member_code,
    hoTen: row.full_name,
    sdt: row.phone || '',
    chucVu: row.position_title || 'Đoàn viên',
    residenceStatus: resStatus,
    trangThai: STATUS_LABEL[resStatus] || 'Đang ở địa phương',
    workShift: row.work_shift || 'day',
    gioCtxh: Number(row.total_points || 0),
    daDongDoanPhi: Boolean(row.fee_paid)
  };
}

const MEMBER_SELECT_SQL = `
  SELECT
    m.id,
    m.branch_id,
    b.ward_id,
    b.name AS branch_name,
    m.member_code,
    m.full_name,
    m.phone,
    m.position_title,
    m.residence_status,
    m.work_shift,
    m.fee_paid,
    COALESCE(v.total_points, 0) AS total_points
  FROM members m
  JOIN branches b ON b.id = m.branch_id
  LEFT JOIN v_member_emulation_totals v ON v.member_id = m.id
`;

export function createMembersRepository({ db } = {}) {
  const isPostgres = db?.mode === 'postgres';
  const rows = MEMORY_SEED.map((item) => ({ ...item }));

  return {
    async list({ branchId, wardId, q, status }) {
      const search = String(q || '').trim().toLowerCase();
      const normalizedStatus =
        status && status !== 'all' ? normalizeResidenceStatus(status) : 'all';

      if (isPostgres) {
        const params = [];
        const where = [];
        if (branchId) {
          params.push(branchId);
          where.push(`m.branch_id = $${params.length}`);
        } else if (wardId) {
          params.push(wardId);
          where.push(`b.ward_id = $${params.length}`);
        }
        if (normalizedStatus !== 'all') {
          params.push(normalizedStatus);
          where.push(`m.residence_status = $${params.length}`);
        }
        if (search) {
          params.push(`%${search}%`);
          where.push(
            `(LOWER(m.full_name) LIKE $${params.length} OR LOWER(m.member_code) LIKE $${params.length} OR LOWER(m.phone) LIKE $${params.length})`
          );
        }
        const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
        const res = await db.query(
          `${MEMBER_SELECT_SQL} ${whereSql} ORDER BY m.created_at DESC, m.id ASC`,
          params
        );
        return res.rows.map(mapMemberRow);
      }

      return rows.filter((m) => {
        if (branchId && m.branchId !== branchId) return false;
        if (!branchId && wardId && m.wardId !== wardId) return false;
        if (normalizedStatus !== 'all' && m.residenceStatus !== normalizedStatus) return false;
        if (!search) return true;
        return (
          m.hoTen.toLowerCase().includes(search) ||
          m.maDoanVien.toLowerCase().includes(search) ||
          m.sdt.toLowerCase().includes(search)
        );
      });
    },

    async findById(id) {
      if (isPostgres) {
        const res = await db.query(`${MEMBER_SELECT_SQL} WHERE m.id = $1 LIMIT 1`, [id]);
        return mapMemberRow(res.rows[0]);
      }
      return rows.find((m) => m.id === id) || null;
    },

    async findByCode(maDoanVien) {
      if (isPostgres) {
        const res = await db.query(`${MEMBER_SELECT_SQL} WHERE m.member_code = $1 LIMIT 1`, [
          maDoanVien
        ]);
        return mapMemberRow(res.rows[0]);
      }
      return rows.find((m) => m.maDoanVien === maDoanVien) || null;
    },

    async create(payload) {
      const residenceStatus = normalizeResidenceStatus(payload.residenceStatus || payload.trangThai);
      if (isPostgres) {
        const id = `DV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
        await db.query(
          `INSERT INTO members (id, branch_id, member_code, full_name, phone, position_title, residence_status, work_shift, fee_paid)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id,
            payload.branchId,
            payload.maDoanVien,
            payload.hoTen,
            payload.sdt || '',
            payload.chucVu || 'Đoàn viên',
            residenceStatus,
            payload.workShift || 'day',
            Boolean(payload.daDongDoanPhi ?? true)
          ]
        );
        if (Number(payload.gioCtxh || 0) > 0) {
          await db.query(
            `INSERT INTO emulation_point_ledger (member_id, points, reason, awarded_by_user_id)
             VALUES ($1, $2, $3, $4)`,
            [id, Number(payload.gioCtxh), 'Điểm thi đua khởi tạo', payload.awardedByUserId || null]
          );
        }
        return this.findById(id);
      }

      const created = {
        id: `DV-${Date.now().toString().slice(-4)}-${rows.length + 1}`,
        branchId: payload.branchId,
        wardId: payload.wardId || 'WARD-TAMHIEP',
        chiDoan: payload.chiDoan || 'Chi đoàn Khu phố 5',
        maDoanVien: payload.maDoanVien,
        hoTen: payload.hoTen,
        sdt: payload.sdt || '',
        chucVu: payload.chucVu || 'Đoàn viên',
        residenceStatus,
        trangThai: STATUS_LABEL[residenceStatus],
        workShift: payload.workShift || 'day',
        gioCtxh: Number(payload.gioCtxh || 0),
        daDongDoanPhi: Boolean(payload.daDongDoanPhi ?? true)
      };
      rows.unshift(created);
      return created;
    },

    async update(id, updates) {
      if (isPostgres) {
        const setClauses = [];
        const params = [id];
        if (updates.maDoanVien !== undefined) {
          params.push(updates.maDoanVien);
          setClauses.push(`member_code = $${params.length}`);
        }
        if (updates.hoTen !== undefined) {
          params.push(updates.hoTen);
          setClauses.push(`full_name = $${params.length}`);
        }
        if (updates.sdt !== undefined) {
          params.push(updates.sdt);
          setClauses.push(`phone = $${params.length}`);
        }
        if (updates.chucVu !== undefined) {
          params.push(updates.chucVu);
          setClauses.push(`position_title = $${params.length}`);
        }
        if (updates.residenceStatus !== undefined || updates.trangThai !== undefined) {
          const rs = normalizeResidenceStatus(updates.residenceStatus || updates.trangThai);
          params.push(rs);
          setClauses.push(`residence_status = $${params.length}`);
        }
        if (updates.workShift !== undefined) {
          params.push(updates.workShift);
          setClauses.push(`work_shift = $${params.length}`);
        }
        if (updates.daDongDoanPhi !== undefined) {
          params.push(Boolean(updates.daDongDoanPhi));
          setClauses.push(`fee_paid = $${params.length}`);
        }
        if (setClauses.length > 0) {
          setClauses.push('updated_at = NOW()');
          await db.query(`UPDATE members SET ${setClauses.join(', ')} WHERE id = $1`, params);
        }
        return this.findById(id);
      }

      const idx = rows.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      const next = { ...rows[idx], ...updates };
      if (updates.residenceStatus !== undefined || updates.trangThai !== undefined) {
        next.residenceStatus = normalizeResidenceStatus(
          updates.residenceStatus || updates.trangThai
        );
        next.trangThai = STATUS_LABEL[next.residenceStatus];
      }
      rows[idx] = next;
      return rows[idx];
    },

    async listLedger({ role, memberId, branchId, wardId }) {
      if (isPostgres) {
        let whereSql = 'WHERE e.member_id = $1';
        let params = [memberId || '__none__'];
        if (role === 'ward_officer') {
          whereSql = 'WHERE b.ward_id = $1';
          params = [wardId || 'WARD-TAMHIEP'];
        } else if (role === 'branch_secretary') {
          whereSql = 'WHERE m.branch_id = $1';
          params = [branchId || 'BR-KP5'];
        }
        const res = await db.query(
          `SELECT
             e.id,
             e.member_id,
             e.activity_id,
             COALESCE(a.title, e.reason) AS activity_title,
             e.points,
             e.awarded_at,
             COALESCE(u.full_name, 'Hệ thống') AS approved_by,
             ar.check_in_method,
             ar.distance_m
           FROM emulation_point_ledger e
           JOIN members m ON m.id = e.member_id
           JOIN branches b ON b.id = m.branch_id
           LEFT JOIN activities a ON a.id = e.activity_id
           LEFT JOIN users u ON u.id = e.awarded_by_user_id
           LEFT JOIN attendance_records ar ON ar.activity_id = e.activity_id AND ar.member_id = e.member_id
           ${whereSql}
           ORDER BY e.awarded_at DESC, e.id DESC`,
          params
        );
        return res.rows.map((r) => ({
          id: `LG-${r.id}`,
          memberId: r.member_id,
          activityId: r.activity_id || null,
          activityTitle: r.activity_title,
          hours: Number(r.points || 0),
          method:
            r.distance_m !== null && r.distance_m !== undefined
              ? `QR + GPS (${r.distance_m}m)`
              : r.check_in_method === 'makeup_qr'
                ? 'Sinh hoạt bù'
                : 'QR động',
          recordedAt:
            r.awarded_at instanceof Date
              ? r.awarded_at.toISOString().slice(0, 16).replace('T', ' ')
              : String(r.awarded_at || '').slice(0, 16).replace('T', ' '),
          approvedBy: r.approved_by
        }));
      }

      if (role === 'ward_officer') return [];
      if (role === 'branch_secretary') return [];
      return [];
    },

    async addEmulationPoints({ memberId, activityId = null, points, reason, awardedByUserId = null }) {
      const delta = Number(points || 0);
      if (isPostgres) {
        await db.query(
          `INSERT INTO emulation_point_ledger (member_id, activity_id, points, reason, awarded_by_user_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [memberId, activityId, delta, reason || 'Tham gia hoạt động Đoàn', awardedByUserId]
        );
        return this.findById(memberId);
      }

      const idx = rows.findIndex((m) => m.id === memberId);
      if (idx === -1) return null;
      rows[idx] = {
        ...rows[idx],
        gioCtxh: Math.max(0, Number(rows[idx].gioCtxh || 0) + delta)
      };
      return rows[idx];
    },

    async remove(id) {
      if (isPostgres) {
        const res = await db.query('DELETE FROM members WHERE id = $1', [id]);
        return res.rowCount > 0;
      }

      const idx = rows.findIndex((m) => m.id === id);
      if (idx === -1) return false;
      rows.splice(idx, 1);
      return true;
    }
  };
}
