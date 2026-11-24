const SEED_MEMORY_NEWS = [
  {
    id: 'NEWS-01',
    wardId: 'WARD-TAMHIEP',
    category: 'Phong trào',
    source: 'Tỉnh đoàn Đồng Nai',
    location: 'Quảng trường Tỉnh Đồng Nai',
    publishedAt: '24/11/2026',
    image: 'news/ra-quan.jpg',
    title: 'Ra quân Tháng Thanh niên & Chuyển đổi số đồng loạt tại 95 xã, phường',
    summary:
      'Hàng trăm cán bộ Đoàn và đoàn viên phất cờ xuất quân triển khai Sổ tay Đoàn viên số, mã QR động chấm công và lịch sinh hoạt bù cho công nhân KCN.',
    content:
      'Ban Thường vụ Tỉnh đoàn Đồng Nai phát động đợt cao điểm chuyển đổi số tại 95 xã, phường trên toàn địa bàn.',
    featured: true,
    authorUserId: 'USR-CB-TH'
  },
  {
    id: 'NEWS-02',
    wardId: 'WARD-TAMHIEP',
    category: 'Phong trào',
    source: 'Đoàn Phường Tam Hiệp',
    location: 'Hội trường UBND Phường Tam Hiệp',
    publishedAt: '22/11/2026',
    image: 'news/hien-mau.jpg',
    title: 'Ngày hội Hiến máu tình nguyện "Mỗi giọt máu cho đi — Một cuộc đời ở lại"',
    summary:
      'Đội hình tình nguyện viên Phường Tam Hiệp túc trực hỗ trợ tiếp đón, hướng dẫn quét mã QR đăng ký nhanh và ghi nhận +25 điểm thi đua.',
    content:
      'Chương trình hiến máu tình nguyện đợt IV/2026 quy tụ đông đảo đoàn viên thanh niên từ Chi đoàn Khu phố 2, Khu phố 3 và Khu phố 5.',
    featured: false,
    authorUserId: 'USR-CB-TH'
  }
];

function mapNewsRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    wardId: row.ward_id,
    category: row.category,
    source: row.source_name,
    location: row.location,
    publishedAt: row.published_at_label,
    image: row.image_path,
    title: row.title,
    summary: row.summary,
    content: row.content,
    featured: Boolean(row.is_featured),
    authorUserId: row.author_user_id || null
  };
}

export function createNewsRepository({ db } = {}) {
  const isPostgres = db?.mode === 'postgres';
  const rows = SEED_MEMORY_NEWS.map((item) => ({ ...item }));

  return {
    async list({ wardId, category = 'all' }) {
      if (isPostgres) {
        const params = [wardId];
        let sql = `
          SELECT id, ward_id, category, source_name, location, published_at_label,
                 image_path, title, summary, content, is_featured, author_user_id
          FROM news
          WHERE ward_id = $1
        `;
        if (category && category !== 'all') {
          params.push(category);
          sql += ` AND category = $2`;
        }
        sql += ` ORDER BY is_featured DESC, created_at DESC, id ASC`;
        const res = await db.query(sql, params);
        return res.rows.map(mapNewsRow);
      }

      return rows
        .filter((item) => item.wardId === wardId && (category === 'all' || item.category === category))
        .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    },

    async findById(id) {
      if (isPostgres) {
        const res = await db.query(
          `SELECT id, ward_id, category, source_name, location, published_at_label,
                  image_path, title, summary, content, is_featured, author_user_id
           FROM news WHERE id = $1 LIMIT 1`,
          [id]
        );
        return mapNewsRow(res.rows[0]);
      }
      return rows.find((item) => item.id === id) || null;
    },

    async create(payload) {
      const publishedAt = payload.publishedAt || new Date().toLocaleDateString('vi-VN');
      const content = payload.content || payload.summary;

      if (isPostgres) {
        const id = `NEWS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
        if (payload.featured) {
          await db.query(`UPDATE news SET is_featured = FALSE WHERE ward_id = $1`, [payload.wardId]);
        }
        await db.query(
          `INSERT INTO news (
             id, ward_id, category, source_name, location, published_at_label,
             image_path, title, summary, content, is_featured, author_user_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            id,
            payload.wardId,
            payload.category,
            payload.source,
            payload.location,
            publishedAt,
            payload.image,
            payload.title,
            payload.summary,
            content,
            Boolean(payload.featured),
            payload.authorUserId || null
          ]
        );
        return this.findById(id);
      }

      if (payload.featured) {
        for (const item of rows) {
          if (item.wardId === payload.wardId) item.featured = false;
        }
      }
      const created = {
        id: `NEWS-${Date.now().toString().slice(-4)}-${rows.length + 1}`,
        wardId: payload.wardId,
        category: payload.category,
        source: payload.source,
        location: payload.location,
        publishedAt,
        image: payload.image,
        title: payload.title,
        summary: payload.summary,
        content,
        featured: Boolean(payload.featured),
        authorUserId: payload.authorUserId || null
      };
      rows.unshift(created);
      return created;
    },

    async update(id, wardId, updates) {
      if (isPostgres) {
        if (updates.featured) {
          await db.query(`UPDATE news SET is_featured = FALSE WHERE ward_id = $1 AND id <> $2`, [wardId, id]);
        }
        const fieldMap = {
          title: 'title',
          category: 'category',
          source: 'source_name',
          location: 'location',
          publishedAt: 'published_at_label',
          image: 'image_path',
          summary: 'summary',
          content: 'content',
          featured: 'is_featured'
        };
        const setClauses = ['updated_at = NOW()'];
        const params = [id];
        for (const [key, col] of Object.entries(fieldMap)) {
          if (updates[key] !== undefined) {
            params.push(key === 'featured' ? Boolean(updates[key]) : updates[key]);
            setClauses.push(`${col} = $${params.length}`);
          }
        }
        await db.query(`UPDATE news SET ${setClauses.join(', ')} WHERE id = $1`, params);
        return this.findById(id);
      }

      const idx = rows.findIndex((item) => item.id === id);
      if (idx === -1) return null;
      if (updates.featured) {
        for (const item of rows) {
          if (item.wardId === wardId && item.id !== id) item.featured = false;
        }
      }
      rows[idx] = { ...rows[idx], ...updates };
      return rows[idx];
    },

    async remove(id) {
      if (isPostgres) {
        const res = await db.query(`DELETE FROM news WHERE id = $1 RETURNING id`, [id]);
        return res.rowCount > 0;
      }
      const idx = rows.findIndex((item) => item.id === id);
      if (idx === -1) return false;
      rows.splice(idx, 1);
      return true;
    }
  };
}
