import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  RefreshCw,
  Plus,
  MapPin,
  Download,
  Copy,
  Lock,
  CheckCircle2,
  X,
  ArrowRight,
  CalendarClock,
  AlertCircle
} from 'lucide-react';
import { buildAttendanceShareUrl } from '../../utils/qrToken';
import { DEFAULT_VENUE_COORDS, requestBrowserPosition } from '../../utils/gpsVerify';
import { formatDateVN } from '../../shared/utils/format';
import GeofenceRadarCard from '../../shared/components/GeofenceRadarCard';

function formatLocalDateTimeInput(ms) {
  const d = new Date(ms);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function formatClockTime(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

const ACTIVITY_TYPE_LABELS = {
  volunteer: 'Tình nguyện CTXH',
  regular_meeting: 'Sinh hoạt định kỳ',
  makeup_meeting: 'Sinh hoạt bù ca KCN'
};

export default function QrOrganizerView({
  activities = [],
  members = [],
  makeupList = [],
  isOnline = false,
  onRefresh,
  onAddActivity,
  onRotateQr,
  onUpdateLocation,
  onCloseActivity,
  onDeleteActivity,
  onReviewMakeup
}) {
  const [filterTab, setFilterTab] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [toastText, setToastText] = useState('');
  const [formError, setFormError] = useState('');
  const [gpsStatus, setGpsStatus] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [relocatingGps, setRelocatingGps] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const [newEvent, setNewEvent] = useState(() => {
    const now = Date.now();
    return {
      tenHoatDong: '',
      diaDiem: '',
      activityType: 'volunteer',
      startsInput: formatLocalDateTimeInput(now - 60000),
      endsInput: formatLocalDateTimeInput(now + 2 * 60 * 60 * 1000),
      gioCongTacXaHoi: 4,
      latitude: DEFAULT_VENUE_COORDS.latitude.toFixed(6),
      longitude: DEFAULT_VENUE_COORDS.longitude.toFixed(6),
      geofenceRadiusM: 150
    };
  });

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isOnline || !activeId || !onRefresh) return undefined;
    const poll = setInterval(() => {
      if (!document.hidden) onRefresh();
    }, 10000);
    return () => clearInterval(poll);
  }, [isOnline, activeId, onRefresh]);

  const filteredActivities = useMemo(() => {
    if (filterTab === 'open') return activities.filter((a) => !a.isClosed);
    if (filterTab === 'closed') return activities.filter((a) => a.isClosed);
    return activities;
  }, [activities, filterTab]);

  const currentActivity = useMemo(
    () => (activeId ? activities.find((a) => a.id === activeId) || null : null),
    [activities, activeId]
  );

  const session = currentActivity?.qrSession || null;
  const shareUrl = useMemo(() => {
    if (!currentActivity || !session) return '';
    return buildAttendanceShareUrl(currentActivity.id, session.token || session.code);
  }, [currentActivity, session]);

  useEffect(() => {
    if (!shareUrl) {
      setQrUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(shareUrl, {
      width: 240,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const showNotice = (msg) => {
    setToastText(msg);
    setTimeout(() => setToastText(''), 3500);
  };

  const handleGetVenueGps = async () => {
    setGpsLoading(true);
    setGpsStatus('Đang lấy tọa độ GPS...');
    try {
      const pos = await requestBrowserPosition();
      const acc = Math.ceil(pos.accuracy || 0);
      setNewEvent((prev) => ({
        ...prev,
        latitude: pos.latitude.toFixed(6),
        longitude: pos.longitude.toFixed(6),
        geofenceRadiusM:
          acc > 100 && Number(prev.geofenceRadiusM) < Math.min(5000, acc + 80)
            ? Math.min(5000, Math.max(200, acc + 80))
            : prev.geofenceRadiusM
      }));
      setGpsStatus(`Đã lấy vị trí thực tế (sai số ±${acc}m).`);
    } catch (err) {
      setGpsStatus(`${err.message} Đang giữ tọa độ mặc định.`);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleMoveCenterToHere = async () => {
    if (!currentActivity || !onUpdateLocation) return;
    setRelocatingGps(true);
    try {
      const pos = await requestBrowserPosition();
      const acc = Math.ceil(pos.accuracy || 20);
      const nextRadius = Math.max(
        Number(currentActivity.geofenceRadiusM || 200),
        Math.min(2500, Math.max(200, acc + 120))
      );
      await onUpdateLocation(currentActivity.id, {
        latitude: Number(pos.latitude.toFixed(6)),
        longitude: Number(pos.longitude.toFixed(6)),
        geofenceRadiusM: nextRadius
      });
      showNotice(
        `Đã dời tâm GPS sự kiện về vị trí hiện tại của bạn (bán kính ${nextRadius}m) — quét GPS thực tế được ngay!`
      );
    } catch (err) {
      showNotice(err.message || 'Không lấy được tọa độ GPS hiện tại.');
    } finally {
      setRelocatingGps(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newEvent.tenHoatDong.trim() || !newEvent.diaDiem.trim()) return;
    const startsAt = new Date(newEvent.startsInput).getTime();
    const endsAt = new Date(newEvent.endsInput).getTime();
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) {
      setFormError('Giờ kết thúc phải sau giờ mở điểm danh.');
      return;
    }
    setBusyAction(true);
    try {
      const localId = `ACT-WARD-${Date.now().toString().slice(-4)}`;
      const payload = {
        id: localId,
        tenHoatDong: newEvent.tenHoatDong.trim(),
        activityType: newEvent.activityType,
        ngayToChuc: newEvent.startsInput.slice(0, 10),
        khungGio: `${newEvent.startsInput.slice(11, 16)} - ${newEvent.endsInput.slice(11, 16)}`,
        diaDiem: newEvent.diaDiem.trim(),
        latitude: Number(newEvent.latitude),
        longitude: Number(newEvent.longitude),
        geofenceRadiusM: Math.min(5000, Math.max(25, Number(newEvent.geofenceRadiusM || 150))),
        startsAt,
        endsAt,
        gioCongTacXaHoi: Number(newEvent.gioCongTacXaHoi || 4),
        trangThai: 'Đang điểm danh',
        isClosed: false,
        checkedInRecords: []
      };
      const created = await onAddActivity(payload);
      setActiveId(created?.id || localId);
      setShowCreateForm(false);
      setGpsStatus('');
      setNewEvent((prev) => ({ ...prev, tenHoatDong: '', diaDiem: '' }));
      showNotice('Đã tạo sự kiện và phát mã QR ký số gắn tọa độ GPS.');
    } catch (err) {
      setFormError(err.message || 'Không thể tạo sự kiện.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showNotice('Đã sao chép link điểm danh gửi Bí thư & Đoàn viên.');
    } catch {
      showNotice(`Link: ${shareUrl}`);
    }
  };

  const handleDownloadQr = () => {
    if (!qrUrl || !currentActivity) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR-${currentActivity.id}.png`;
    a.click();
  };

  const isExpired = Boolean(
    (session?.expiresAt && nowTick > session.expiresAt) ||
      (currentActivity?.endsAt && nowTick > currentActivity.endsAt)
  );
  const isClosed = Boolean(currentActivity?.isClosed);
  const isActive = Boolean(currentActivity && session && !isClosed && !isExpired);
  const attendees = currentActivity?.checkedInRecords || [];
  const lat = Number(currentActivity?.latitude ?? DEFAULT_VENUE_COORDS.latitude);
  const lon = Number(currentActivity?.longitude ?? DEFAULT_VENUE_COORDS.longitude);
  const radiusM = Number(currentActivity?.geofenceRadiusM || 150);

  const openCount = activities.filter((a) => !a.isClosed).length;
  const closedCount = activities.filter((a) => a.isClosed).length;

  return (
    <div className="space-y-5">
      <section className="app-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A2B49]">
              Điều phối Sự kiện &amp; Mã QR GPS
            </h1>
            <p className="text-sm sm:text-[15px] text-slate-600 mt-1">
              Phát mã QR ký số 2 lớp kèm bán kính GPS cho Bí thư &amp; Đoàn viên quét trực tiếp.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setShowCreateForm(true);
            }}
            className="app-btn-primary shrink-0"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            Tạo sự kiện &amp; QR
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {[
            { id: 'all', label: `Tất cả (${activities.length})` },
            { id: 'open', label: `Đang mở QR (${openCount})` },
            { id: 'closed', label: `Đã hoàn thành (${closedCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`min-h-[40px] px-4 py-2 rounded-full text-sm font-semibold border transition shrink-0 tabular-nums ${
                filterTab === tab.id
                  ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {toastText && (
        <div role="status" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Event Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredActivities.map((act) => {
          const closed = Boolean(act.isClosed);
          const count = (act.checkedInRecords || []).length;
          const hasValidQr = Boolean(!closed && act.qrSession && nowTick <= act.qrSession.expiresAt);
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => setActiveId(act.id)}
              className="text-left app-card-interactive p-5 sm:p-6 flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${
                      closed
                        ? 'bg-slate-100 border-slate-300 text-slate-600'
                        : hasValidQr
                          ? 'bg-emerald-50 border-emerald-200 text-accent'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}
                  >
                    {closed ? 'Đã hoàn thành' : hasValidQr ? 'Đang mở QR' : 'Chờ cấp mã mới'}
                  </span>
                  <span className="font-mono text-sm text-muted tabular-nums">
                    {act.geofenceRadiusM || 150}m • +{act.gioCongTacXaHoi}h
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#005BAC]">
                  {ACTIVITY_TYPE_LABELS[act.activityType] || 'Hoạt động Đoàn'} • {act.chiDoan || 'Cấp cơ sở'}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#1A2B49] group-hover:text-[#005BAC] line-clamp-2 leading-snug">
                  {act.tenHoatDong}
                </h2>
                <div className="text-sm text-slate-600 truncate flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#005BAC]/80 shrink-0" aria-hidden="true" />
                  <span className="truncate">{act.diaDiem}</span>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-200/80 flex items-center justify-between text-sm tabular-nums">
                <span className="font-mono text-muted">{formatDateVN(act.ngayToChuc)}</span>
                <span className="font-bold text-[#005BAC] inline-flex items-center gap-1.5">
                  {count} lượt điểm danh <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Cross-Role Shift-Worker Makeup Registrations Overview */}
      {makeupList.length > 0 && (
        <section className="app-card p-6 space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1A2B49] flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-[#005BAC]" aria-hidden="true" />
              Đăng ký Sinh hoạt bù từ Đoàn viên làm ca KCN ({makeupList.length})
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Liên kết trực tiếp với tài khoản Đoàn viên và Bí thư Chi đoàn.
            </p>
          </div>

          <div className="divide-y divide-slate-200/80">
            {makeupList.map((item) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm sm:text-[15px]">
                <div className="space-y-1 min-w-0">
                  <div className="font-bold text-ink">
                    {item.memberName} <span className="font-mono text-muted">({item.memberCode} • {item.branchName})</span>
                  </div>
                  <div className="text-slate-600 truncate">
                    Lý do: <strong className="text-ink">{item.shiftReason}</strong> → Bù tại: {item.makeupActivityTitle}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'pending' && onReviewMakeup ? (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          await onReviewMakeup(item.id, 'approved');
                          showNotice(`Đã duyệt sinh hoạt bù cho ${item.memberName}.`);
                        }}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-accent text-white text-sm font-semibold"
                      >
                        Duyệt bù
                      </button>
                      <button
                        type="button"
                        onClick={() => onReviewMakeup(item.id, 'rejected')}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold"
                      >
                        Từ chối
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${
                        item.status === 'approved'
                          ? 'bg-emerald-50 border-emerald-200 text-accent'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}
                    >
                      {item.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Event + QR + GPS Detail Sheet/Modal */}
      {currentActivity && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="org-detail-title"
        >
          <div className="app-modal-panel max-w-4xl p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${
                    isClosed
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : isActive
                        ? 'bg-emerald-50 border-emerald-200 text-accent'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {isClosed ? 'Đã đóng điểm danh' : isActive ? 'Đang mở điểm danh QR + GPS' : 'Cần cấp mới phiên QR'}
                </span>
                <h2 id="org-detail-title" className="text-xl font-bold text-ink mt-2">
                  {currentActivity.tenHoatDong}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  {currentActivity.diaDiem} • {formatDateVN(currentActivity.ngayToChuc)} ({currentActivity.khungGio})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                aria-label="Đóng chi tiết sự kiện"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center text-muted hover:text-ink shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-w-0">
              {/* Left: QR Image + Action Controls */}
              <div className="md:col-span-5 min-w-0 flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border border-dashed border-[#005BAC]/60 bg-slate-50/80 space-y-3.5">
                {isActive && qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`Mã QR ${currentActivity.tenHoatDong}`}
                    className="w-52 h-52 rounded-xl bg-white p-2 border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="w-52 h-52 rounded-xl bg-surface border border-slate-200 flex flex-col items-center justify-center gap-2.5 text-muted">
                    <QrCode className="w-10 h-10 text-[#005BAC]/60" aria-hidden="true" />
                    <span className="text-sm px-4">
                      {isClosed ? 'Sự kiện đã kết thúc' : 'Bấm "Đổi QR · 15p" để phát mã ký số mới'}
                    </span>
                  </div>
                )}

                {session && (
                  <div className="text-xs sm:text-sm font-mono text-ink bg-surface border border-slate-200 px-3.5 py-1.5 rounded-full tabular-nums">
                    MÃ: <strong>{session.code}</strong> • Hết hạn {formatClockTime(session.expiresAt)}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    disabled={!isActive}
                    onClick={handleDownloadQr}
                    className="app-btn-secondary min-h-[44px] px-2.5 text-sm whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 shrink-0" aria-hidden="true" /> Tải QR
                  </button>
                  <button
                    type="button"
                    disabled={!isActive}
                    onClick={handleCopyShareLink}
                    className="app-btn-secondary min-h-[44px] px-2.5 text-sm whitespace-nowrap"
                  >
                    <Copy className="w-4 h-4 shrink-0" aria-hidden="true" /> Copy link
                  </button>
                  <button
                    type="button"
                    disabled={isClosed || busyAction}
                    onClick={async () => {
                      setBusyAction(true);
                      try {
                        await onRotateQr(currentActivity.id, 900);
                        showNotice('Đã phát mã QR mới ký số HMAC (hiệu lực 15 phút).');
                      } finally {
                        setBusyAction(false);
                      }
                    }}
                    className="min-h-[44px] px-2.5 py-2 rounded-xl border border-[#005BAC] bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sm font-semibold text-[#005BAC] inline-flex items-center justify-center gap-1.5 transition whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" /> Đổi QR · 15p
                  </button>
                  <button
                    type="button"
                    disabled={isClosed || busyAction}
                    onClick={() => setConfirmCloseOpen(true)}
                    className="min-h-[44px] px-2.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-sm font-semibold text-rose-700 inline-flex items-center justify-center gap-1.5 transition whitespace-nowrap"
                  >
                    <Lock className="w-4 h-4 shrink-0" aria-hidden="true" /> Đóng QR
                  </button>
                </div>
              </div>

              {/* Right: Visual Geofence Radar + Live Attendees */}
              <div className="md:col-span-7 min-w-0 space-y-4">
                <GeofenceRadarCard
                  latitude={lat}
                  longitude={lon}
                  radiusM={radiusM}
                  locationLabel={currentActivity.diaDiem}
                />

                {!isClosed && onUpdateLocation && (
                  <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-xl bg-sky-50/80 border border-sky-200/90">
                    <button
                      type="button"
                      disabled={relocatingGps}
                      onClick={handleMoveCenterToHere}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#005BAC] hover:bg-[#004A8F] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 transition"
                    >
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      {relocatingGps ? 'Đang lấy vị trí...' : 'Dời tâm GPS về vị trí của tôi'}
                    </button>
                    <button
                      type="button"
                      disabled={relocatingGps}
                      onClick={async () => {
                        setRelocatingGps(true);
                        try {
                          await onUpdateLocation(currentActivity.id, {
                            latitude: lat,
                            longitude: lon,
                            geofenceRadiusM: 2000
                          });
                          showNotice('Đã mở rộng bán kính sự kiện lên 2.000m.');
                        } finally {
                          setRelocatingGps(false);
                        }
                      }}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-[#005BAC]/50 text-sm font-semibold text-ink transition"
                    >
                      Mở rộng bán kính 2km
                    </button>
                  </div>
                )}
                {onDeleteActivity && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={async () => {
                        setBusyAction(true);
                        try {
                          await onDeleteActivity(currentActivity.id);
                          setActiveId(null);
                          showNotice('Đã xóa sự kiện khỏi hệ thống.');
                        } finally {
                          setBusyAction(false);
                        }
                      }}
                      className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline py-1"
                    >
                      Xóa sự kiện này
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-ink tabular-nums">
                      Đã điểm danh hợp lệ ({attendees.length} lượt)
                    </h3>
                    {isOnline && onRefresh && (
                      <button
                        type="button"
                        onClick={onRefresh}
                        className="text-sm font-semibold text-[#005BAC] hover:underline"
                      >
                        Đồng bộ ngay
                      </button>
                    )}
                  </div>

                  {attendees.length === 0 ? (
                    <p className="text-sm text-muted py-5 text-center">
                      Chưa có Bí thư hay Đoàn viên nào điểm danh.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-200/80 max-h-[250px] overflow-y-auto pr-1">
                      {attendees.map((rec, idx) => {
                        const m = memberMap.get(rec.memberId);
                        return (
                          <div key={`${rec.memberId}-${idx}`} className="py-3 flex items-center justify-between gap-2 text-sm">
                            <div className="min-w-0">
                              <div className="font-bold text-ink truncate">{m?.hoTen || rec.memberId}</div>
                              <div className="font-mono text-xs sm:text-sm text-muted">
                                {m?.chiDoan || 'Đoàn viên'} • {rec.checkedInAt}
                              </div>
                            </div>
                            <span className="font-mono text-xs sm:text-sm text-accent font-semibold shrink-0 tabular-nums">
                              {rec.distanceM !== null && rec.distanceM !== undefined
                                ? `${rec.distanceM}m · ±${rec.accuracyM || 15}m`
                                : rec.method}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event + GPS Modal */}
      {showCreateForm && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-qr-event-title"
        >
          <form
            onSubmit={handleCreateSubmit}
            className="app-modal-panel max-w-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id="create-qr-event-title" className="text-xl font-bold text-ink">
                Tạo sự kiện &amp; phát mã QR GPS
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                aria-label="Đóng biểu mẫu sự kiện"
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
              <div className="sm:col-span-2">
                <label htmlFor="org-title" className="block text-sm font-bold text-ink mb-1.5">Tên sự kiện *</label>
                <input
                  id="org-title"
                  required
                  value={newEvent.tenHoatDong}
                  onChange={(e) => setNewEvent({ ...newEvent, tenHoatDong: e.target.value })}
                  placeholder="VD: Ngày hội Thanh niên tình nguyện"
                  className="app-input"
                />
              </div>
              <div>
                <label htmlFor="org-type" className="block text-sm font-bold text-ink mb-1.5">Loại hoạt động</label>
                <select
                  id="org-type"
                  value={newEvent.activityType}
                  onChange={(e) => setNewEvent({ ...newEvent, activityType: e.target.value })}
                  className="app-input"
                >
                  <option value="volunteer">Tình nguyện CTXH</option>
                  <option value="regular_meeting">Sinh hoạt định kỳ</option>
                  <option value="makeup_meeting">Sinh hoạt bù ca KCN</option>
                </select>
              </div>
              <div>
                <label htmlFor="org-place" className="block text-sm font-bold text-ink mb-1.5">Địa điểm *</label>
                <input
                  id="org-place"
                  required
                  value={newEvent.diaDiem}
                  onChange={(e) => setNewEvent({ ...newEvent, diaDiem: e.target.value })}
                  placeholder="VD: Hội trường Nhà văn hóa"
                  className="app-input"
                />
              </div>
              <div>
                <label htmlFor="org-start" className="block text-sm font-bold text-ink mb-1.5">Mở điểm danh</label>
                <input
                  id="org-start"
                  type="datetime-local"
                  required
                  value={newEvent.startsInput}
                  onChange={(e) => setNewEvent({ ...newEvent, startsInput: e.target.value })}
                  className="app-input text-sm font-mono"
                />
              </div>
              <div>
                <label htmlFor="org-end" className="block text-sm font-bold text-ink mb-1.5">Kết thúc</label>
                <input
                  id="org-end"
                  type="datetime-local"
                  required
                  value={newEvent.endsInput}
                  onChange={(e) => setNewEvent({ ...newEvent, endsInput: e.target.value })}
                  className="app-input text-sm font-mono"
                />
              </div>
              <div>
                <label htmlFor="org-hours" className="block text-sm font-bold text-ink mb-1.5">Giờ CTXH / Điểm thi đua</label>
                <input
                  id="org-hours"
                  type="number"
                  min="1"
                  max="48"
                  value={newEvent.gioCongTacXaHoi}
                  onChange={(e) => setNewEvent({ ...newEvent, gioCongTacXaHoi: e.target.value })}
                  className="app-input tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="org-radius" className="block text-sm font-bold text-ink mb-1.5">Bán kính GPS (m)</label>
                <input
                  id="org-radius"
                  type="number"
                  min="25"
                  max="5000"
                  required
                  value={newEvent.geofenceRadiusM}
                  onChange={(e) => setNewEvent({ ...newEvent, geofenceRadiusM: e.target.value })}
                  className="app-input font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="app-subcard p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#005BAC]" aria-hidden="true" /> Tâm tọa độ GPS
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={gpsLoading}
                    onClick={handleGetVenueGps}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#005BAC] bg-sky-50 text-[#005BAC] text-sm font-semibold"
                  >
                    {gpsLoading ? 'Đang lấy...' : 'Vị trí hiện tại'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewEvent((prev) => ({
                        ...prev,
                        latitude: DEFAULT_VENUE_COORDS.latitude.toFixed(6),
                        longitude: DEFAULT_VENUE_COORDS.longitude.toFixed(6)
                      }));
                      setGpsStatus('Đã chọn tọa độ mẫu.');
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-surface text-sm font-semibold text-ink"
                  >
                    Tọa độ mẫu
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  id="org-lat"
                  name="latitude"
                  aria-label="Vĩ độ"
                  type="number"
                  step="any"
                  required
                  value={newEvent.latitude}
                  onChange={(e) => setNewEvent({ ...newEvent, latitude: e.target.value })}
                  className="app-input text-sm font-mono"
                />
                <input
                  id="org-lon"
                  name="longitude"
                  aria-label="Kinh độ"
                  type="number"
                  step="any"
                  required
                  value={newEvent.longitude}
                  onChange={(e) => setNewEvent({ ...newEvent, longitude: e.target.value })}
                  className="app-input text-sm font-mono"
                />
              </div>
              {gpsStatus && <p className="text-sm text-muted">{gpsStatus}</p>}
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="app-btn-secondary"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busyAction}
                className="app-btn-primary"
              >
                {busyAction ? 'Đang tạo...' : 'Tạo sự kiện & phát QR'}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmCloseOpen && currentActivity && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="app-modal-panel max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-ink">Đóng điểm danh sự kiện này?</h3>
            <p className="text-sm text-slate-600">
              Mã QR sẽ hết hiệu lực ngay lập tức. Toàn bộ số liệu đã điểm danh được bảo lưu.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmCloseOpen(false)}
                className="app-btn-secondary"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onCloseActivity(currentActivity.id);
                  setConfirmCloseOpen(false);
                  showNotice('Đã đóng điểm danh sự kiện.');
                }}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition"
              >
                Đóng điểm danh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
