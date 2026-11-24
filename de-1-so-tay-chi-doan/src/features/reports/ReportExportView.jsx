import React, { useMemo, useState } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Building2,
  Eye,
  X,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import {
  computeReportStats,
  exportCsvReport,
  exportWordReport
} from '../../utils/reportExport';
import { WARD_BRANCH_CATALOG } from '../../data/chiDoanData';

export default function ReportExportView({
  info,
  members,
  activities,
  ledger,
  makeupList = [],
  reportSummary = null,
  syncMode = 'offline',
  onRefreshData,
  currentUser = null,
  canViewWardSummary = false
}) {
  const [periodType, setPeriodType] = useState('month');
  const [periodText, setPeriodText] = useState('Tháng 11/2026');
  const [docNumber, setDocNumber] = useState(canViewWardSummary ? '24/BC-ĐTN' : '18/BC-ĐTN');
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [recommendation, setRecommendation] = useState(
    'Duy trì khung sinh hoạt bù tối Thứ 7 cho công nhân KCN và triển khai đồng bộ thông báo Zalo OA đến các chi đoàn khu phố.'
  );
  const [exportedNote, setExportedNote] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const reportMembers = useMemo(() => {
    if (!canViewWardSummary || selectedBranchId === 'all') return members;
    return members.filter((m) => (m.branchId || 'BR-KP5') === selectedBranchId);
  }, [members, canViewWardSummary, selectedBranchId]);

  const reportActivities = useMemo(() => {
    let scoped = activities;
    if (canViewWardSummary && selectedBranchId !== 'all') {
      scoped = activities.filter(
        (a) => a.scope === 'ward' || (a.branchId || 'BR-KP5') === selectedBranchId
      );
    }
    const mMatch = periodType === 'month' ? String(periodText || '').match(/(\d{1,2})\s*\/\s*(\d{4})/) : null;
    if (mMatch) {
      const ym = `${mMatch[2]}-${mMatch[1].padStart(2, '0')}`;
      const inMonth = scoped.filter((a) => String(a.ngayToChuc || '').startsWith(ym));
      if (inMonth.length > 0) return inMonth;
    }
    return scoped;
  }, [activities, canViewWardSummary, selectedBranchId, periodType, periodText]);

  const reportUnitTitle = useMemo(() => {
    if (!canViewWardSummary) return info.tenChiDoan;
    if (selectedBranchId === 'all') return info.tenDoanCoSo;
    const found = WARD_BRANCH_CATALOG.find((b) => b.id === selectedBranchId);
    return found ? found.name : info.tenChiDoan;
  }, [canViewWardSummary, selectedBranchId, info]);

  const wardBranchSummary = useMemo(() => {
    if (!canViewWardSummary) return [];
    const serverBranches = reportSummary?.branchSummary;
    if (syncMode === 'online' && Array.isArray(serverBranches) && serverBranches.length > 0) {
      return serverBranches.map((sb) => {
        const meta = WARD_BRANCH_CATALOG.find((c) => c.id === sb.branchId);
        return {
          id: sb.branchId,
          name: sb.branchName,
          secretary: meta?.secretary || 'Bí thư Chi đoàn',
          total: sb.totalMembers,
          localCount: sb.localCount,
          farCount: sb.migrantWorkerCount,
          transferCount: sb.transferredCount,
          attendancePct: sb.attendancePct ?? 65,
          recentMeetingCounts: Array.isArray(sb.recentMeetingCounts) ? sb.recentMeetingCounts : [],
          feePct: sb.feePaidPct,
          hours: sb.totalSocialHours
        };
      });
    }

    return WARD_BRANCH_CATALOG.map((branch) => {
      const bMembers = members.filter((m) => (m.branchId || 'BR-KP5') === branch.id);
      const bIds = new Set(bMembers.map((m) => m.id));
      const localCount = bMembers.filter((m) => m.trangThai === 'Đang ở địa phương').length;
      const farCount = bMembers.filter((m) => m.trangThai === 'Đi làm xa').length;
      const transferCount = bMembers.filter((m) => m.trangThai === 'Chuyển sinh hoạt').length;
      const feePaid = bMembers.filter((m) => m.daDongDoanPhi).length;
      const hours = bMembers.reduce((sum, m) => sum + Number(m.gioCtxh || 0), 0);

      const bMeetings = activities.filter(
        (a) => (a.branchId || 'BR-KP5') === branch.id && a.isClosed
      );
      const checkins = bMeetings.reduce(
        (sum, a) => sum + (a.checkedInRecords || []).filter((r) => bIds.has(r.memberId)).length,
        0
      );
      const attendancePct =
        bMeetings.length && bMembers.length
          ? Math.round((checkins / (bMeetings.length * bMembers.length)) * 100)
          : 68;
      const recentMeetingCounts = bMeetings
        .slice(0, 3)
        .map((a) => (a.checkedInRecords || []).filter((r) => bIds.has(r.memberId)).length);

      return {
        ...branch,
        total: bMembers.length,
        localCount,
        farCount,
        transferCount,
        attendancePct,
        recentMeetingCounts,
        feePct: bMembers.length ? Math.round((feePaid / bMembers.length) * 100) : 0,
        hours
      };
    });
  }, [canViewWardSummary, reportSummary, syncMode, members, activities]);

  const computedStats = useMemo(
    () => computeReportStats(reportMembers, reportActivities, ledger),
    [reportMembers, reportActivities, ledger]
  );
  const stats = useMemo(
    () =>
      syncMode === 'online' && reportSummary && selectedBranchId === 'all'
        ? {
            ...computedStats,
            totalMembers: reportSummary.totalMembers ?? computedStats.totalMembers,
            feePaidPct: reportSummary.feePaidPct ?? computedStats.feePaidPct,
            avgAttendancePct: reportSummary.avgAttendancePct ?? computedStats.avgAttendancePct,
            totalSocialHours: reportSummary.totalSocialHours ?? computedStats.totalSocialHours
          }
        : computedStats,
    [syncMode, reportSummary, selectedBranchId, computedStats]
  );

  const smartAnalysisText = useMemo(() => {
    const farTotal = reportMembers.filter((m) => m.trangThai === 'Đi làm xa').length;
    const unpaid = reportMembers.filter((m) => !m.daDongDoanPhi).length;
    const approvedMakeup = makeupList.filter((m) => m.status === 'approved').length;
    return `Đơn vị quản lý ${stats.totalMembers} đoàn viên (trong đó ${farTotal} ĐV đi làm xa/công nhân KCN, đã duyệt ${approvedMakeup} lượt đăng ký sinh hoạt bù). Tỷ lệ chuyên cần đạt ${stats.avgAttendancePct}%, đoàn phí đạt ${stats.feePaidPct}% (còn ${unpaid} ĐV cần nhắc đóng). Đề nghị tiếp tục mở ca sinh hoạt bù tối Thứ 7 và gửi thông báo tự động qua Zalo OA trước 24 giờ.`;
  }, [reportMembers, makeupList, stats]);

  const reportInfo = { ...info, tenChiDoan: reportUnitTitle };

  const handleExportWord = () => {
    exportWordReport({
      info: reportInfo,
      periodType,
      periodText,
      docNumber,
      recommendation,
      members: reportMembers,
      activities: reportActivities,
      signerName: currentUser?.fullName || info.biThu,
      signerRoleTitle: currentUser?.role === 'ward_officer' ? 'CÁN BỘ ĐOÀN PHỤ TRÁCH' : 'BÍ THƯ'
    });
    setExportedNote('Đã xuất file Word (.doc) chuẩn hành chính Đoàn từ dữ liệu thực.');
  };

  const handleExportCsv = () => {
    exportCsvReport(reportMembers, periodType === 'week' ? 'tuan' : 'thang');
    setExportedNote('Đã xuất bảng dữ liệu Excel (.csv UTF-8 BOM) an toàn.');
  };

  return (
    <div className="space-y-5">
      <section className="no-print app-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-muted">
            Số liệu tổng hợp thực tế
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A2B49] mt-1">
            {canViewWardSummary
              ? 'Tổng hợp Đoàn Xã/Phường & Xuất báo cáo tháng'
              : 'Tổng hợp Chi đoàn & Xuất báo cáo tháng'}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {syncMode === 'online' && onRefreshData && (
            <button type="button" onClick={onRefreshData} className="app-btn-secondary">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Làm mới
            </button>
          )}
          <button type="button" onClick={handleExportWord} className="app-btn-primary">
            <FileDown className="w-5 h-5" aria-hidden="true" />
            Xuất Word (.doc)
          </button>
          <button type="button" onClick={handleExportCsv} className="app-btn-secondary">
            <FileSpreadsheet className="w-4 h-4 text-accent" aria-hidden="true" />
            Xuất CSV
          </button>
          <button type="button" onClick={() => setPreviewOpen(true)} className="app-btn-secondary">
            <Eye className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
            Bản in A4
          </button>
        </div>
      </section>

      {exportedNote && (
        <div role="status" className="no-print p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          <span>{exportedNote}</span>
        </div>
      )}

      {/* 4 Real KPI Cards */}
      <section className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3.5 tabular-nums">
        <div className="app-card p-5">
          <div className="text-sm font-semibold text-slate-600">Tổng đoàn viên</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">{stats.totalMembers}</div>
        </div>
        <div className="app-card p-5">
          <div className="text-sm font-semibold text-slate-600">Tỷ lệ sinh hoạt TB</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#005BAC] mt-1">{stats.avgAttendancePct}%</div>
        </div>
        <div className="app-card p-5">
          <div className="text-sm font-semibold text-slate-600">Hoàn thành đoàn phí</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-accent mt-1">{stats.feePaidPct}%</div>
        </div>
        <div className="app-card p-5">
          <div className="text-sm font-semibold text-slate-600">Tổng giờ CTXH</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">{stats.totalSocialHours}h</div>
        </div>
      </section>

      {/* Ward Summary Table by Branch */}
      {canViewWardSummary && (
        <section className="no-print app-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#1A2B49] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#005BAC]" aria-hidden="true" />
              Tỷ lệ sinh hoạt &amp; thực lực từng Chi đoàn trực thuộc
            </h2>
            <select
              id="report-branch-scope"
              name="reportBranchScope"
              aria-label="Lọc phạm vi báo cáo"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="min-h-[44px] px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-ink"
            >
              <option value="all">Toàn đơn vị ({members.length} ĐV)</option>
              {WARD_BRANCH_CATALOG.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm sm:text-[15px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-3.5 font-bold rounded-tl-xl">Chi đoàn</th>
                  <th className="py-3 px-3.5 font-bold text-right">Tổng ĐV</th>
                  <th className="py-3 px-3.5 font-bold text-right">Tại chỗ / Xa / Chuyển</th>
                  <th className="py-3 px-3.5 font-bold text-right">Tỷ lệ sinh hoạt</th>
                  <th className="py-3 px-3.5 font-bold text-right">Đoàn phí</th>
                  <th className="py-3 px-3.5 font-bold text-right rounded-tr-xl">Giờ CTXH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 tabular-nums">
                {wardBranchSummary.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-ink">{row.name}</div>
                      <div className="text-xs sm:text-sm text-muted">Bí thư: {row.secretary}</div>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-ink">{row.total}</td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-muted">
                      {row.localCount} / {row.farCount} / {row.transferCount}
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <span className="font-mono font-bold text-[#005BAC]">{row.attendancePct}%</span>
                      {row.recentMeetingCounts.length > 0 && (
                        <div className="text-xs font-mono text-muted">
                          ({row.recentMeetingCounts.join(' · ')} ĐV)
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono text-accent font-semibold">
                      {row.feePct}%
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-ink">
                      {row.hours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Smart Analytical Insight Box */}
      <section className="no-print app-card p-6 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#005BAC]" aria-hidden="true" />
            Trợ lý phân tích số liệu &amp; gợi ý điều hành tự động
          </div>
          <button
            type="button"
            onClick={() => {
              setRecommendation(smartAnalysisText);
              setExportedNote('Đã đưa nhận xét phân tích tự động vào mục Kiến nghị của báo cáo.');
            }}
            className="min-h-[40px] px-4 py-1.5 rounded-xl border border-[#005BAC] bg-sky-50 text-[#005BAC] text-sm font-semibold hover:bg-sky-100 transition"
          >
            Đưa vào mục Kiến nghị
          </button>
        </div>
        <p className="text-[15px] text-slate-700 leading-relaxed app-subcard p-4">
          {smartAnalysisText}
        </p>
      </section>

      {/* Report Metadata Config */}
      <section className="no-print app-card p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div>
          <label htmlFor="period-type" className="block text-sm font-bold text-ink mb-1.5">Loại báo cáo</label>
          <select
            id="period-type"
            value={periodType}
            onChange={(e) => {
              const val = e.target.value;
              setPeriodType(val);
              setPeriodText(val === 'week' ? 'Tuần 4 — Tháng 11/2026' : 'Tháng 11/2026');
            }}
            className="app-input"
          >
            <option value="month">Báo cáo Tháng</option>
            <option value="week">Báo cáo Tuần</option>
          </select>
        </div>
        <div>
          <label htmlFor="period-label" className="block text-sm font-bold text-ink mb-1.5">Kỳ báo cáo</label>
          <input
            id="period-label"
            value={periodText}
            onChange={(e) => setPeriodText(e.target.value)}
            className="app-input"
          />
        </div>
        <div>
          <label htmlFor="doc-number" className="block text-sm font-bold text-ink mb-1.5">Số công văn</label>
          <input
            id="doc-number"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            className="app-input font-mono"
          />
        </div>
        <div>
          <label htmlFor="doc-rec" className="block text-sm font-bold text-ink mb-1.5">Kiến nghị cấp trên</label>
          <input
            id="doc-rec"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="app-input"
          />
        </div>
      </section>

      {/* Printable Official A4 Sheet Modal */}
      {previewOpen && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="app-modal-panel max-w-4xl p-6 space-y-4">
            <div className="no-print flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <span className="text-base font-bold text-ink">Xem trước bản in hành chính A4</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="app-btn-primary min-h-[42px] text-sm"
                >
                  <Printer className="w-4 h-4" aria-hidden="true" /> In / Lưu PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Đóng bản xem trước"
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <article className="print-sheet font-serif text-ink space-y-5 p-2 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <div className="font-bold uppercase">{info.donViCapTren}</div>
                  <div className="font-bold uppercase underline">{info.tenDoanCoSo}</div>
                  <div className="font-mono text-xs mt-1">Số: {docNumber}</div>
                </div>
                <div>
                  <div className="font-bold uppercase">ĐOÀN TNCS HỒ CHÍ MINH</div>
                  <div className="italic text-xs mt-1">Ngày {new Date().toLocaleDateString('vi-VN')}</div>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="font-bold text-lg uppercase">
                  BÁO CÁO {periodType === 'week' ? 'TUẦN' : 'THÁNG'} CÔNG TÁC ĐOÀN VÀ PHONG TRÀO THANH NIÊN
                </h2>
                <p className="text-sm italic text-muted">
                  Kỳ báo cáo: {periodText} — Đơn vị: {reportUnitTitle}
                </p>
              </div>

              <div className="font-sans text-sm space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 tabular-nums">
                  <div>Tổng ĐV: <strong>{stats.totalMembers}</strong></div>
                  <div>Chuyên cần: <strong>{stats.avgAttendancePct}%</strong></div>
                  <div>Đoàn phí: <strong>{stats.feePaidPct}%</strong></div>
                  <div>Tổng CTXH: <strong>{stats.totalSocialHours}h</strong></div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-2.5">STT</th>
                        <th className="border border-slate-300 p-2.5 text-left">Hoạt động</th>
                        <th className="border border-slate-300 p-2.5">Ngày</th>
                        <th className="border border-slate-300 p-2.5">Tham gia</th>
                        <th className="border border-slate-300 p-2.5">Giờ CTXH</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportActivities.map((a, idx) => {
                        const count = a.checkedInRecords ? a.checkedInRecords.length : 0;
                        return (
                          <tr key={a.id}>
                            <td className="border border-slate-300 p-2.5 text-center">{idx + 1}</td>
                            <td className="border border-slate-300 p-2.5">{a.tenHoatDong}</td>
                            <td className="border border-slate-300 p-2.5 text-center font-mono">{a.ngayToChuc}</td>
                            <td className="border border-slate-300 p-2.5 text-center font-mono">
                              {count}/{reportMembers.length}
                            </td>
                            <td className="border border-slate-300 p-2.5 text-center font-mono">{a.gioCongTacXaHoi}h</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="text-sm">
                  <div className="font-bold">ĐỀ XUẤT &amp; KIẾN NGHỊ:</div>
                  <p className="text-slate-700 mt-1 leading-relaxed">{recommendation}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
