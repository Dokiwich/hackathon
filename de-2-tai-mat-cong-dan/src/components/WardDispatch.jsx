import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Clock,
  Wrench,
  MapPin,
  CheckCheck,
  X,
  Eye
} from 'lucide-react';
import { WARDS_95, CATEGORIES, STATUSES, OFFICERS, URGENCY_LEVELS } from '../data/wardsData';

export default function WardDispatch({
  reports,
  onUpdateReport,
  mode = 'dispatch',
  defaultWardId = 'all',
  onOpenMapFocus
}) {
  const [selectedWardId, setSelectedWardId] = useState(defaultWardId || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Popup Modal Phân công & Nghiệm thu
  const [activeModalReport, setActiveModalReport] = useState(null);
  const [officerInput, setOfficerInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [hoursInput, setHoursInput] = useState('3.5');

  useEffect(() => {
    setSelectedWardId(defaultWardId || 'all');
  }, [defaultWardId]);

  const isCompletedMode = mode === 'completed';

  const baseReports = reports.filter((r) =>
    isCompletedMode ? r.status === 'resolved' : r.status !== 'resolved'
  );

  const filtered = baseReports.filter((r) => {
    if (selectedWardId !== 'all' && r.wardId !== selectedWardId) return false;
    if (!isCompletedMode && statusFilter !== 'all' && r.status !== statusFilter) return false;
    const repUrgency = r.urgency || 'medium';
    if (urgencyFilter !== 'all' && repUrgency !== urgencyFilter) return false;
    return true;
  });

  const avgCompletedHours = (() => {
    const withHours = filtered.filter((r) => typeof r.processingHours === 'number');
    if (withHours.length === 0) return 0;
    const sum = withHours.reduce((acc, r) => acc + r.processingHours, 0);
    return Number((sum / withHours.length).toFixed(1));
  })();

  function openDispatchModal(rep) {
    setActiveModalReport(rep);
    setOfficerInput(rep.assignedOfficer || OFFICERS[0]);
    setNoteInput(rep.progressNote || '');
    setHoursInput(rep.processingHours ? String(rep.processingHours) : '3.5');
  }

  function handleSaveDispatch(nextStatus) {
    if (!activeModalReport) return;
    onUpdateReport(activeModalReport.id, {
      status: nextStatus,
      assignedOfficer: officerInput || OFFICERS[0],
      progressNote:
        noteInput.trim() ||
        (nextStatus === 'processing'
          ? 'Đã chỉ đạo tổ công tác trực tiếp xuống hiện trường khắc phục.'
          : 'Đã hoàn tất khắc phục, dọn dẹp và nghiệm thu hiện trường.'),
      processingHours: nextStatus === 'resolved' ? Number(hoursInput) || 3.5 : null
    });
    setActiveModalReport(null);
  }

  return (
    <div className="space-y-5">
      {/* Header thanh lọc: Khung xanh, khi chọn khung xám */}
      <div className="bg-white border-2 border-sky-300 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            {isCompletedMode ? (
              <>
                <CheckCheck className="w-4 h-4 text-sky-600" />
                <span>MỤC HOÀN THÀNH — LƯU TRỮ HỒ SƠ ĐÃ NGHIỆM THU</span>
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4 text-sky-600" />
                <span>PHÂN CÔNG & ĐIỀU PHỐI XỬ LÝ HẠ TẦNG</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCompletedMode
              ? `Đang lưu trữ ${filtered.length} hồ sơ đã giải quyết xong trên địa bàn.`
              : 'Điều phối cán bộ, phân loại theo mức độ khẩn cấp và tiến hành nghiệm thu trực tuyến.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWardId}
            onChange={(e) => setSelectedWardId(e.target.value)}
            className="bg-sky-50/40 border-2 border-sky-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
          >
            <option value="all">Tất cả 95 Xã/Phường ({baseReports.length})</option>
            {WARDS_95.map((w) => (
              <option key={w.id} value={w.id}>
                #{w.code} - {w.name}
              </option>
            ))}
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="bg-sky-50/40 border-2 border-sky-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
          >
            <option value="all">Mọi mức độ</option>
            <option value="urgent">Mức độ: Gấp</option>
            <option value="medium">Mức độ: Vừa</option>
            <option value="slow">Mức độ: Chậm</option>
          </select>

          {!isCompletedMode && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-sky-50/40 border-2 border-sky-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
            >
              <option value="all">Chờ & Đang xử lý</option>
              <option value="pending">Chưa xử lý (Chờ giao việc)</option>
              <option value="processing">Đang thực hiện hiện trường</option>
            </select>
          )}
        </div>
      </div>

      {/* Thẻ tóm tắt khi ở Mục Hoàn Thành */}
      {isCompletedMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-sky-300 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Tổng số hồ sơ hoàn thành
            </span>
            <div className="text-2xl font-extrabold text-slate-950 mt-1">{filtered.length} hồ sơ</div>
          </div>
          <div className="bg-white border-2 border-sky-300 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Thời gian xử lý trung bình
            </span>
            <div className="text-2xl font-extrabold text-sky-700 mt-1">{avgCompletedHours} giờ</div>
          </div>
          <div className="bg-white border-2 border-sky-300 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Hồ sơ mức độ Gấp đã xử lý
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {filtered.filter((r) => (r.urgency || 'medium') === 'urgent').length} hồ sơ
            </div>
          </div>
        </div>
      )}

      {/* Danh sách thẻ hồ sơ */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-sky-300 rounded-2xl p-10 text-center text-xs text-slate-500 shadow-sm">
          Không có phản ánh nào phù hợp với điều kiện lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((rep) => {
            const st = STATUSES[rep.status] || STATUSES.pending;
            const cat = CATEGORIES.find((c) => c.id === rep.categoryId) || CATEGORIES[0];
            const urg = URGENCY_LEVELS[rep.urgency || 'medium'] || URGENCY_LEVELS.medium;

            return (
              <div
                key={rep.id}
                className={`bg-white border-2 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-sm transition ${
                  activeModalReport?.id === rep.id
                    ? 'border-slate-500 bg-slate-50'
                    : 'border-sky-300 hover:border-slate-500 hover:shadow-md'
                }`}
              >
                {/* Ảnh hiện trường */}
                <div className="md:col-span-4 bg-slate-950 relative min-h-[200px]">
                  <img
                    src={rep.photoUrl}
                    alt={rep.title}
                    className="w-full h-full object-contain max-h-56 mx-auto"
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 text-white font-mono text-[11px] px-2 py-0.5 rounded">
                    #{rep.id}
                  </span>
                  <span className="absolute bottom-3 left-3 bg-sky-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow">
                    MỨC ĐỘ: {urg.label}
                  </span>
                </div>

                {/* Nội dung chi tiết & Nút bấm thao tác */}
                <div className="md:col-span-8 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${st.badgeClass}`}>
                          {st.label}
                        </span>
                        <span className="text-[10px] font-mono text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded font-bold">
                          {rep.wardName}
                        </span>
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {rep.categoryId === 'other' && rep.customCategoryName ? rep.customCategoryName : cat.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {rep.history?.[0]?.time}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-950">{rep.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{rep.description}</p>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        {rep.addressNote}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                        Cán bộ: <strong className="text-slate-900">{rep.assignedOfficer || 'Chưa phân công'}</strong>
                      </span>
                      {rep.processingHours && (
                        <span className="flex items-center gap-1.5 text-sky-900 font-mono font-bold">
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          Hoàn tất trong: {rep.processingHours}h
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700">
                      <strong className="text-slate-900">Tiến độ ghi nhận:</strong> {rep.progressNote}
                    </div>
                  </div>

                  {/* Thanh nút bấm chức năng */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500">
                      Người gửi: <span className="text-slate-800 font-semibold">{rep.reporterName || 'Công dân'}</span>
                      {rep.reporterPhone && ` (${rep.reporterPhone})`}
                    </div>

                    <div className="flex items-center gap-2">
                      {onOpenMapFocus && (
                        <button
                          type="button"
                          onClick={() => onOpenMapFocus(rep.id)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-sky-50 border border-slate-300 hover:border-sky-300 text-slate-800 hover:text-sky-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem bản đồ
                        </button>
                      )}

                      {!isCompletedMode && (
                        <button
                          type="button"
                          onClick={() => openDispatchModal(rep)}
                          className="px-4 py-2 bg-slate-900 hover:bg-sky-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition flex items-center gap-1.5 shadow"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Phân Công / Nghiệm Thu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP MODAL ĐIỀU PHỐI VÀ NGHIỆM THU */}
      {activeModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-slate-900 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4">
            <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider">
                  HỒ SƠ #{activeModalReport.id}
                </span>
                <h3 className="text-sm font-bold mt-0.5">
                  Phân Công Cán Bộ & Cập Nhật Tiến Độ Nghiệm Thu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-sky-50 p-3.5 rounded-xl border border-sky-200 space-y-1">
                <div className="text-slate-950 font-bold">{activeModalReport.title}</div>
                <div className="text-slate-600">
                  Địa bàn: {activeModalReport.wardName} • Mức độ:{' '}
                  <span className="text-sky-900 font-bold font-mono">
                    {URGENCY_LEVELS[activeModalReport.urgency || 'medium']?.label}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cán bộ chuyên trách xử lý
                </label>
                <select
                  value={officerInput}
                  onChange={(e) => setOfficerInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-sky-500 transition"
                >
                  {OFFICERS.map((off) => (
                    <option key={off} value={off}>
                      {off}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Thời gian thực hiện (giờ - áp dụng khi nghiệm thu)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nội dung chỉ đạo / Biên bản nghiệm thu hiện trường
                </label>
                <textarea
                  rows={3}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Nhập nội dung phân công hoặc kết quả nghiệm thu khắc phục..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveModalReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={() => handleSaveDispatch('processing')}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-400"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Chuyển "Đang Xử Lý"</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveDispatch('resolved')}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition flex items-center gap-1.5 shadow"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Nghiệm Thu Hoàn Thành</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
