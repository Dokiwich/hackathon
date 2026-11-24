import { sanitizePlainText } from './security';
import { formatDateVN } from '../shared/utils/format';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeCsvCell(value) {
  const str = String(value ?? '').replace(/\r?\n/g, ' ');
  // Guard against Excel/Sheets CSV formula injection
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function computeReportStats(members, activities, ledger = []) {
  const totalMembers = members.length;
  const localCount = members.filter((m) => m.trangThai === 'Đang ở địa phương').length;
  const farCount = members.filter((m) => m.trangThai === 'Đi làm xa').length;
  const transferCount = members.filter((m) => m.trangThai === 'Chuyển sinh hoạt').length;
  const activeMembers = members.filter(
    (m) => m.trangThai !== 'Tạm vắng' && m.trangThai !== 'Chuyển sinh hoạt'
  ).length;
  const feePaidCount = members.filter((m) => Boolean(m.daDongDoanPhi)).length;
  const totalSocialHours = members.reduce((sum, m) => sum + Number(m.gioCtxh || 0), 0);
  const regularMeetings = activities.filter((a) => a.activityType === 'regular_meeting');
  const closedWithAttendance = activities.filter(
    (a) => a.isClosed && (a.checkedInRecords ? a.checkedInRecords.length : 0) > 0
  );
  const targetActs =
    regularMeetings.length > 0
      ? regularMeetings
      : closedWithAttendance.length > 0
        ? closedWithAttendance
        : activities;
  const totalCheckins = activities.reduce(
    (sum, a) => sum + (a.checkedInRecords ? a.checkedInRecords.length : 0),
    0
  );
  const targetCheckins = targetActs.reduce(
    (sum, a) => sum + (a.checkedInRecords ? a.checkedInRecords.length : 0),
    0
  );
  const expectedTotal = targetActs.reduce((sum, a) => {
    if (a.scope === 'branch' && a.branchId) {
      const bLen = members.filter((m) => (m.branchId || 'BR-KP5') === a.branchId).length;
      return sum + (bLen || totalMembers);
    }
    return sum + totalMembers;
  }, 0);
  const avgAttendancePct =
    expectedTotal > 0 ? Math.min(100, Math.round((targetCheckins / expectedTotal) * 100)) : 0;
  const feePaidPct = totalMembers ? Math.round((feePaidCount / totalMembers) * 100) : 0;

  return {
    totalMembers,
    localCount,
    farCount,
    transferCount,
    activeMembers,
    feePaidCount,
    feePaidPct,
    totalSocialHours,
    totalCheckins,
    avgAttendancePct,
    ledgerEntries: ledger.length
  };
}

export function buildCsvContent(members) {
  const headers = [
    'STT',
    'Ma Doan Vien',
    'Ho va Ten',
    'Chi Doan',
    'Chuc Vu',
    'So Dien Thoai',
    'Ngay Vao Doan',
    'Xep Loai',
    'Trang Thai',
    'Doan Phi',
    'Tong Gio CTXH'
  ];

  const rows = members.map((m, idx) => [
    idx + 1,
    m.maDoanVien,
    m.hoTen,
    m.chiDoan,
    m.chucVu,
    m.sdt,
    m.ngayVaoDoan,
    m.xepLoai || 'Khá',
    m.trangThai,
    m.daDongDoanPhi ? 'Đã đóng' : 'Chưa đóng',
    m.gioCtxh
  ]);

  return [
    headers.map(sanitizeCsvCell).join(','),
    ...rows.map((r) => r.map(sanitizeCsvCell).join(','))
  ].join('\r\n');
}

export function exportCsvReport(members, periodLabel = 'thang-11-2026') {
  const csvBody = buildCsvContent(members);
  const blob = new Blob(['\uFEFF' + csvBody], {
    type: 'text/csv;charset=utf-8;'
  });
  triggerBlobDownload(blob, `bao-cao-doan-vien-${periodLabel}.csv`);
}

export function exportSocialLedgerCsv(ledger, members) {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const headers = ['Ma Ghi Nhan', 'Ma Doan Vien', 'Ho va Ten', 'Hoat Dong', 'So Gio', 'Hinh Thuc', 'Thoi Gian', 'Nguoi Duyet'];
  const rows = ledger.map((entry) => {
    const member = memberById.get(entry.memberId);
    return [
      entry.id,
      member?.maDoanVien || entry.memberId,
      member?.hoTen || 'Đoàn viên',
      entry.activityTitle,
      entry.hours,
      entry.method,
      entry.recordedAt,
      entry.approvedBy
    ];
  });

  const csvBody = [
    headers.map(sanitizeCsvCell).join(','),
    ...rows.map((r) => r.map(sanitizeCsvCell).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvBody], {
    type: 'text/csv;charset=utf-8;'
  });
  triggerBlobDownload(blob, 'so-cai-gio-cong-tac-xa-hoi.csv');
}

export function parseMembersCsv(csvText, defaultChiDoan = 'Chi đoàn Khu phố 2') {
  const cleaned = String(csvText || '').replace(/^\uFEFF/, '');
  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const splitLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const firstCells = splitLine(lines[0]).map((c) => c.toLowerCase());
  const startIdx = firstCells.some((c) => c.includes('ten') || c.includes('tên') || c.includes('ma')) ? 1 : 0;

  const parsed = [];
  const limit = Math.min(lines.length, startIdx + 200);
  for (let i = startIdx; i < limit; i++) {
    const cells = splitLine(lines[i]);
    const hasStt = /^\d+$/.test(cells[0] || '');
    const offset = hasStt ? 1 : 0;
    const code = sanitizePlainText((cells[offset] || '').replace(/^[='+\-@]+/, ''), 32);
    const name = sanitizePlainText((cells[offset + 1] || '').replace(/^[='+\-@]+/, ''), 80);
    if (!name || name.length < 2) continue;
    const chucVu = sanitizePlainText(cells[offset + 3] || 'Đoàn viên', 50) || 'Đoàn viên';
    const sdt = sanitizePlainText(cells[offset + 4] || '', 20);
    const hours = Number(cells[cells.length - 1]);

    parsed.push({
      id: `DV-IMP-${Date.now().toString().slice(-4)}-${i}`,
      maDoanVien: code || `DN-2026-IMP${i}`,
      hoTen: name,
      ngaySinh: '01/01/2004',
      chiDoan: sanitizePlainText(cells[offset + 2] || defaultChiDoan, 60) || defaultChiDoan,
      sdt,
      ngayVaoDoan: '26/03/2025',
      chucVu,
      xepLoai: 'Khá',
      trangThai: 'Đang ở địa phương',
      gioCtxh: Number.isFinite(hours) && hours >= 0 ? Math.min(300, hours) : 0,
      daDongDoanPhi: true
    });
  }
  return parsed;
}

export function buildWordReportHtml({
  info,
  periodType,
  periodText,
  docNumber = '18/BC-ĐTN',
  recommendation = 'Đề nghị Thành đoàn hỗ trợ thêm tài khoản Zalo ZNS chính thức để tự động hóa thông báo đến toàn bộ đoàn viên.',
  members,
  activities,
  signerName = '',
  signerRoleTitle = ''
}) {
  const stats = computeReportStats(members, activities);

  const activityRows = activities
    .map((a, idx) => {
      const count = a.checkedInRecords ? a.checkedInRecords.length : 0;
      return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${escapeHtml(a.tenHoatDong)}</td>
        <td style="text-align:center; white-space:nowrap;">${escapeHtml(formatDateVN(a.ngayToChuc))}</td>
        <td>${escapeHtml(a.diaDiem)}</td>
        <td style="text-align:center; white-space:nowrap;">${count}/${members.length}</td>
        <td style="text-align:center; white-space:nowrap;">${escapeHtml(a.gioCongTacXaHoi)} giờ</td>
      </tr>`;
    })
    .join('');

  const memberRows = members
    .map(
      (m, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="white-space:nowrap;">${escapeHtml(m.maDoanVien)}</td>
        <td>${escapeHtml(m.hoTen)}</td>
        <td>${escapeHtml(m.chucVu)}</td>
        <td style="text-align:center; white-space:nowrap;">${escapeHtml(m.trangThai)}</td>
        <td style="text-align:center; white-space:nowrap;">${m.daDongDoanPhi ? 'Đã đóng' : 'Chưa đóng'}</td>
        <td style="text-align:center;">${escapeHtml(m.gioCtxh)}</td>
      </tr>`
    )
    .join('');

  const effectiveSignerName = signerName || info.biThu;
  const effectiveSignerTitle = signerRoleTitle || 'BÍ THƯ';

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>Báo Cáo Công Tác Đoàn</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    body { font-family: "Times New Roman", serif; font-size: 13pt; line-height: 1.45; color: #0f172a; }
    table { border-collapse: collapse; width: 100%; margin-top: 8px; margin-bottom: 14px; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th, td { border: 1px solid #334155; padding: 6px 8px; font-size: 11pt; }
    th { background: #e2e8f0; font-weight: bold; }
    .header-table td { border: none; vertical-align: top; text-align: center; }
    h1 { text-align: center; font-size: 15pt; margin: 12px 0 4px; text-transform: uppercase; }
    h2 { font-size: 13pt; margin: 14px 0 6px; page-break-after: avoid; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width:48%; white-space:nowrap;">
        <strong>${escapeHtml(info.donViCapTren).toUpperCase()}</strong><br/>
        <strong><u>${escapeHtml(info.tenDoanCoSo).toUpperCase()}</u></strong><br/>
        Số: ${escapeHtml(docNumber)}
      </td>
      <td style="width:52%;">
        <strong>ĐOÀN TNCS HỒ CHÍ MINH</strong><br/>
        <em>Đồng Nai, ngày ${new Date().toLocaleDateString('vi-VN')}</em>
      </td>
    </tr>
  </table>

  <h1>BÁO CÁO ${periodType === 'week' ? 'TUẦN' : 'THÁNG'} CÔNG TÁC ĐOÀN VÀ PHONG TRÀO THANH NIÊN</h1>
  <p style="text-align:center;"><em>Kỳ báo cáo: ${escapeHtml(periodText)} — Đơn vị: ${escapeHtml(info.tenChiDoan)}</em></p>

  <h2>I. SỐ LIỆU TỔNG HỢP</h2>
  <ul>
    <li>Tổng số đoàn viên quản lý: <strong>${stats.totalMembers}</strong> (Đang sinh hoạt: <strong>${stats.activeMembers}</strong>)</li>
    <li>Tỷ lệ hoàn thành đoàn phí: <strong>${stats.feePaidCount}/${stats.totalMembers} (${stats.feePaidPct}%)</strong></li>
    <li>Số hoạt động triển khai trong kỳ: <strong>${activities.length}</strong> — Tỷ lệ điểm danh QR trung bình: <strong>${stats.avgAttendancePct}%</strong></li>
    <li>Tổng giờ công tác xã hội ghi nhận: <strong>${stats.totalSocialHours} giờ</strong></li>
  </ul>

  <h2>II. KẾT QUẢ HOẠT ĐỘNG TÌNH NGUYỆN &amp; SINH HOẠT</h2>
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Tên hoạt động</th>
        <th>Ngày</th>
        <th>Địa điểm</th>
        <th>Tham gia</th>
        <th>Giờ CTXH</th>
      </tr>
    </thead>
    <tbody>${activityRows}</tbody>
  </table>

  <h2>III. BẢNG KÊ GIỜ CÔNG TÁC XÃ HỘI &amp; ĐOÀN PHÍ</h2>
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Mã ĐV</th>
        <th>Họ và tên</th>
        <th>Chức vụ</th>
        <th>Trạng thái</th>
        <th>Đoàn phí</th>
        <th>Giờ CTXH</th>
      </tr>
    </thead>
    <tbody>${memberRows}</tbody>
  </table>

  <h2>IV. ĐỀ XUẤT &amp; KIẾN NGHỊ THÀNH ĐOÀN</h2>
  <p>${escapeHtml(recommendation)}</p>

  <table class="header-table" style="margin-top:24px;">
    <tr>
      <td style="width:50%;">
        <strong>NƠI NHẬN:</strong><br/>
        <em>- BTV ${escapeHtml(info.donViCapTren)} (báo cáo);</em><br/>
        <em>- Lưu hồ sơ ${escapeHtml(info.tenChiDoan)}.</em>
      </td>
      <td style="width:50%;">
        <strong>TM. BCH ${escapeHtml(info.tenChiDoan).toUpperCase()}</strong><br/>
        <strong>${escapeHtml(effectiveSignerTitle).toUpperCase()}</strong><br/><br/><br/>
        <strong>${escapeHtml(effectiveSignerName)}</strong>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function exportWordReport(params) {
  const htmlDoc = buildWordReportHtml(params);
  const blob = new Blob(['\uFEFF' + htmlDoc], {
    type: 'application/msword;charset=utf-8'
  });
  const slug = params.periodType === 'week' ? 'tuan' : 'thang';
  triggerBlobDownload(blob, `bao-cao-${slug}-chi-doan.doc`);
}
