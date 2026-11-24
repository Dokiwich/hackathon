import React, { useState } from 'react';
import { Bell, Plus, CheckCircle2, Clock, MessageSquare, X, Trash2 } from 'lucide-react';
import { formatDateVN } from '../../shared/utils/format';

export default function RemindersView({
  reminders,
  onAddReminder,
  onToggleReminder,
  onToggleAutoNotify,
  onDeleteReminder,
  readOnly = false
}) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('2026-12-02 19:00');
  const [cycle, setCycle] = useState('Hàng tháng');
  const [advance, setAdvance] = useState('Trước 24 giờ');
  const [channel, setChannel] = useState('Zalo OA + Web Push');
  const [filterStatus, setFilterStatus] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onAddReminder({
      id: `RM-${Date.now().toString().slice(-3)}`,
      tieuDe: title.trim(),
      hanChot: deadline,
      chuKy: cycle,
      nhacTruoc: advance,
      kenhNhac: channel,
      doiTuong: 'Toàn thể đoàn viên chi đoàn',
      batNhacTuDong: true,
      daHoanThanh: false
    });
    setTitle('');
    setCreateOpen(false);
  };

  const visibleReminders = reminders.filter((r) => {
    if (filterStatus === 'pending') return !r.daHoanThanh;
    if (filterStatus === 'done') return r.daHoanThanh;
    return true;
  });

  return (
    <div className="space-y-5">
      <section className="app-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A2B49]">
            Lịch sinh hoạt &amp; Nhắc việc tự động
          </h1>
          <p className="text-sm sm:text-[15px] text-slate-600 mt-1">
            Tự động gửi thông báo qua Zalo OA / Web Push trước giờ sinh hoạt và hạn báo cáo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex gap-1.5">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'pending', label: 'Đang chờ' },
              { id: 'done', label: 'Hoàn tất' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterStatus(opt.id)}
                className={`min-h-[40px] px-4 rounded-full text-sm font-semibold border transition ${
                  filterStatus === opt.id
                    ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-surface'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="app-btn-primary"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Tạo lịch nhắc
            </button>
          )}
        </div>
      </section>

      <section className="app-card divide-y divide-slate-200/80 overflow-hidden">
        {visibleReminders.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedReminder(r)}
            className={`w-full text-left p-4 sm:px-6 flex items-center justify-between gap-3.5 hover:bg-slate-50/85 transition ${
              r.daHoanThanh ? 'opacity-70' : ''
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                  r.daHoanThanh
                    ? 'bg-emerald-50 border-emerald-200 text-accent'
                    : 'bg-sky-50 border-sky-200 text-[#005BAC]'
                }`}
              >
                {r.daHoanThanh ? (
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Bell className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <div
                  className={`font-bold text-base truncate ${
                    r.daHoanThanh ? 'line-through text-muted' : 'text-ink'
                  }`}
                >
                  {r.tieuDe}
                </div>
                <div className="text-sm font-mono text-muted flex items-center gap-2 tabular-nums mt-0.5">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {formatDateVN(r.hanChot, true)} • {r.chuKy || 'Một lần'}
                </div>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium shrink-0 ${
                r.batNhacTuDong
                  ? 'bg-sky-50 text-[#005BAC]'
                  : 'bg-slate-100 text-muted'
              }`}
            >
              {r.batNhacTuDong ? 'Nhắc tự động' : 'Thông báo'}
            </span>
          </button>
        ))}
        {visibleReminders.length === 0 && (
          <div className="p-10 text-center text-base text-muted">Không có lịch nhắc phù hợp.</div>
        )}
      </section>

      {/* Detail & Zalo ZNS Preview Modal */}
      {selectedReminder && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="app-modal-panel max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-ink">{selectedReminder.tieuDe}</h2>
              <button
                type="button"
                onClick={() => setSelectedReminder(null)}
                aria-label="Đóng chi tiết nhắc việc"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="app-subcard p-4 text-sm sm:text-[15px] space-y-2.5 leading-relaxed">
              <div className="font-mono font-bold text-[#005BAC] flex items-center gap-2">
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                MẪU TIN NHẮN ZALO ZNS TỰ ĐỘNG
              </div>
              <p className="text-ink">
                Kính gửi <strong>{selectedReminder.doiTuong || 'Đoàn viên'}</strong>, thông báo lịch:{' '}
                <strong>{selectedReminder.tieuDe}</strong>.
              </p>
              <p className="font-mono text-muted tabular-nums">
                Thời hạn: {formatDateVN(selectedReminder.hanChot, true)} ({selectedReminder.nhacTruoc || 'Trước 24 giờ'})
              </p>
              <div className="pt-2 border-t border-slate-200/80 text-xs sm:text-sm text-muted">
                Kênh: {selectedReminder.kenhNhac} • Chu kỳ: {selectedReminder.chuKy || 'Một lần'}
              </div>
            </div>

            {!readOnly && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await onToggleAutoNotify(selectedReminder.id);
                      setSelectedReminder((prev) =>
                        prev ? { ...prev, batNhacTuDong: !prev.batNhacTuDong } : null
                      );
                    }}
                    className="app-btn-secondary text-sm px-3"
                  >
                    {selectedReminder.batNhacTuDong ? 'Tắt nhắc tự động' : 'Bật nhắc tự động'}
                  </button>
                  {onDeleteReminder && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onDeleteReminder(selectedReminder.id);
                        setSelectedReminder(null);
                      }}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold inline-flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      Xóa
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onToggleReminder(selectedReminder.id);
                    setSelectedReminder(null);
                  }}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-accent hover:opacity-95 text-white text-[15px] font-semibold transition"
                >
                  {selectedReminder.daHoanThanh ? 'Mở lại lịch' : 'Đánh dấu hoàn tất'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Reminder Modal */}
      {createOpen && !readOnly && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSubmit}
            className="app-modal-panel max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Tạo lịch nhắc tự động mới</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                aria-label="Đóng"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label htmlFor="rem-title" className="block text-sm font-bold text-ink mb-1.5">Nội dung nhắc việc *</label>
              <input
                id="rem-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Họp Chi đoàn tổng kết tháng"
                className="app-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rem-deadline" className="block text-sm font-bold text-ink mb-1.5">Thời hạn</label>
                <input
                  id="rem-deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="app-input text-sm font-mono"
                />
              </div>
              <div>
                <label htmlFor="rem-cycle" className="block text-sm font-bold text-ink mb-1.5">Chu kỳ lặp</label>
                <select
                  id="rem-cycle"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  className="app-input text-sm"
                >
                  <option>Hàng tuần</option>
                  <option>Hàng tháng</option>
                  <option>Một lần</option>
                </select>
              </div>
              <div>
                <label htmlFor="rem-advance" className="block text-sm font-bold text-ink mb-1.5">Nhắc trước</label>
                <select
                  id="rem-advance"
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                  className="app-input text-sm"
                >
                  <option>Trước 2 giờ</option>
                  <option>Trước 12 giờ</option>
                  <option>Trước 24 giờ</option>
                  <option>Trước 48 giờ</option>
                </select>
              </div>
              <div>
                <label htmlFor="rem-channel" className="block text-sm font-bold text-ink mb-1.5">Kênh gửi</label>
                <select
                  id="rem-channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="app-input text-sm"
                >
                  <option>Zalo OA + Web Push</option>
                  <option>Zalo Nhóm Chi đoàn</option>
                  <option>SMS + Web Push</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full app-btn-primary">
              Lưu lịch nhắc tự động
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
