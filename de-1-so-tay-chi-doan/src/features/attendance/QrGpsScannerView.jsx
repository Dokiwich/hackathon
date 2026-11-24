import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Link2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  QrCode,
  X,
  Clock,
  Users,
  ArrowRight,
  CalendarClock
} from 'lucide-react';
import {
  buildAttendanceShareUrl,
  parseAttendanceQrInput,
  verifyDynamicQrCode
} from '../../utils/qrToken';
import {
  isEmbeddedWebView,
  requestBrowserPosition,
  verifyGpsPosition
} from '../../utils/gpsVerify';
import { formatDateVN } from '../../shared/utils/format';
import GeofenceRadarCard from '../../shared/components/GeofenceRadarCard';

export default function QrGpsScannerView({
  activities = [],
  members = [],
  makeupList = [],
  currentUser,
  isOnline = false,
  onRefresh,
  onVerifyQrServer,
  onCheckIn,
  onRegisterMakeup,
  onReviewMakeup,
  canViewBranchProgress = false,
  canApproveMakeup = false
}) {
  const scannerRef = useRef(null);
  const cameraRunRef = useRef(0);

  const [activeTab, setActiveTab] = useState('scan');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('Đưa camera vào mã QR sự kiện để điểm danh.');
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteInput, setPasteInput] = useState('');

  const [scannedTarget, setScannedTarget] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [errorBox, setErrorBox] = useState(null);
  const [makeupSuccess, setMakeupSuccess] = useState('');

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [branchModalActId, setBranchModalActId] = useState(null);

  const selfMemberId = currentUser?.memberId || 'DV-KP5-002';

  const openEvents = useMemo(
    () => activities.filter((a) => !a.isClosed && a.qrSession),
    [activities]
  );

  const missedMeetingOptions = useMemo(
    () => activities.filter((a) => a.isClosed || a.activityType === 'regular_meeting'),
    [activities]
  );

  const makeupSessionOptions = useMemo(
    () => activities.filter((a) => !a.isClosed),
    [activities]
  );

  const [missedActId, setMissedActId] = useState('');
  const [makeupActId, setMakeupActId] = useState('');
  const [shiftReason, setShiftReason] = useState('Trùng ca 2 tại KCN (14:00 - 22:00)');
  const [makeupBusy, setMakeupBusy] = useState(false);

  useEffect(() => {
    if (!missedActId && missedMeetingOptions[0]) {
      setMissedActId(missedMeetingOptions[0].id);
    }
    if (!makeupActId && makeupSessionOptions[0]) {
      const preferred =
        makeupSessionOptions.find((a) => a.activityType === 'makeup_meeting') ||
        makeupSessionOptions[0];
      if (preferred) setMakeupActId(preferred.id);
    }
  }, [missedMeetingOptions, makeupSessionOptions, missedActId, makeupActId]);

  const activeActivity = useMemo(
    () => activities.find((a) => a.id === scannedTarget?.activityId) || scannedTarget?.serverActivity || null,
    [activities, scannedTarget]
  );

  const stopCamera = useCallback(async () => {
    cameraRunRef.current += 1;
    const instance = scannerRef.current;
    scannerRef.current = null;
    setCameraActive(false);
    if (instance) {
      try {
        await instance.stop();
      } catch {
        // ignore stop errors
      }
      try {
        instance.clear();
      } catch {
        // ignore clear errors
      }
    }
  }, []);

  const acceptQrText = useCallback(
    async (rawText) => {
      const parsed = parseAttendanceQrInput(rawText);
      if (!parsed) {
        setErrorBox({ message: 'Không đọc được định dạng mã QR điểm danh.' });
        return;
      }

      if (isOnline && parsed.token && onVerifyQrServer) {
        try {
          const verified = await onVerifyQrServer(parsed.token, parsed.activityId);
          if (verified?.valid && verified.activity) {
            await stopCamera();
            setErrorBox(null);
            setReceipt(null);
            setScannedTarget({
              activityId: verified.activity.id,
              code: parsed.code,
              token: verified.token,
              serverActivity: verified.activity
            });
            return;
          }
        } catch (err) {
          setErrorBox({ message: err.message || 'Mã QR không hợp lệ hoặc đã hết hạn.' });
          return;
        }
      }

      const matched = parsed.activityId
        ? activities.find((a) => a.id === parsed.activityId)
        : activities.find((a) => !a.isClosed && a.qrSession?.code === parsed.code);

      if (!matched) {
        if (isOnline && onRefresh) await onRefresh();
        setErrorBox({ message: 'Không tìm thấy sự kiện tương ứng với mã QR vừa quét.' });
        return;
      }

      if (matched.isClosed) {
        setErrorBox({ message: 'Sự kiện này đã đóng điểm danh.' });
        return;
      }

      const tokenCheck = verifyDynamicQrCode(
        parsed.token || parsed.code,
        matched.qrSession
      );
      if (!tokenCheck.valid) {
        setErrorBox({ message: tokenCheck.reason });
        return;
      }

      await stopCamera();
      setErrorBox(null);
      setReceipt(null);
      setScannedTarget({
        activityId: matched.id,
        code: parsed.code,
        token: parsed.token || matched.qrSession?.token || parsed.code
      });
    },
    [activities, isOnline, onVerifyQrServer, onRefresh, stopCamera]
  );

  useEffect(() => {
    const checkHash = () => {
      if (typeof window !== 'undefined' && window.location.hash.startsWith('#diem-danh=')) {
        acceptQrText(window.location.href);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    const onVisibility = () => {
      if (document.hidden) stopCamera();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      document.removeEventListener('visibilitychange', onVisibility);
      stopCamera();
    };
  }, [acceptQrText, stopCamera]);

  const startCamera = async () => {
    if (scannerRef.current) return;
    setErrorBox(null);
    setReceipt(null);
    setScannedTarget(null);

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setErrorBox({
        message: 'Trình duyệt chỉ cho phép mở Camera trên kết nối bảo mật HTTPS hoặc localhost.'
      });
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorBox({
        message: isEmbeddedWebView()
          ? 'Trình duyệt trong Zalo/Messenger hạn chế Camera. Hãy bấm dấu ⋯ góc phải chọn "Mở bằng trình duyệt" (Chrome/Safari) hoặc dùng nút Tải ảnh QR.'
          : 'Thiết bị hoặc trình duyệt hiện tại không hỗ trợ mở Camera trực tiếp. Hãy dùng nút Tải ảnh QR hoặc Dán link.'
      });
      return;
    }

    const runId = ++cameraRunRef.current;
    setCameraStatus('Đang yêu cầu quyền Camera...');
    setCameraActive(true);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      if (cameraRunRef.current !== runId) return;
      const instance = new Html5Qrcode('qr-camera-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });
      scannerRef.current = instance;

      const scanConfig = {
        fps: 10,
        qrbox: (w, h) => {
          const edge = Math.max(140, Math.floor(Math.min(w, h) * 0.72));
          return { width: edge, height: edge };
        }
      };
      const onScanSuccess = (decodedText) => {
        if (cameraRunRef.current === runId) {
          acceptQrText(decodedText);
        }
      };

      try {
        await instance.start({ facingMode: 'environment' }, scanConfig, onScanSuccess, () => {});
      } catch {
        try {
          await instance.start({ facingMode: 'user' }, scanConfig, onScanSuccess, () => {});
        } catch (secondErr) {
          const devices = await Html5Qrcode.getCameras().catch(() => []);
          if (!devices || devices.length === 0) throw secondErr;
          await instance.start(devices[0].id, scanConfig, onScanSuccess, () => {});
        }
      }

      if (cameraRunRef.current !== runId) {
        await instance.stop();
        return;
      }
      setCameraStatus('Đưa mã QR vào khung hình.');
    } catch (err) {
      scannerRef.current = null;
      setCameraActive(false);
      const errStr = String(err?.name || err?.message || err || '');
      let helpMsg =
        'Chưa mở được Camera. Hãy bấm biểu tượng ổ khóa trên thanh địa chỉ chọn Cho phép Camera, hoặc dùng nút Tải ảnh QR / Dán link.';
      if (isEmbeddedWebView()) {
        helpMsg =
          'Bạn đang mở trong Zalo/Messenger nên bị chặn quyền Camera. Hãy bấm dấu ⋯ góc trên chọn "Mở bằng trình duyệt" (Chrome/Safari) hoặc bấm "Tải ảnh QR".';
      } else if (/NotFound|DevicesNotFound/i.test(errStr)) {
        helpMsg =
          'Máy tính/thiết bị không có webcam hoạt động. Bạn có thể bấm "Tải ảnh QR" hoặc chạm trực tiếp vào sự kiện đang mở bên dưới.';
      } else if (/NotAllowed|Permission/i.test(errStr)) {
        helpMsg =
          'Trình duyệt chưa thể cấp quyền Camera: nếu dùng Android hãy tắt bong bóng chat Messenger/Zalo nổi trên màn hình rồi bấm lại; hoặc vào biểu tượng ổ khóa thanh địa chỉ chọn Cho phép Camera.';
      }
      setErrorBox({ message: helpMsg });
    }
  };

  const handleScanImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await stopCamera();
    setErrorBox(null);
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const instance = new Html5Qrcode('qr-file-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });
      const text = await instance.scanFile(file, false);
      instance.clear();
      await acceptQrText(text);
    } catch {
      setErrorBox({
        message: 'Ảnh chưa đọc được mã QR. Vui lòng chọn ảnh rõ nét.'
      });
    } finally {
      e.target.value = '';
    }
  };

  const verifyAndSubmitAttendance = async (mockPosition = null) => {
    if (!activeActivity || !scannedTarget || gpsBusy) return;
    setGpsBusy(true);
    setErrorBox(null);

    try {
      const pos = mockPosition || (await requestBrowserPosition());

      const localGpsCheck = verifyGpsPosition(activeActivity, pos);
      if (!localGpsCheck.valid) {
        setErrorBox({
          message: localGpsCheck.reason,
          distance: localGpsCheck.distance,
          accuracy: localGpsCheck.accuracy,
          radius: localGpsCheck.radius
        });
        return;
      }

      if (isOnline && (scannedTarget.token || activeActivity.qrSession?.token)) {
        const res = await onCheckIn(
          activeActivity.id,
          selfMemberId,
          'QR + GPS',
          { token: scannedTarget.token || activeActivity.qrSession.token },
          pos
        );
        setReceipt({
          activityTitle: activeActivity.tenHoatDong,
          hours: res?.addedHours ?? activeActivity.gioCongTacXaHoi,
          distance: res?.distanceM ?? localGpsCheck.distance,
          accuracy: res?.accuracyM ?? localGpsCheck.accuracy,
          checkedAt: new Date().toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        });
      } else {
        const already = (activeActivity.checkedInRecords || []).some(
          (r) => r.memberId === selfMemberId
        );
        if (already) {
          setErrorBox({ message: 'Bạn đã hoàn thành điểm danh QR + GPS cho sự kiện này rồi.' });
          return;
        }
        await onCheckIn(activeActivity.id, selfMemberId, 'QR + GPS', {
          distance: localGpsCheck.distance,
          accuracy: localGpsCheck.accuracy
        });
        setReceipt({
          activityTitle: activeActivity.tenHoatDong,
          hours: activeActivity.gioCongTacXaHoi,
          distance: localGpsCheck.distance,
          accuracy: localGpsCheck.accuracy,
          checkedAt: new Date().toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        });
      }

      if (typeof window !== 'undefined' && window.location.hash.startsWith('#diem-danh=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (err) {
      setErrorBox({
        message: err.message || 'Không thể xác thực điểm danh.',
        distance: err?.details?.distance,
        accuracy: err?.details?.accuracy,
        radius: err?.details?.radius
      });
    } finally {
      setGpsBusy(false);
    }
  };

  const resetScanner = () => {
    stopCamera();
    setScannedTarget(null);
    setReceipt(null);
    setErrorBox(null);
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#diem-danh=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleMakeupSubmit = async (e) => {
    e.preventDefault();
    if (!onRegisterMakeup || !missedActId || !makeupActId) return;
    setMakeupBusy(true);
    setMakeupSuccess('');
    setErrorBox(null);
    try {
      await onRegisterMakeup({
        missedActivityId: missedActId,
        makeupActivityId: makeupActId,
        shiftReason
      });
      setMakeupSuccess(
        canApproveMakeup
          ? 'Đã ghi nhận và duyệt lịch sinh hoạt bù.'
          : 'Đã gửi đăng ký sinh hoạt bù lên Bí thư Chi đoàn.'
      );
    } catch (err) {
      setErrorBox({ message: err.message || 'Không thể gửi đăng ký sinh hoạt bù.' });
    } finally {
      setMakeupBusy(false);
    }
  };

  const myHistory = useMemo(() => {
    return activities
      .map((act) => {
        const rec = (act.checkedInRecords || []).find((r) => r.memberId === selfMemberId);
        if (!rec) return null;
        return {
          id: act.id,
          title: act.tenHoatDong,
          hours: act.gioCongTacXaHoi,
          checkedInAt: rec.checkedInAt,
          distanceM: rec.distanceM,
          accuracyM: rec.accuracyM,
          method: rec.method
        };
      })
      .filter(Boolean);
  }, [activities, selfMemberId]);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const branchModalActivity = useMemo(
    () => (branchModalActId ? activities.find((a) => a.id === branchModalActId) || null : null),
    [activities, branchModalActId]
  );
  const pendingMakeupCount = makeupList.filter((m) => m.status === 'pending').length;

  return (
    <div className="space-y-5">
      <section className="app-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A2B49]">
              Điểm danh QR + GPS &amp; Sinh hoạt bù
            </h1>
            <p className="text-sm sm:text-[15px] text-slate-600 mt-1">
              Xác thực kép (Mã QR ký số + Vị trí GPS trong bán kính) và hỗ trợ đoàn viên làm ca.
            </p>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-sm shrink-0">
            <div className="font-bold text-ink">{currentUser?.fullName}</div>
            <div className="font-mono text-muted text-xs sm:text-sm">
              {currentUser?.memberCode} • {currentUser?.roleLabel}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm sm:text-[15px] font-semibold border transition inline-flex items-center gap-2 shrink-0 ${
              activeTab === 'scan'
                ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-surface'
            }`}
          >
            <QrCode className="w-4 h-4" aria-hidden="true" />
            Quét QR &amp; Định vị GPS
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('makeup')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm sm:text-[15px] font-semibold border transition inline-flex items-center gap-2 shrink-0 ${
              activeTab === 'makeup'
                ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-surface'
            }`}
          >
            <CalendarClock className="w-4 h-4" aria-hidden="true" />
            {canApproveMakeup ? 'Duyệt Sinh hoạt bù ca KCN' : 'Đăng ký Sinh hoạt bù (Làm ca)'}
            {canApproveMakeup && pendingMakeupCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-mono font-bold">
                {pendingMakeupCount}
              </span>
            )}
          </button>
        </div>
      </section>

      {activeTab === 'scan' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: QR + GPS Scanner */}
          <section className="lg:col-span-7 app-card p-6 space-y-4">
            {receipt ? (
              <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-bold text-accent">Xác thực 2 lớp QR + GPS thành công</h2>
                <div className="text-base font-bold text-ink">{receipt.activityTitle}</div>
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-sm tabular-nums">
                  <div className="p-3 rounded-xl bg-surface border border-slate-200">
                    <div className="text-muted">Khoảng cách</div>
                    <div className="font-mono font-bold text-base text-ink mt-0.5">{receipt.distance}m</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-slate-200">
                    <div className="text-muted">Sai số GPS</div>
                    <div className="font-mono font-bold text-base text-ink mt-0.5">±{receipt.accuracy}m</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-slate-200">
                    <div className="text-muted">Cộng sổ cái</div>
                    <div className="font-mono font-bold text-base text-accent mt-0.5">+{receipt.hours}h</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetScanner}
                  className="w-full app-btn-secondary"
                >
                  Quét sự kiện khác
                </button>
              </div>
            ) : activeActivity ? (
              <div className="space-y-4">
                <div className="app-subcard p-4 space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-accent">
                    Bước 1 hoàn tất: Đã xác thực chữ ký QR • Chờ vị trí GPS
                  </span>
                  <h2 className="text-lg font-bold text-ink">{activeActivity.tenHoatDong}</h2>
                  <div className="flex flex-wrap gap-3 text-sm text-muted font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
                      {formatDateVN(activeActivity.ngayToChuc)} ({activeActivity.khungGio})
                    </span>
                  </div>
                </div>

                <GeofenceRadarCard
                  latitude={activeActivity.latitude}
                  longitude={activeActivity.longitude}
                  radiusM={activeActivity.geofenceRadiusM}
                  locationLabel={activeActivity.diaDiem}
                  distanceM={errorBox?.distance ?? null}
                  accuracyM={errorBox?.accuracy ?? null}
                />

                <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 text-sm text-ink flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#005BAC] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Hệ thống chỉ đối chiếu và lưu khoảng cách (m), không lưu tọa độ cá nhân.</span>
                </div>

                <button
                  type="button"
                  disabled={gpsBusy}
                  onClick={() => verifyAndSubmitAttendance(null)}
                  className="w-full app-btn-primary min-h-[50px]"
                >
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                  {gpsBusy ? 'Đang đối chiếu GPS 2 lớp...' : 'Lấy GPS thực tế & Điểm danh'}
                </button>

                <button
                  type="button"
                  disabled={gpsBusy}
                  onClick={resetScanner}
                  className="w-full text-sm font-semibold text-muted hover:text-ink underline py-1"
                >
                  Chọn hoặc quét mã QR khác
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full min-h-[220px] rounded-2xl border-2 border-dashed border-[#005BAC]/35 bg-slate-50/80 flex items-center justify-center overflow-hidden relative">
                  <div id="qr-camera-reader" className="w-full" />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-slate-600 p-6 text-center pointer-events-none">
                      <div className="w-14 h-14 rounded-2xl bg-surface border border-slate-200 flex items-center justify-center shadow-sm">
                        <QrCode className="w-7 h-7 text-[#005BAC]" aria-hidden="true" />
                      </div>
                      <span className="text-sm sm:text-[15px] font-medium">{cameraStatus}</span>
                    </div>
                  )}
                </div>
                <div id="qr-file-reader" className="hidden" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {cameraActive ? (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="sm:col-span-2 min-h-[48px] px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-[15px] font-semibold"
                    >
                      Tắt camera quét
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="sm:col-span-2 app-btn-primary min-h-[50px]"
                    >
                      <Camera className="w-5 h-5" aria-hidden="true" />
                      Mở camera quét QR
                    </button>
                  )}

                  <label className="app-btn-secondary cursor-pointer">
                    <Upload className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
                    Tải ảnh QR
                    <input
                      id="qr-image-upload"
                      name="qrImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleScanImageFile}
                      className="sr-only"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setPasteModalOpen(true)}
                    className="app-btn-secondary"
                  >
                    <Link2 className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
                    Dán link / mã phiên
                  </button>
                </div>

                {openEvents.length > 0 && (
                  <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
                    <div className="text-sm sm:text-[15px] font-bold text-ink">
                      Sự kiện đang mở QR ({openEvents.length}) — chạm để điểm danh:
                    </div>
                    <div className="space-y-2.5">
                      {openEvents.map((act) => {
                        const checked = (act.checkedInRecords || []).some(
                          (r) => r.memberId === selfMemberId
                        );
                        return (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() =>
                              acceptQrText(
                                buildAttendanceShareUrl(
                                  act.id,
                                  act.qrSession.token || act.qrSession.code
                                )
                              )
                            }
                            className="w-full text-left p-4 rounded-xl bg-slate-50/90 border border-slate-200/90 hover:border-[#005BAC]/50 flex items-center justify-between gap-3 transition"
                          >
                            <div className="min-w-0">
                              <div className="text-[15px] font-bold text-ink truncate">{act.tenHoatDong}</div>
                              <div className="text-sm font-mono text-muted tabular-nums mt-0.5">
                                {formatDateVN(act.ngayToChuc)} • Bán kính {act.geofenceRadiusM || 150}m • +{act.gioCongTacXaHoi}h
                              </div>
                            </div>
                            <span
                              className={`text-sm font-bold shrink-0 inline-flex items-center gap-1 ${
                                checked ? 'text-accent' : 'text-[#005BAC]'
                              }`}
                            >
                              {checked ? 'Đã điểm danh ✓' : 'Mở quét'}
                              {!checked && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {errorBox && (
              <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm sm:text-[15px] space-y-2.5">
                <div className="font-semibold flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
                  <span>{errorBox.message}</span>
                </div>
                {errorBox.distance !== undefined && (
                  <div className="pl-7 space-y-1.5">
                    <div className="font-mono text-sm tabular-nums text-rose-800">
                      Cách tâm {errorBox.distance >= 1000 ? `${(errorBox.distance / 1000).toFixed(2)}km` : `${errorBox.distance}m`} • Sai số ±{errorBox.accuracy}m • Bán kính cho phép {errorBox.radius}m
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Hãy di chuyển vào đúng phạm vi <strong>{activeActivity?.diaDiem || 'địa điểm tổ chức'}</strong> rồi bấm lấy GPS lại để hoàn tất điểm danh.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Right: History + Secretary KP5 Progress */}
          <div className="lg:col-span-5 space-y-4">
            <button
              type="button"
              onClick={() => setHistoryModalOpen(true)}
              className="w-full text-left app-card-interactive p-6 flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-sm font-semibold text-muted">Lịch sử tham gia cá nhân</div>
                <div className="text-xl font-bold text-ink mt-1 tabular-nums">
                  {myHistory.length} buổi đã điểm danh
                </div>
                <div className="text-sm text-[#005BAC] font-semibold mt-1.5 inline-flex items-center gap-1">
                  Xem nhật ký chi tiết <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-accent flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
              </div>
            </button>

            {canViewBranchProgress && (
              <section className="app-card p-6 space-y-3.5">
                <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#005BAC]" aria-hidden="true" />
                  Tiến độ điểm danh Chi đoàn
                </h2>
                <div className="divide-y divide-slate-200/80">
                  {activities.slice(0, 5).map((act) => {
                    const kp5Count = (act.checkedInRecords || []).filter((r) =>
                      memberMap.has(r.memberId)
                    ).length;
                    const pct = members.length ? Math.round((kp5Count / members.length) * 100) : 0;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setBranchModalActId(act.id)}
                        className="w-full text-left py-3.5 space-y-2 hover:text-[#005BAC] transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm sm:text-[15px] font-semibold truncate">{act.tenHoatDong}</span>
                          <span className="font-mono text-sm font-bold text-accent shrink-0 tabular-nums">
                            {kp5Count}/{members.length} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#005BAC]"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Shift-Worker Makeup Registration & Secretary Approval */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <section className="lg:col-span-6 app-card p-6 space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-ink">
                Đăng ký buổi sinh hoạt bù (Công nhân làm ca)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Đoàn viên trùng ca sản xuất chọn buổi sinh hoạt bù để giữ vững chuyên cần.
              </p>
            </div>

            {makeupSuccess && (
              <div role="status" className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />
                <span>{makeupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleMakeupSubmit} className="space-y-4">
              <div>
                <label htmlFor="mk-missed" className="block text-sm font-bold text-ink mb-1.5">
                  Buổi sinh hoạt vắng do trùng ca *
                </label>
                <select
                  id="mk-missed"
                  required
                  value={missedActId}
                  onChange={(e) => setMissedActId(e.target.value)}
                  className="app-input"
                >
                  {missedMeetingOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.ngayToChuc} — {a.tenHoatDong}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mk-target" className="block text-sm font-bold text-ink mb-1.5">
                  Chọn buổi sinh hoạt bù sắp tới *
                </label>
                <select
                  id="mk-target"
                  required
                  value={makeupActId}
                  onChange={(e) => setMakeupActId(e.target.value)}
                  className="app-input"
                >
                  {makeupSessionOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.ngayToChuc} ({a.khungGio}) — {a.tenHoatDong}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mk-reason" className="block text-sm font-bold text-ink mb-1.5">
                  Ca làm việc / Lý do *
                </label>
                <input
                  id="mk-reason"
                  required
                  value={shiftReason}
                  onChange={(e) => setShiftReason(e.target.value)}
                  placeholder="VD: Trùng ca 2 (14:00 - 22:00)"
                  className="app-input"
                />
              </div>

              <button type="submit" disabled={makeupBusy} className="w-full app-btn-primary">
                <CalendarClock className="w-5 h-5" aria-hidden="true" />
                {makeupBusy ? 'Đang gửi đăng ký...' : 'Xác nhận đăng ký sinh hoạt bù'}
              </button>
            </form>
          </section>

          <section className="lg:col-span-6 app-card p-6 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-ink">
              {canApproveMakeup
                ? `Danh sách đăng ký bù Chi đoàn (${makeupList.length})`
                : `Trạng thái đăng ký của bạn (${makeupList.length})`}
            </h2>

            {makeupList.length === 0 ? (
              <p className="text-sm text-muted py-8 text-center">
                Chưa có đơn đăng ký sinh hoạt bù nào.
              </p>
            ) : (
              <div className="divide-y divide-slate-200/80">
                {makeupList.map((item) => (
                  <div key={item.id} className="py-4 space-y-2 text-sm sm:text-[15px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-ink">
                        {item.memberName} <span className="font-mono text-muted">({item.memberCode})</span>
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${
                          item.status === 'approved'
                            ? 'bg-emerald-50 border-emerald-200 text-accent'
                            : item.status === 'rejected'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        {item.status === 'approved'
                          ? 'Đã duyệt'
                          : item.status === 'rejected'
                            ? 'Từ chối'
                            : 'Chờ Bí thư duyệt'}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Lý do: <strong className="text-ink">{item.shiftReason}</strong>
                    </div>
                    <div className="text-xs sm:text-sm font-mono text-muted">
                      Bù sang: {item.makeupActivityTitle} ({item.makeupDate})
                    </div>

                    {canApproveMakeup && item.status === 'pending' && onReviewMakeup && (
                      <div className="flex items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => onReviewMakeup(item.id, 'approved')}
                          className="min-h-[40px] px-4 py-1.5 rounded-xl bg-accent text-white text-sm font-semibold"
                        >
                          Duyệt đăng ký
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewMakeup(item.id, 'rejected')}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Personal History Modal */}
      {historyModalOpen && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="app-modal-panel max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Lịch sử điểm danh của {currentUser?.fullName}</h2>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                aria-label="Đóng lịch sử"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {myHistory.length === 0 ? (
              <p className="text-sm text-muted py-5 text-center">Chưa có lượt điểm danh nào.</p>
            ) : (
              <div className="divide-y divide-slate-200/80">
                {myHistory.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <div className="font-bold text-ink">{item.title}</div>
                      <div className="font-mono text-muted">{item.checkedInAt} • +{item.hours}h</div>
                    </div>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-accent shrink-0">
                      {item.distanceM !== null && item.distanceM !== undefined
                        ? `${item.distanceM}m · ±${item.accuracyM || 15}m`
                        : item.method}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branch Progress Detail Modal */}
      {branchModalActivity && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="app-modal-panel max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-ink line-clamp-2">{branchModalActivity.tenHoatDong}</h2>
              <button
                type="button"
                onClick={() => setBranchModalActId(null)}
                aria-label="Đóng chi tiết tiến độ"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="divide-y divide-slate-200/80">
              {(branchModalActivity.checkedInRecords || [])
                .filter((r) => memberMap.has(r.memberId))
                .map((rec, idx) => {
                  const m = memberMap.get(rec.memberId);
                  return (
                    <div key={`${rec.memberId}-${idx}`} className="py-3 flex items-center justify-between gap-2 text-sm">
                      <div>
                        <div className="font-bold text-ink">{m?.hoTen}</div>
                        <div className="font-mono text-xs sm:text-sm text-muted">{rec.checkedInAt}</div>
                      </div>
                      <span className="font-mono text-xs sm:text-sm text-accent font-semibold">
                        {rec.distanceM !== null && rec.distanceM !== undefined
                          ? `${rec.distanceM}m · ±${rec.accuracyM || 15}m`
                          : rec.method}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Paste Link Modal */}
      {pasteModalOpen && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPasteModalOpen(false);
              acceptQrText(pasteInput);
              setPasteInput('');
            }}
            className="app-modal-panel max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-ink">Dán link hoặc mã phiên QR</h2>
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                aria-label="Đóng"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              id="paste-qr-input"
              name="pasteQrInput"
              required
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="#diem-danh=ACT-WARD-01.XXXXXX"
              className="app-input font-mono text-sm"
            />
            <button type="submit" className="w-full app-btn-primary">
              Kiểm tra chữ ký QR &amp; Mở GPS
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
