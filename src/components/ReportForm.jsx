import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import {
  Camera,
  MapPin,
  Clock,
  RefreshCw,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  Video,
  VideoOff,
  Crosshair,
  Sparkles,
  Mic,
  MicOff
} from 'lucide-react';
import { WARDS_95, CATEGORIES, URGENCY_LEVELS, findNearestWard } from '../data/wardsData';
import {
  formatDateTimeVN,
  drawWatermarkOnCanvas,
  generateSimulatedCameraCapture
} from '../utils/watermark';

export default function ReportForm({ onSubmitReport, userAccount }) {
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('pothole');
  const [otherCategoryNote, setOtherCategoryNote] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [wardId, setWardId] = useState(WARDS_95[0].id);
  const [addressNote, setAddressNote] = useState('');

  // Tọa độ GPS & Thời gian thực
  const [lat, setLat] = useState(WARDS_95[0].lat);
  const [lng, setLng] = useState(WARDS_95[0].lng);
  const [accuracy, setAccuracy] = useState(5);
  const [gpsStatus, setGpsStatus] = useState('Vị trí mặc định khu vực trung tâm');
  const [isLocating, setIsLocating] = useState(false);

  const [liveClock, setLiveClock] = useState(formatDateTimeVN(new Date()));
  const [capturedAtStr, setCapturedAtStr] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);

  // Camera WebRTC state
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Ghi âm giọng nói
  const [isRecording, setIsRecording] = useState(false);
  const [speechNote, setSpeechNote] = useState('');
  const recognitionRef = useRef(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const miniMapContainerRef = useRef(null);
  const miniMapRef = useRef(null);
  const markerRef = useRef(null);

  const selectedWard = WARDS_95.find((w) => w.id === wardId) || WARDS_95[0];
  const selectedCategory = CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(formatDateTimeVN(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Khởi tạo Mini Map với nền sáng sạch đẹp
  useEffect(() => {
    if (!miniMapContainerRef.current || miniMapRef.current) return;

    const map = L.map(miniMapContainerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const googleStreets = L.tileLayer(
      'https://{s}.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      }
    ).addTo(map);

    const googleHybrid = L.tileLayer(
      'https://{s}.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps Satellite'
      }
    );

    L.control.layers(
      {
        'Google Đường phố': googleStreets,
        'Google Vệ tinh': googleHybrid
      },
      null,
      { position: 'topright' }
    ).addTo(map);

    const pinIcon = L.divIcon({
      className: '',
      html: `<div class="custom-marker-pin" style="width:26px;height:26px;background:#0284c7;color:#fff;font-size:12px;font-weight:bold;border:2px solid #ffffff;">📍</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const marker = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      updateCoordinatesAndAutoWard(pos.lat, pos.lng, 3, 'Đã điều chỉnh ghim tọa độ');
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      updateCoordinatesAndAutoWard(e.latlng.lat, e.latlng.lng, 3, 'Đã ghim vị trí');
    });

    miniMapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      miniMapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (miniMapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      miniMapRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  function updateCoordinatesAndAutoWard(newLat, newLng, newAcc, statusMessage) {
    const fixedLat = Number(newLat.toFixed(6));
    const fixedLng = Number(newLng.toFixed(6));
    setLat(fixedLat);
    setLng(fixedLng);
    setAccuracy(Math.round(newAcc || 5));
    const nearest = findNearestWard(fixedLat, fixedLng);
    if (nearest) {
      setWardId(nearest.id);
      setGpsStatus(`${statusMessage} → Tự động liên kết: ${nearest.name}`);
    } else {
      setGpsStatus(statusMessage);
    }
  }

  function handleGetBrowserGPS() {
    if (!navigator.geolocation) {
      setGpsStatus('Trình duyệt không hỗ trợ Geolocation API.');
      return;
    }
    setIsLocating(true);
    setGpsStatus('Đang truy vấn vệ tinh GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        updateCoordinatesAndAutoWard(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy,
          'Đã thu nhận tọa độ GPS thực tế'
        );
      },
      (err) => {
        setIsLocating(false);
        setGpsStatus(`Lỗi GPS: ${err.message}.`);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  async function startCamera(mode = facingMode) {
    setCameraError('');
    stopCamera();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Thiết bị không hỗ trợ camera trực tiếp. Vui lòng chọn tải file hoặc bấm Chụp mô phỏng.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      setCameraError('Không thể mở camera. Đã kích hoạt tùy chọn tải file hoặc tạo ảnh thử nghiệm có GPS.');
      setCameraActive(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function handleSwitchCamera() {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraActive) startCamera(nextMode);
  }

  function captureFromVideoStream() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const nowStr = formatDateTimeVN(new Date());
    const catLabel = categoryId === 'other' && otherCategoryNote ? otherCategoryNote : selectedCategory.name;

    drawWatermarkOnCanvas(ctx, width, height, {
      lat,
      lng,
      accuracy,
      timestampStr: nowStr,
      wardName: selectedWard.name,
      categoryName: catLabel
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
    setPhotoDataUrl(dataUrl);
    setCapturedAtStr(nowStr);
    stopCamera();
  }

  function handleSimulatedCapture() {
    const nowStr = formatDateTimeVN(new Date());
    const catLabel = categoryId === 'other' && otherCategoryNote ? otherCategoryNote : selectedCategory.name;
    const dataUrl = generateSimulatedCameraCapture({
      lat,
      lng,
      accuracy,
      timestampStr: nowStr,
      wardName: selectedWard.name,
      categoryName: catLabel
    });
    setPhotoDataUrl(dataUrl);
    setCapturedAtStr(nowStr);
    stopCamera();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 900;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const nowStr = formatDateTimeVN(new Date());
        const catLabel = categoryId === 'other' && otherCategoryNote ? otherCategoryNote : selectedCategory.name;

        drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, {
          lat,
          lng,
          accuracy,
          timestampStr: nowStr,
          wardName: selectedWard.name,
          categoryName: catLabel
        });

        setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.90));
        setCapturedAtStr(nowStr);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleSelectWardChange(newWardId) {
    setWardId(newWardId);
    const found = WARDS_95.find((w) => w.id === newWardId);
    if (found) {
      setLat(found.lat);
      setLng(found.lng);
      setGpsStatus(`Tâm tọa độ: ${found.name} (${found.area})`);
    }
  }

  function handleToggleSpeechToText() {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsRecording(false);
      setSpeechNote('Đã kết thúc bản ghi âm.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechNote('Trình duyệt chưa hỗ trợ ghi âm trực tiếp. Bạn có thể bấm "Nạp văn bản mẫu" hoặc gõ văn bản.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        let added = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            added += `${event.results[i][0].transcript} `;
          }
        }
        const cleaned = added.trim();
        if (cleaned) {
          setDescription((prev) => (prev.trim() ? `${prev.trim()} ${cleaned}` : cleaned));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setSpeechNote('Micro tạm ngắt hoặc chưa được cấp quyền.');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      setSpeechNote('Đang thu âm tiếng Việt... Hãy nói rõ nội dung phản ánh.');
    } catch (err) {
      setIsRecording(false);
      setSpeechNote(`Lỗi micro: ${err.message}`);
    }
  }

  function handleSimulatedVoice() {
    const categoryLabel =
      categoryId === 'other' && otherCategoryNote.trim()
        ? otherCategoryNote.trim()
        : selectedCategory.name;
    const sample = `Phát hiện sự cố ${categoryLabel.toLowerCase()} tại ${
      addressNote.trim() || selectedWard.name
    }, mức độ ${URGENCY_LEVELS[urgency].label.toLowerCase()}, kính đề nghị cơ quan phụ trách nhanh chóng kiểm tra, xử lý bảo đảm an toàn.`;
    setDescription((prev) => (prev.trim() ? `${prev.trim()} ${sample}` : sample));
    setSpeechNote('Đã nạp văn bản từ bản ghi âm mô phỏng.');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsRecording(false);
    }

    const categoryLabel =
      categoryId === 'other' && otherCategoryNote.trim()
        ? otherCategoryNote.trim()
        : selectedCategory.name;

    const finalPhoto =
      photoDataUrl ||
      generateSimulatedCameraCapture({
        lat,
        lng,
        accuracy,
        timestampStr: capturedAtStr || liveClock,
        wardName: selectedWard.name,
        categoryName: categoryLabel
      });

    const cleanAddress = addressNote.trim() || selectedWard.name;
    const autoTitle = `${categoryLabel} tại ${cleanAddress}`;

    const newReport = onSubmitReport({
      title: autoTitle,
      description:
        description.trim() ||
        `Công dân phản ánh hiện trạng ${categoryLabel.toLowerCase()} (Mức độ: ${
          URGENCY_LEVELS[urgency].label
        }) tại ${cleanAddress}.`,
      categoryId,
      customCategoryName: categoryId === 'other' ? otherCategoryNote.trim() : '',
      urgency,
      wardId: selectedWard.id,
      wardName: selectedWard.name,
      lat,
      lng,
      accuracy,
      addressNote: cleanAddress,
      reporterName: userAccount?.fullName || 'Công dân',
      reporterPhone: userAccount?.phone || '',
      photoUrl: finalPhoto,
      capturedAtStr: capturedAtStr || liveClock
    });

    setSubmitSuccess(newReport);
    setDescription('');
    setAddressNote('');
    setOtherCategoryNote('');
    setUrgency('medium');
    setSpeechNote('');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* CỘT TRÁI: CAMERA & VỊ TRÍ GPS (KHUNG XANH, KHI CHỌN KHUNG XÁM) */}
      <div className="lg:col-span-6 space-y-5">
        {/* Khung Camera */}
        <div className="bg-white border-2 border-sky-300 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-sky-50 border-b border-sky-200 flex items-center justify-between text-sky-950">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold uppercase tracking-wider">
                1. Ghi Nhận Hiện Trường (Camera + GPS)
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-white px-2.5 py-1 rounded-md border border-sky-300">
              <Clock className="w-3 h-3 text-sky-600" />
              <span>{liveClock}</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Toolbar Camera */}
            <div className="flex flex-wrap gap-2">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="flex-1 min-w-[140px] py-2.5 px-4 bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow"
                >
                  <Video className="w-3.5 h-3.5" />
                  Mở Camera
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={captureFromVideoStream}
                    className="flex-1 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Chụp & Đóng Dấu
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs transition border border-slate-300"
                    title="Đổi camera"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs transition border border-red-200"
                  >
                    <VideoOff className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3.5 bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-sky-800 border border-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                Tải ảnh
              </button>

              <button
                type="button"
                onClick={handleSimulatedCapture}
                className="py-2.5 px-3.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                title="Tạo ảnh mô phỏng có đóng dấu GPS và giờ thực"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Chụp thử nghiệm
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {cameraError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Khung hiển thị Video hoặc Ảnh */}
            <div className="relative bg-slate-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center border-2 border-slate-200">
              {cameraActive ? (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-900/85 border border-sky-400 rounded-lg p-2.5 text-[11px] font-mono text-white space-y-0.5 pointer-events-none">
                    <div className="text-sky-300 font-bold">XÁC THỰC HIỆN TRƯỜNG TRỰC TIẾP</div>
                    <div>GPS: {lat.toFixed(6)}, {lng.toFixed(6)} (±{accuracy}m)</div>
                    <div>Thời gian: {liveClock}</div>
                  </div>
                </div>
              ) : photoDataUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={photoDataUrl}
                    alt="Ảnh hiện trường"
                    className="w-full h-full object-contain bg-slate-900"
                  />
                  <span className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700 text-white text-[11px] font-mono px-2.5 py-1 rounded-md shadow flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                    ĐÃ ĐÓNG DẤU ({capturedAtStr})
                  </span>
                </div>
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-400">
                  <Camera className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">Chưa có ảnh tư liệu hiện trường</p>
                  <p className="text-[11px] max-w-xs mx-auto text-slate-500">
                    Bấm <strong>Mở Camera</strong> hoặc <strong>Chụp thử nghiệm</strong> để hệ thống tự động gắn tọa độ GPS và thời gian.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Khung Bản đồ Tọa độ GPS */}
        <div className="bg-white border-2 border-sky-300 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-sky-50 border-b border-sky-200 flex items-center justify-between text-sky-950">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold uppercase tracking-wider">
                2. Tọa Độ GPS & Xác Nhận Điểm
              </span>
            </div>
            <button
              type="button"
              onClick={handleGetBrowserGPS}
              disabled={isLocating}
              className="py-1.5 px-3 bg-white hover:bg-slate-200 text-sky-900 hover:text-slate-900 border border-sky-300 hover:border-slate-500 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{isLocating ? 'Đang dò GPS...' : 'Lấy GPS thiết bị'}</span>
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-sky-50/40 p-2.5 rounded-lg border border-sky-200">
                <span className="text-[10px] uppercase text-slate-500 block font-mono">Latitude</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{lat.toFixed(6)}</span>
              </div>
              <div className="bg-sky-50/40 p-2.5 rounded-lg border border-sky-200">
                <span className="text-[10px] uppercase text-slate-500 block font-mono">Longitude</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{lng.toFixed(6)}</span>
              </div>
              <div className="bg-sky-50/40 p-2.5 rounded-lg border border-sky-200">
                <span className="text-[10px] uppercase text-slate-500 block font-mono">Khu vực</span>
                <span className="font-bold text-sky-800 text-xs truncate block">{selectedWard.name}</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200 flex items-center justify-between">
              <span>{gpsStatus}</span>
              <span className="text-slate-400 text-[10px]">(Có thể kéo thả ghim trên bản đồ)</span>
            </div>

            <div ref={miniMapContainerRef} className="w-full h-52 rounded-xl overflow-hidden border-2 border-sky-300" />
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: FORM GỬI PHẢN ÁNH CỦA NGƯỜI DÂN */}
      <div className="lg:col-span-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white border-2 border-sky-300 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
        >
          <div className="px-6 py-4 bg-sky-50 border-b border-sky-200 text-sky-950">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              3. Thông Tin Phản Ánh Hạ Tầng
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Chọn hạng mục, chỉ rõ địa chỉ và mức độ khẩn cấp để chuyển ngay tới cơ quan xử lý.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {submitSuccess && (
              <div className="bg-slate-100 border-2 border-slate-400 text-slate-900 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-slate-700" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm">Đã chuyển hồ sơ #{submitSuccess.id} thành công!</div>
                  <div className="text-slate-700">
                    Đơn vị phụ trách: <strong className="text-slate-900">{submitSuccess.wardName}</strong> • Mức độ:{' '}
                    <strong className="text-slate-900">{URGENCY_LEVELS[submitSuccess.urgency]?.label}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 1. Chọn mục báo cáo (Mặc định khung xanh, khi chọn khung xám) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                Hạng mục phản ánh *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const active = cat.id === categoryId;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`text-left px-3.5 py-2.5 rounded-xl border-2 text-xs font-medium transition flex items-center justify-between ${
                        active
                          ? 'bg-slate-200 border-slate-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-sky-50/40 text-sky-950 border-sky-300 hover:bg-sky-100/60 hover:border-sky-400'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">SLA {cat.slaHours}h</span>
                    </button>
                  );
                })}
              </div>

              {categoryId === 'other' && (
                <input
                  type="text"
                  required
                  value={otherCategoryNote}
                  onChange={(e) => setOtherCategoryNote(e.target.value)}
                  placeholder="Nhập tên hạng mục khác (VD: Ô nhiễm tiếng ồn, Cáp viễn thông chùng...)"
                  className="mt-2.5 w-full text-xs px-3.5 py-2.5 bg-sky-50/30 border-2 border-sky-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
                />
              )}
            </div>

            {/* 2. Ô mức độ: Gấp / Vừa / Chậm (Mặc định khung xanh, khi chọn khung xám) */}
            <div className="bg-sky-50/30 p-4 rounded-xl border-2 border-sky-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                Mức độ khẩn cấp *
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {Object.values(URGENCY_LEVELS).map((lvl) => {
                  const active = urgency === lvl.id;
                  return (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => setUrgency(lvl.id)}
                      className={`px-3 py-2.5 rounded-xl border-2 text-center transition ${
                        active
                          ? lvl.activeClass
                          : 'bg-white border-sky-300 text-sky-950 hover:bg-sky-50 hover:border-sky-400'
                      }`}
                    >
                      <div className="text-xs font-bold uppercase tracking-wider">{lvl.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-80">{lvl.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Địa chỉ (Chọn Xã/Phường + 1 ô địa chỉ cụ thể) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Địa bàn & Vị trí chi tiết *
              </label>
              <select
                value={wardId}
                onChange={(e) => handleSelectWardChange(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-sky-50/30 border-2 border-sky-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
              >
                {WARDS_95.map((w) => (
                  <option key={w.id} value={w.id}>
                    #{w.code} - {w.name} ({w.area.replace('Khu vực ', '')})
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={addressNote}
                onChange={(e) => setAddressNote(e.target.value)}
                placeholder="Số nhà, tên đường, ngã tư hoặc mốc nhận diện thực tế..."
                className="w-full text-xs px-3.5 py-2.5 bg-sky-50/30 border-2 border-sky-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
              />
            </div>

            {/* 4. Thông tin chi tiết + Ghi âm thành văn bản */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Mô tả tình trạng hiện trường
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleSpeechToText}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition flex items-center gap-1.5 ${
                      isRecording
                        ? 'bg-slate-200 text-slate-900 border-slate-500 animate-pulse'
                        : 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-sky-600" />}
                    <span>{isRecording ? 'Dừng ghi âm' : 'Nói để viết'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulatedVoice}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg border-2 border-sky-300 bg-sky-50/50 text-sky-900 hover:bg-slate-200 hover:border-slate-500 hover:text-slate-900 transition"
                    title="Nạp bản ghi mẫu nếu thiết bị không có micro"
                  >
                    Nạp văn bản mẫu
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập chi tiết hiện trạng hoặc bấm 'Nói để viết' để tự động nhận dạng giọng nói..."
                className="w-full text-xs px-3.5 py-2.5 bg-sky-50/30 border-2 border-sky-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
              />
              {speechNote && (
                <div className="text-[11px] text-sky-700 mt-1 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-sky-600" />
                  <span>{speechNote}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-sky-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow"
            >
              <Send className="w-4 h-4" />
              <span>Gửi Hồ Sơ Tới UBND {selectedWard.name}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
