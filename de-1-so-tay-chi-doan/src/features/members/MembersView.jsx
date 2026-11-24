import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Upload,
  CheckCircle2,
  QrCode,
  SlidersHorizontal,
  AlertCircle
} from 'lucide-react';
import { parseMembersCsv } from '../../utils/reportExport';
import { getInitials } from '../../shared/utils/format';

const STATUS_BADGE = {
  'Đang ở địa phương': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Đi làm xa': 'bg-amber-50 text-amber-700 border-amber-200',
  'Chuyển sinh hoạt': 'bg-slate-100 text-slate-600 border-slate-300',
  'Đang sinh hoạt': 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const WORK_SHIFT_LABELS = {
  day: 'Giờ HC',
  rotating_shift: 'Ca xoay KCN',
  night: 'Ca đêm KCN',
  student: 'Học sinh / SV'
};

function createEmptyForm() {
  return {
    maDoanVien: '',
    hoTen: '',
    ngaySinh: '01/01/2003',
    sdt: '',
    ngayVaoDoan: '26/03/2023',
    chucVu: 'Đoàn viên',
    congViec: 'Đoàn viên tại khu phố',
    workShift: 'day',
    xepLoai: 'Khá',
    trangThai: 'Đang ở địa phương',
    gioCtxh: 12,
    daDongDoanPhi: true
  };
}

export default function MembersView({
  members = [],
  ledger = [],
  onAddMember,
  onImportMembers,
  onUpdateMember,
  onDeleteMember,
  onToggleFee,
  readOnly = false,
  allowBranchFilter = false
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feeFilter, setFeeFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [formError, setFormError] = useState('');
  const [importNotice, setImportNotice] = useState('');

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileQrUrl, setProfileQrUrl] = useState('');

  const counts = useMemo(() => {
    const total = members.length;
    const local = members.filter(
      (m) => m.trangThai === 'Đang ở địa phương' || m.trangThai === 'Đang sinh hoạt'
    ).length;
    const migrant = members.filter((m) => m.trangThai === 'Đi làm xa').length;
    const transferred = members.filter((m) => m.trangThai === 'Chuyển sinh hoạt').length;
    const feePaid = members.filter((m) => m.daDongDoanPhi).length;
    return { total, local, migrant, transferred, feePaid };
  }, [members]);

  const branchOptions = useMemo(() => {
    return Array.from(new Set(members.map((m) => m.chiDoan).filter(Boolean))).sort();
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (allowBranchFilter && branchFilter !== 'all' && m.chiDoan !== branchFilter) {
        return false;
      }
      if (statusFilter !== 'all') {
        if (
          statusFilter === 'local' &&
          m.trangThai !== 'Đang ở địa phương' &&
          m.trangThai !== 'Đang sinh hoạt'
        ) {
          return false;
        }
        if (statusFilter !== 'local' && m.trangThai !== statusFilter) {
          return false;
        }
      }
      if (feeFilter === 'paid' && !m.daDongDoanPhi) return false;
      if (feeFilter === 'unpaid' && m.daDongDoanPhi) return false;
      if (!q) return true;
      return (
        String(m.hoTen || '').toLowerCase().includes(q) ||
        String(m.maDoanVien || '').toLowerCase().includes(q) ||
        String(m.sdt || '').toLowerCase().includes(q) ||
        String(m.chiDoan || '').toLowerCase().includes(q)
      );
    });
  }, [members, query, statusFilter, feeFilter, branchFilter, allowBranchFilter]);

  useEffect(() => {
    if (!selectedProfile) {
      setProfileQrUrl('');
      return;
    }
    let cancelled = false;
    const payload = JSON.stringify({
      app: 'doan-vien-so',
      id: selectedProfile.id,
      maDoanVien: selectedProfile.maDoanVien,
      hoTen: selectedProfile.hoTen,
      chiDoan: selectedProfile.chiDoan
    });
    QRCode.toDataURL(payload, { width: 190, margin: 2 })
      .then((url) => {
        if (!cancelled) setProfileQrUrl(url);
      })
      .catch(() => {
        if (!cancelled) setProfileQrUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProfile]);

  const openCreateModal = () => {
    setEditingMember(null);
    setFormError('');
    setForm({
      ...createEmptyForm(),
      maDoanVien: `DN-KP5-${String(members.length + 1).padStart(3, '0')}`
    });
    setFormOpen(true);
  };

  const openEditModal = (member, e) => {
    if (e) e.stopPropagation();
    setSelectedProfile(null);
    setEditingMember(member);
    setFormError('');
    setForm({
      maDoanVien: member.maDoanVien || '',
      hoTen: member.hoTen || '',
      ngaySinh: member.ngaySinh || '01/01/2003',
      sdt: member.sdt || '',
      ngayVaoDoan: member.ngayVaoDoan || '26/03/2023',
      chucVu: member.chucVu || 'Đoàn viên',
      congViec: member.congViec || '',
      workShift: member.workShift || 'day',
      xepLoai: member.xepLoai || 'Khá',
      trangThai: member.trangThai || 'Đang ở địa phương',
      gioCtxh: Number(member.gioCtxh || 0),
      daDongDoanPhi: Boolean(member.daDongDoanPhi)
    });
    setFormOpen(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.hoTen.trim() || !form.maDoanVien.trim()) return;
    const today = new Date().toLocaleDateString('vi-VN');
    try {
      if (editingMember) {
        await onUpdateMember(editingMember.id, {
          ...form,
          gioCtxh: Number(form.gioCtxh || 0),
          updatedAt: today
        });
      } else {
        await onAddMember({
          ...form,
          id: `DV-${Date.now().toString().slice(-5)}`,
          chiDoan: 'Chi đoàn Khu phố 5',
          gioCtxh: Number(form.gioCtxh || 0),
          updatedAt: today,
          hist: { t8: 'absent', t9: 'absent', t10: 'absent' }
        });
      }
      setFormOpen(false);
      setEditingMember(null);
    } catch (err) {
      setFormError(err.message || 'Dữ liệu không hợp lệ.');
    }
  };

  const handleCsvImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      setImportNotice('File CSV vượt quá giới hạn an toàn 512KB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = parseMembersCsv(String(reader.result || ''), 'Chi đoàn Khu phố 5');
        if (parsed.length > 0) {
          await onImportMembers(parsed);
          setImportNotice(`Đã kiểm tra bảo mật & nhập ${parsed.length} đoàn viên từ ${file.name}.`);
        } else {
          setImportNotice('Không đọc được dòng dữ liệu hợp lệ từ file CSV.');
        }
      } catch (err) {
        setImportNotice(err.message || 'Lỗi khi nhập CSV.');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      <section className="app-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A2B49]">
            {allowBranchFilter ? 'Danh sách Đoàn viên các Chi đoàn' : 'Danh sách Đoàn viên Chi đoàn'}
          </h1>
          <p className="text-sm sm:text-[15px] text-slate-600 mt-1 tabular-nums">
            Quản lý trạng thái cư trú, ca làm việc KCN và thẻ QR cá nhân ({counts.total} đoàn viên).
          </p>
        </div>

        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <label className="app-btn-secondary cursor-pointer">
              <Upload className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
              Nhập CSV
              <input
                id="csv-import-file"
                name="csvImportFile"
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvImport}
                className="sr-only"
              />
            </label>
            <button type="button" onClick={openCreateModal} className="app-btn-primary">
              <Plus className="w-5 h-5" aria-hidden="true" />
              Thêm đoàn viên
            </button>
          </div>
        ) : (
          <span className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm font-semibold text-muted shrink-0">
            Chế độ giám sát
          </span>
        )}
      </section>

      {importNotice && (
        <div role="status" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between gap-2">
          <span>{importNotice}</span>
          <button type="button" onClick={() => setImportNotice('')} className="font-semibold underline">
            Đóng
          </button>
        </div>
      )}

      {/* 4 Rubric Status Filter Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { key: 'all', label: 'Tất cả đoàn viên', value: counts.total, tone: 'text-[#005BAC]' },
          { key: 'local', label: 'Đang ở địa phương', value: counts.local, tone: 'text-accent' },
          { key: 'Đi làm xa', label: 'Đi làm xa', value: counts.migrant, tone: 'text-amber-600' },
          { key: 'Chuyển sinh hoạt', label: 'Chuyển sinh hoạt', value: counts.transferred, tone: 'text-slate-600' }
        ].map((kpi) => {
          const active = statusFilter === kpi.key;
          return (
            <button
              key={kpi.key}
              type="button"
              onClick={() => setStatusFilter(kpi.key)}
              className={`text-left px-4 py-4 rounded-2xl border transition-all ${
                active
                  ? 'bg-sky-50/85 border-[#005BAC] ring-2 ring-[#005BAC]/15 shadow-sm'
                  : 'bg-surface border-slate-200/85 hover:border-[#005BAC]/40 shadow-[0_4px_16px_rgba(15,23,42,0.03)]'
              }`}
            >
              <div className="text-sm font-semibold text-slate-600">{kpi.label}</div>
              <div className={`text-2xl sm:text-3xl font-extrabold mt-1 tabular-nums ${kpi.tone}`}>
                {kpi.value}
              </div>
            </button>
          );
        })}
      </section>

      {/* Search + Collapsible Filter Drawer */}
      <section className="app-card p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="member-search-input"
              name="memberSearch"
              aria-label="Tìm kiếm đoàn viên"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm họ tên, mã ĐV (VD: DN-KP5-002), SĐT..."
              className="app-input pl-11"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterDrawerOpen((v) => !v)}
            className="app-btn-secondary shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
            Bộ lọc nâng cao
          </button>
        </div>

        {filterDrawerOpen && (
          <div className="pt-3.5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label htmlFor="filter-status" className="block text-sm font-bold text-ink mb-1.5">
                Trạng thái cư trú
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="app-input"
              >
                <option value="all">Tất cả ({counts.total})</option>
                <option value="local">Đang ở địa phương ({counts.local})</option>
                <option value="Đi làm xa">Đi làm xa ({counts.migrant})</option>
                <option value="Chuyển sinh hoạt">Chuyển sinh hoạt ({counts.transferred})</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-fee" className="block text-sm font-bold text-ink mb-1.5">
                Đoàn phí 2026
              </label>
              <select
                id="filter-fee"
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
                className="app-input"
              >
                <option value="all">Tất cả</option>
                <option value="paid">Đã đóng ({counts.feePaid})</option>
                <option value="unpaid">Chưa đóng ({counts.total - counts.feePaid})</option>
              </select>
            </div>
            {allowBranchFilter && (
              <div>
                <label htmlFor="filter-branch" className="block text-sm font-bold text-ink mb-1.5">
                  Chi đoàn trực thuộc
                </label>
                <select
                  id="filter-branch"
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="app-input"
                >
                  <option value="all">Tất cả ({members.length} ĐV)</option>
                  {branchOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Responsive Member List with Medium-Large Text */}
      <section className="app-card divide-y divide-slate-200/80 overflow-hidden">
        {filtered.map((m) => (
          <div
            key={m.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedProfile(m)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedProfile(m);
              }
            }}
            className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/85 cursor-pointer transition"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-full bg-sky-50 border border-sky-200 text-[#005BAC] font-bold text-sm flex items-center justify-center shrink-0">
                {getInitials(m.hoTen)}
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-ink truncate">{m.hoTen}</div>
                <div className="text-sm font-mono text-muted truncate tabular-nums">
                  {m.maDoanVien} • {m.chiDoan}
                  {m.workShift && m.workShift !== 'day'
                    ? ` • ${WORK_SHIFT_LABELS[m.workShift] || m.workShift}`
                    : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              <span
                className={`px-3 py-1 rounded-full border text-xs sm:text-sm font-semibold ${
                  STATUS_BADGE[m.trangThai] || STATUS_BADGE['Đang sinh hoạt']
                }`}
              >
                {m.trangThai}
              </span>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm sm:text-base font-bold text-ink tabular-nums min-w-[42px] text-right">
                  {m.gioCtxh || 0}h
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold border ${
                    m.daDongDoanPhi
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {m.daDongDoanPhi ? 'ĐP ✓' : 'Chưa ĐP'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-10 text-center text-base text-muted">
            Không tìm thấy đoàn viên nào khớp bộ lọc hiện tại.
          </div>
        )}
      </section>

      {/* Member Detail + QR Modal */}
      {selectedProfile && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-qr-modal-title"
        >
          <div className="app-modal-panel max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 id="member-qr-modal-title" className="text-xl font-bold text-ink">
                Hồ sơ &amp; Thẻ QR Đoàn viên
              </h2>
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                aria-label="Đóng hồ sơ đoàn viên"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 app-subcard p-4">
              <div className="w-12 h-12 rounded-full bg-[#005BAC] text-white font-bold text-base flex items-center justify-center shrink-0">
                {getInitials(selectedProfile.hoTen)}
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-ink truncate">{selectedProfile.hoTen}</div>
                <div className="text-sm font-mono text-muted">
                  {selectedProfile.maDoanVien} • {selectedProfile.chucVu}
                </div>
                <div className="text-sm text-muted">{selectedProfile.chiDoan}</div>
              </div>
            </div>

            {profileQrUrl && (
              <div className="flex flex-col items-center p-4 rounded-xl border border-dashed border-[#005BAC]/60 bg-slate-50/80">
                <img
                  src={profileQrUrl}
                  alt={`Mã QR cá nhân của ${selectedProfile.hoTen}`}
                  className="w-44 h-44 rounded-xl bg-white p-2 border border-slate-200"
                />
                <span className="inline-flex items-center gap-1.5 text-sm text-muted mt-2 font-mono">
                  <QrCode className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
                  Thẻ định danh Đoàn viên số
                </span>
              </div>
            )}

            <div className="text-sm sm:text-[15px] space-y-2.5 app-subcard p-4 tabular-nums">
              <div className="flex justify-between">
                <span className="text-muted">Trạng thái cư trú:</span>
                <strong>{selectedProfile.trangThai}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Ca làm việc:</span>
                <strong>{WORK_SHIFT_LABELS[selectedProfile.workShift] || 'Giờ hành chính'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Số điện thoại:</span>
                <strong className="font-mono">{selectedProfile.sdt || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Giờ CTXH tích lũy:</span>
                <strong className="text-accent">
                  {selectedProfile.gioCtxh}h ({ledger.filter((l) => l.memberId === selectedProfile.id).length} bản ghi)
                </strong>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80">
                <span className="text-muted">Đoàn phí 2026:</span>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={async () => {
                    await onToggleFee(selectedProfile.id);
                    setSelectedProfile((prev) =>
                      prev ? { ...prev, daDongDoanPhi: !prev.daDongDoanPhi } : null
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-semibold border transition ${
                    selectedProfile.daDongDoanPhi
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {selectedProfile.daDongDoanPhi ? 'Đã đóng (Bấm đổi)' : 'Chưa đóng (Bấm thu)'}
                </button>
              </div>
            </div>

            {!readOnly && (
              <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={(e) => openEditModal(selectedProfile, e)}
                  className="app-btn-secondary"
                >
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteMember(selectedProfile.id);
                    setSelectedProfile(null);
                  }}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-sm sm:text-[15px] font-semibold text-rose-700 inline-flex items-center gap-2 transition"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Xóa ĐV
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {formOpen && !readOnly && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-form-modal-title"
        >
          <form
            onSubmit={handleSaveForm}
            className="app-modal-panel max-w-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="member-form-modal-title" className="text-xl font-bold text-ink">
                {editingMember ? 'Cập nhật hồ sơ đoàn viên' : 'Thêm đoàn viên mới'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Đóng biểu mẫu đoàn viên"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="m-code" className="block text-sm font-bold text-ink mb-1.5">Mã đoàn viên *</label>
                <input
                  id="m-code"
                  required
                  value={form.maDoanVien}
                  onChange={(e) => setForm({ ...form, maDoanVien: e.target.value })}
                  className="app-input font-mono"
                />
              </div>
              <div>
                <label htmlFor="m-name" className="block text-sm font-bold text-ink mb-1.5">Họ và tên *</label>
                <input
                  id="m-name"
                  required
                  value={form.hoTen}
                  onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
                  className="app-input"
                />
              </div>
              <div>
                <label htmlFor="m-phone" className="block text-sm font-bold text-ink mb-1.5">Số điện thoại</label>
                <input
                  id="m-phone"
                  value={form.sdt}
                  onChange={(e) => setForm({ ...form, sdt: e.target.value })}
                  className="app-input font-mono"
                />
              </div>
              <div>
                <label htmlFor="m-role" className="block text-sm font-bold text-ink mb-1.5">Chức vụ</label>
                <select
                  id="m-role"
                  value={form.chucVu}
                  onChange={(e) => setForm({ ...form, chucVu: e.target.value })}
                  className="app-input"
                >
                  <option>Đoàn viên</option>
                  <option>Ủy viên BCH</option>
                  <option>Phó Bí thư</option>
                  <option>Bí thư Chi đoàn</option>
                </select>
              </div>
              <div>
                <label htmlFor="m-status" className="block text-sm font-bold text-ink mb-1.5">Trạng thái cư trú</label>
                <select
                  id="m-status"
                  value={form.trangThai}
                  onChange={(e) => setForm({ ...form, trangThai: e.target.value })}
                  className="app-input"
                >
                  <option>Đang ở địa phương</option>
                  <option>Đi làm xa</option>
                  <option>Chuyển sinh hoạt</option>
                </select>
              </div>
              <div>
                <label htmlFor="m-shift" className="block text-sm font-bold text-ink mb-1.5">Ca làm việc</label>
                <select
                  id="m-shift"
                  value={form.workShift}
                  onChange={(e) => setForm({ ...form, workShift: e.target.value })}
                  className="app-input"
                >
                  <option value="day">Giờ hành chính</option>
                  <option value="rotating_shift">Làm ca xoay KCN</option>
                  <option value="night">Ca đêm KCN</option>
                  <option value="student">Học sinh / Sinh viên</option>
                </select>
              </div>
              <div>
                <label htmlFor="m-hours" className="block text-sm font-bold text-ink mb-1.5">Giờ CTXH khởi tạo</label>
                <input
                  id="m-hours"
                  type="number"
                  min="0"
                  max="500"
                  value={form.gioCtxh}
                  onChange={(e) => setForm({ ...form, gioCtxh: e.target.value })}
                  className="app-input tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="m-job" className="block text-sm font-bold text-ink mb-1.5">Nơi làm việc / Ghi chú</label>
                <input
                  id="m-job"
                  value={form.congViec}
                  onChange={(e) => setForm({ ...form, congViec: e.target.value })}
                  className="app-input"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2.5 text-sm sm:text-[15px] font-semibold text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={form.daDongDoanPhi}
                onChange={(e) => setForm({ ...form, daDongDoanPhi: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              Đã hoàn thành đoàn phí năm 2026
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/80">
              <button type="button" onClick={() => setFormOpen(false)} className="app-btn-secondary">
                Hủy
              </button>
              <button type="submit" className="app-btn-primary">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                {editingMember ? 'Lưu thay đổi' : 'Thêm đoàn viên'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
