import { describe, it, expect } from 'vitest';
import {
  buildCsvContent,
  buildWordReportHtml,
  computeReportStats,
  escapeHtml,
  parseMembersCsv,
  sanitizeCsvCell
} from './reportExport';

describe('reportExport security, parsing & aggregation', () => {
  it('escapes HTML entities to prevent XSS in Word export', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('neutralizes CSV formula injection prefixes (=, +, -, @)', () => {
    expect(sanitizeCsvCell('=CMD|"/C calc"!A0')).toBe('"\'=CMD|""/C calc""!A0"');
    expect(sanitizeCsvCell('+1234')).toBe('"\'+1234"');
    expect(sanitizeCsvCell('-SUM(A1:A2)')).toBe('"\'-SUM(A1:A2)"');
    expect(sanitizeCsvCell('@HYPERLINK')).toBe('"\'@HYPERLINK"');
    expect(sanitizeCsvCell('Nguyễn Văn An')).toBe('"Nguyễn Văn An"');
  });

  it('builds CSV, parses CSV imports, and renders escaped Word report HTML', () => {
    const members = [
      { id: '1', maDoanVien: 'DN-01', hoTen: 'Nguyễn An', chiDoan: 'KP2', chucVu: 'Đoàn viên', sdt: '0901', ngayVaoDoan: '26/03/2024', trangThai: 'Đang sinh hoạt', gioCtxh: 12, daDongDoanPhi: true }
    ];
    const activities = [
      { id: 'HD-1', tenHoatDong: 'Chủ nhật xanh', ngayToChuc: '2026-11-22', diaDiem: 'Tam Hiệp', gioCongTacXaHoi: 4, checkedInRecords: [{ memberId: '1' }] }
    ];

    const stats = computeReportStats(members, activities);
    expect(stats.avgAttendancePct).toBe(100);
    expect(stats.feePaidPct).toBe(100);

    const csv = buildCsvContent(members);
    expect(csv).toContain('Nguyễn An');

    const imported = parseMembersCsv('Ma Doan Vien,Ho va Ten,Chi Doan,Chuc Vu,SDT,Gio\nDN-99,Lê Bình,KP2,Đoàn viên,0911,8');
    expect(imported).toHaveLength(1);
    expect(imported[0].hoTen).toBe('Lê Bình');
    expect(imported[0].gioCtxh).toBe(8);

    const docHtml = buildWordReportHtml({
      info: { donViCapTren: 'Thành đoàn', tenDoanCoSo: 'Tam Hiệp', tenChiDoan: 'KP2', biThu: 'Minh Khôi' },
      periodType: 'week',
      periodText: 'Tuần 4',
      recommendation: '<img src=x onerror=alert(1)>',
      members,
      activities
    });
    expect(docHtml).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(docHtml).toContain('BÁO CÁO TUẦN');
  });
});
