import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  Clock,
  UserCheck,
  Eye,
  Layers,
  ChevronRight,
  X,
  Navigation,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { WARDS_95, CATEGORIES, STATUSES, URGENCY_LEVELS } from '../data/wardsData';

export default function PublicMap({ reports, initialSelectedId, onSelectReport }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && r.categoryId !== categoryFilter) return false;
    if (wardFilter !== 'all' && r.wardId !== wardFilter) return false;
    if (urgencyFilter !== 'all' && (r.urgency || 'medium') !== urgencyFilter) return false;
    return true;
  });

  useEffect(() => {
    if (initialSelectedId) {
      const found = reports.find((r) => r.id === initialSelectedId);
      if (found) {
        setSelectedReport(found);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([found.lat, found.lng], 15, { animate: true });
        }
      }
    } else if (reports.length > 0 && !selectedReport) {
      setSelectedReport(reports[0]);
    }
  }, [initialSelectedId, reports]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [10.945, 106.92],
      zoom: 11,
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

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    filteredReports.forEach((rep) => {
      const st = STATUSES[rep.status] || STATUSES.pending;
      const urg = URGENCY_LEVELS[rep.urgency || 'medium'] || URGENCY_LEVELS.medium;

      const isUrgent = (rep.urgency || 'medium') === 'urgent';
      const isResolved = rep.status === 'resolved';

      const pinBg = isResolved ? '#64748b' : isUrgent ? '#0f172a' : '#0284c7';
      const pinText = '#ffffff';

      const icon = L.divIcon({
        className: '',
        html: `<div class="custom-marker-pin" style="width:28px;height:28px;background:${pinBg};color:${pinText};font-weight:900;font-size:11px;font-family:monospace;border:2px solid #ffffff;">
          ${isResolved ? '✓' : isUrgent ? '!' : '●'}
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([rep.lat, rep.lng], { icon });

      marker.bindPopup(`
        <div style="min-width:210px;font-family:sans-serif;color:#0f172a;">
          <div style="font-size:10px;font-weight:bold;text-transform:uppercase;color:#0284c7;letter-spacing:0.5px;">
            HỒ SƠ #${rep.id} — ${urg.label.toUpperCase()}
          </div>
          <div style="font-size:12px;font-weight:bold;margin:4px 0;color:#0f172a;">
            ${rep.title}
          </div>
          <div style="font-size:11px;color:#475569;">
            Địa bàn: ${rep.wardName}<br/>
            Tọa độ: ${rep.lat.toFixed(5)}, ${rep.lng.toFixed(5)}<br/>
            Trạng thái: <strong>${st.label}</strong>
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedReport(rep);
        if (onSelectReport) onSelectReport(rep);
      });

      marker.addTo(layer);
    });
  }, [filteredReports]);

  function focusReportOnMap(rep) {
    setSelectedReport(rep);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([rep.lat, rep.lng], 15, { animate: true });
    }
  }

  const countPending = reports.filter((r) => r.status === 'pending').length;
  const countProcessing = reports.filter((r) => r.status === 'processing').length;
  const countResolved = reports.filter((r) => r.status === 'resolved').length;

  return (
    <div className="space-y-4">
      {/* Bộ lọc: Mặc định khung xanh, khi chọn chuyển sang khung xám */}
      <div className="bg-white border-2 border-sky-300 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border-2 ${
              statusFilter === 'all'
                ? 'bg-slate-200 text-slate-900 border-slate-500 shadow-sm'
                : 'bg-sky-50/50 text-sky-900 border-sky-300 hover:bg-sky-100'
            }`}
          >
            Tất cả ({reports.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border-2 ${
              statusFilter === 'pending'
                ? 'bg-slate-200 text-slate-900 border-slate-500 shadow-sm'
                : 'bg-sky-50/50 text-sky-900 border-sky-300 hover:bg-sky-100'
            }`}
          >
            Chưa xử lý ({countPending})
          </button>
          <button
            onClick={() => setStatusFilter('processing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border-2 ${
              statusFilter === 'processing'
                ? 'bg-slate-200 text-slate-900 border-slate-500 shadow-sm'
                : 'bg-sky-50/50 text-sky-900 border-sky-300 hover:bg-sky-100'
            }`}
          >
            Đang xử lý ({countProcessing})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border-2 ${
              statusFilter === 'resolved'
                ? 'bg-slate-200 text-slate-900 border-slate-500 shadow-sm'
                : 'bg-sky-50/50 text-sky-900 border-sky-300 hover:bg-sky-100'
            }`}
          >
            Đã xong ({countResolved})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="bg-sky-50/40 border-2 border-sky-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
          >
            <option value="all">Mọi mức độ</option>
            <option value="urgent">Mức độ: Gấp</option>
            <option value="medium">Mức độ: Vừa</option>
            <option value="slow">Mức độ: Chậm</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-sky-50/40 border-2 border-sky-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
          >
            <option value="all">Tất cả hạng mục</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="bg-sky-50/40 border-2 border-sky-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition max-w-[200px]"
          >
            <option value="all">Tất cả 95 Xã/Phường</option>
            {WARDS_95.map((w) => (
              <option key={w.id} value={w.id}>
                #{w.code} - {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Bản đồ & Chi tiết điểm phản ánh */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white border-2 border-sky-300 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div ref={mapContainerRef} className="w-full h-[520px]" />
          <div className="p-3 bg-sky-50/30 border-t border-sky-200 flex gap-2 overflow-x-auto">
            {filteredReports.map((r) => {
              const isUrgent = (r.urgency || 'medium') === 'urgent';
              return (
                <button
                  key={r.id}
                  onClick={() => focusReportOnMap(r)}
                  className={`text-xs px-3 py-1.5 rounded-xl border-2 shrink-0 transition flex items-center gap-1.5 ${
                    selectedReport?.id === r.id
                      ? 'bg-slate-200 text-slate-900 border-slate-500 font-bold shadow-sm'
                      : 'bg-sky-50/50 text-sky-900 border-sky-300 hover:border-sky-400 hover:bg-sky-100'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      r.status === 'resolved'
                        ? 'bg-slate-400'
                        : isUrgent
                        ? 'bg-slate-900'
                        : 'bg-sky-400'
                    }`}
                  />
                  <span className="font-mono">{r.id}:</span>
                  <span className="truncate max-w-[130px]">{r.wardName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Khung Chi Tiết Hồ Sơ Điểm */}
        <div className="lg:col-span-4 bg-white border-2 border-sky-300 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm">
          {selectedReport ? (
            <>
              <div>
                <div className="relative h-48 bg-slate-900">
                  <img
                    src={selectedReport.photoUrl}
                    alt={selectedReport.title}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 text-white text-[11px] font-mono px-2.5 py-1 rounded-md">
                    HỒ SƠ #{selectedReport.id}
                  </span>
                  <span className="absolute bottom-3 left-3 bg-sky-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded shadow">
                    MỨC ĐỘ: {URGENCY_LEVELS[selectedReport.urgency || 'medium']?.label}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase text-sky-800 font-bold">
                      {selectedReport.wardName} • {CATEGORIES.find((c) => c.id === selectedReport.categoryId)?.name}
                    </div>
                    <h3 className="text-sm font-bold text-slate-950 mt-1 leading-snug">
                      {selectedReport.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {selectedReport.description}
                    </p>
                  </div>

                  <div className="bg-sky-50/50 rounded-xl p-3.5 border border-sky-100 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{selectedReport.addressNote}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                      <Navigation className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>GPS: {selectedReport.lat.toFixed(6)}, {selectedReport.lng.toFixed(6)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <UserCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Cán bộ: <strong className="text-slate-900">{selectedReport.assignedOfficer || 'Chưa phân công'}</strong></span>
                    </div>
                    {selectedReport.processingHours && (
                      <div className="flex items-center gap-2 text-sky-900 font-mono text-[11px] font-bold">
                        <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>Thời gian hoàn tất: {selectedReport.processingHours} giờ</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Nhật ký tiếp nhận & giải quyết
                    </div>
                    <div className="space-y-2 border-l-2 border-sky-200 pl-3 ml-1 text-xs">
                      {selectedReport.history?.map((h, i) => (
                        <div key={i}>
                          <div className="text-[10px] font-mono text-slate-400">
                            {h.time} — <span className="text-slate-700 font-bold">{h.actor}</span>
                          </div>
                          <div className="text-slate-700 text-[11px] mt-0.5">{h.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                <span className="text-[11px] font-mono text-slate-600">
                  Tình trạng: <strong className="text-slate-950">{STATUSES[selectedReport.status]?.label}</strong>
                </span>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Chọn một điểm trên bản đồ để xem chi tiết ảnh chụp và quá trình xử lý.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
