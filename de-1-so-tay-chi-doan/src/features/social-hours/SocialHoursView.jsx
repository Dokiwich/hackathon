import React, { useState, useMemo } from 'react';
import { Award, FileSpreadsheet, Clock, X, ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { exportSocialLedgerCsv } from '../../utils/reportExport';
import { formatDateVN } from '../../shared/utils/format';

function getEmulationBadge(hours) {
  if (hours >= 24) {
    return { label: 'Xuất sắc', cls: 'bg-emerald-50 border-emerald-200 text-accent' };
  }
  if (hours >= 14) {
    return { label: 'Khá', cls: 'bg-sky-50 border-sky-200 text-[#005BAC]' };
  }
  return { label: 'Đang tích lũy', cls: 'bg-slate-100 border-slate-200 text-muted' };
}

export default function SocialHoursView({
  info,
  members,
  ledger,
  allowExport = true,
  isPersonalOnly = false
}) {
  const [filterMode, setFilterMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const targetHours = info.chiTieuGioCtxhNam || 24;

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sorted = [...members].sort((a, b) => Number(b.gioCtxh || 0) - Number(a.gioCtxh || 0));
    const byStatus = isPersonalOnly
      ? sorted
      : filterMode === 'met'
        ? sorted.filter((m) => Number(m.gioCtxh || 0) >= targetHours)
        : filterMode === 'below'
          ? sorted.filter((m) => Number(m.gioCtxh || 0) < targetHours)
          : sorted;
    if (!q) return byStatus;
    return byStatus.filter(
      (m) =>
        (m.hoTen || '').toLowerCase().includes(q) ||
        (m.maDoanVien || '').toLowerCase().includes(q)
    );
  }, [members, filterMode, searchQuery, targetHours, isPersonalOnly]);

  const metCount = members.filter((m) => Number(m.gioCtxh || 0) >= targetHours).length;

  const selectedLedger = useMemo(() => {
    if (!selectedMember) return [];
    return ledger.filter((l) => l.memberId === selectedMember.id);
  }, [ledger, selectedMember]);

  return (
    <div className="space-y-5">
      <section className="app-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A2B49]">
            {isPersonalOnly ? 'Giờ CTXH & Điểm thi đua cá nhân' : 'Sổ cái Giờ CTXH & Xếp loại thi đua'}
          </h1>
          <p className="text-sm sm:text-[15px] text-slate-600 mt-1 tabular-nums">
            Chỉ tiêu năm: <strong className="text-ink">{targetHours}h</strong>
            {!isPersonalOnly && (
              <>
                {' '}• Hoàn thành: <strong className="text-accent">{metCount}/{members.length} đoàn viên</strong>
              </>
            )}
          </p>
        </div>

        {allowExport && !isPersonalOnly && (
          <button
            type="button"
            onClick={() => exportSocialLedgerCsv(ledger, members)}
            className="app-btn-primary shrink-0"
          >
            <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
            Xuất sổ cái CSV
          </button>
        )}
      </section>

      <section className="app-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Award className="w-5 h-5 text-[#005BAC]" aria-hidden="true" />
            {isPersonalOnly ? 'Kết quả rèn luyện & tình nguyện' : 'Bảng xếp hạng tích lũy giờ CTXH'}
          </h2>
          {!isPersonalOnly && (
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: `Tất cả (${members.length})` },
                { id: 'met', label: `Đạt chỉ tiêu (${metCount})` },
                { id: 'below', label: `Chưa đủ (${members.length - metCount})` }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFilterMode(opt.id)}
                  className={`min-h-[38px] px-3.5 rounded-full text-sm font-semibold border transition tabular-nums ${
                    filterMode === opt.id
                      ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-surface'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!isPersonalOnly && (
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh theo họ tên hoặc mã đoàn viên..."
              className="app-input pl-10"
            />
          </div>
        )}

        <div className="divide-y divide-slate-200/80">
          {filteredMembers.map((m) => {
            const hours = Number(m.gioCtxh || 0);
            const pct = Math.min(100, Math.round((hours / targetHours) * 100));
            const met = hours >= targetHours;
            const rank = getEmulationBadge(hours);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMember(m)}
                className="w-full text-left py-4 space-y-2.5 hover:bg-slate-50/80 px-3 rounded-xl transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-base font-bold text-ink truncate">{m.hoTen}</span>
                    <span className="font-mono text-sm text-muted">({m.maDoanVien})</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${rank.cls}`}>
                      {rank.label}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-sm sm:text-base font-bold tabular-nums inline-flex items-center gap-1.5 ${
                      met ? 'text-accent' : 'text-[#005BAC]'
                    }`}
                  >
                    {met && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                    {hours}/{targetHours}h ({pct}%)
                    <ArrowRight className="w-4 h-4 text-muted" aria-hidden="true" />
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      met ? 'bg-accent' : 'bg-[#005BAC]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedMember && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="app-modal-panel max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-ink">{selectedMember.hoTen}</h2>
                <p className="text-sm font-mono text-muted mt-0.5">
                  {selectedMember.maDoanVien} • Tổng {selectedMember.gioCtxh}h CTXH • Xếp loại:{' '}
                  {getEmulationBadge(Number(selectedMember.gioCtxh || 0)).label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                aria-label="Đóng nhật ký giờ CTXH"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedLedger.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" aria-hidden="true" />
                Chưa có bản ghi sổ cái chi tiết cho đoàn viên này.
              </p>
            ) : (
              <div className="divide-y divide-slate-200/80">
                {selectedLedger.map((entry) => (
                  <div key={entry.id} className="py-3.5 space-y-1 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-bold text-ink leading-snug">{entry.activityTitle}</span>
                      <span className="font-mono font-bold text-accent shrink-0 whitespace-nowrap">+{entry.hours}h</span>
                    </div>
                    <div className="font-mono text-xs sm:text-sm text-muted flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <span>{entry.method} • Duyệt: {entry.approvedBy}</span>
                      <span className="whitespace-nowrap tabular-nums">{formatDateVN(entry.recordedAt, true)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
