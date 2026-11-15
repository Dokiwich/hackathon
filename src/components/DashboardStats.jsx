import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Trophy,
  Search,
  ArrowUpDown,
  Map,
  Building2
} from 'lucide-react';
import { WARDS_95, CATEGORIES, CLUSTERS, URGENCY_LEVELS } from '../data/wardsData';

export default function DashboardStats({ reports, mode = 'ranking' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score_desc');

  const totalLive = reports.length;
  const resolvedLive = reports.filter((r) => r.status === 'resolved');
  const pendingLive = reports.filter((r) => r.status === 'pending');
  const processingLive = reports.filter((r) => r.status === 'processing');

  const avgProcessingHours = useMemo(() => {
    const withHours = resolvedLive.filter((r) => typeof r.processingHours === 'number');
    if (withHours.length === 0) return 0;
    const sum = withHours.reduce((acc, r) => acc + r.processingHours, 0);
    return Number((sum / withHours.length).toFixed(1));
  }, [resolvedLive]);

  const wardRankings = useMemo(() => {
    const computed = WARDS_95.map((w) => {
      const histTotal = 18 + ((w.code * 7) % 25);
      const histResolved = Math.min(histTotal, histTotal - (w.code % 4));
      const histPending = histTotal - histResolved;
      const baseAvgHours = Number((2.8 + ((w.code * 13) % 95) / 10).toFixed(1));

      const wardLive = reports.filter((r) => r.wardId === w.id);
      const liveResolved = wardLive.filter((r) => r.status === 'resolved');
      const livePending = wardLive.filter((r) => r.status === 'pending').length;
      const liveProcessing = wardLive.filter((r) => r.status === 'processing').length;

      const total = histTotal + wardLive.length;
      const resolved = histResolved + liveResolved.length;
      const pending = livePending;
      const processing = histPending + liveProcessing;

      const liveHoursSum = liveResolved.reduce((acc, r) => acc + (r.processingHours || 4.0), 0);
      const avgHours = Number(
        ((baseAvgHours * histResolved + liveHoursSum) / Math.max(1, resolved)).toFixed(1)
      );

      const completionRate = Number(((resolved / Math.max(1, total)) * 100).toFixed(1));
      const speedScore = Math.max(0, 100 - avgHours * 4.2);
      const kpiScore = Number((completionRate * 0.65 + speedScore * 0.35).toFixed(1));

      let rating = 'Chuẩn';
      let ratingClass = 'bg-slate-100 text-slate-800 border-slate-300';
      if (kpiScore >= 88 && avgHours <= 6.5) {
        rating = 'Dẫn Đầu';
        ratingClass = 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
      } else if (kpiScore < 76 || avgHours > 10.5 || pending >= 2) {
        rating = 'Đôn Đốc';
        ratingClass = 'bg-slate-100 text-slate-600 border-slate-200';
      }

      return {
        ...w,
        total,
        resolved,
        processing,
        pending,
        avgHours,
        completionRate,
        kpiScore,
        rating,
        ratingClass
      };
    });

    computed.sort((a, b) => {
      if (sortBy === 'score_desc') return b.kpiScore - a.kpiScore;
      if (sortBy === 'time_asc') return a.avgHours - b.avgHours;
      if (sortBy === 'time_desc') return b.avgHours - a.avgHours;
      if (sortBy === 'rate_desc') return b.completionRate - a.completionRate;
      return a.code - b.code;
    });

    return computed.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [reports, sortBy]);

  const areaStats = useMemo(() => {
    const wardAreaMap = {};
    WARDS_95.forEach((w) => {
      wardAreaMap[w.id] = w.area;
    });

    return CLUSTERS.map((cluster) => {
      const areaWards = wardRankings.filter((w) => w.area === cluster.area);
      const areaLiveReports = reports.filter((r) => wardAreaMap[r.wardId] === cluster.area);

      const urgentCount = areaLiveReports.filter((r) => (r.urgency || 'medium') === 'urgent').length;
      const mediumCount = areaLiveReports.filter((r) => (r.urgency || 'medium') === 'medium').length;
      const slowCount = areaLiveReports.filter((r) => (r.urgency || 'medium') === 'slow').length;

      const total = areaWards.reduce((sum, w) => sum + w.total, 0);
      const resolved = areaWards.reduce((sum, w) => sum + w.resolved, 0);
      const pendingOrProcessing = areaWards.reduce((sum, w) => sum + w.pending + w.processing, 0);
      const avgHours = Number(
        (
          areaWards.reduce((sum, w) => sum + w.avgHours, 0) / Math.max(1, areaWards.length)
        ).toFixed(1)
      );
      const completionRate = Number(((resolved / Math.max(1, total)) * 100).toFixed(1));

      return {
        area: cluster.area,
        wardCount: cluster.wards.length,
        liveCount: areaLiveReports.length,
        urgentCount,
        mediumCount,
        slowCount,
        total,
        resolved,
        pendingOrProcessing,
        avgHours,
        completionRate
      };
    });
  }, [reports, wardRankings]);

  const filteredRankings = wardRankings.filter((w) => {
    if (areaFilter !== 'all' && w.area !== areaFilter) return false;
    if (
      searchQuery &&
      !w.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !String(w.code).includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  const areas = Array.from(new Set(WARDS_95.map((w) => w.area)));

  if (mode === 'area-stats') {
    return (
      <div className="space-y-6">
        {/* 4 Thẻ KPI: Khung xanh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-sky-300 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                TG XỬ LÝ TRUNG BÌNH
              </span>
              <div className="text-2xl font-extrabold text-slate-950 mt-1 font-mono">{avgProcessingHours}h</div>
              <span className="text-[11px] text-sky-800 font-medium">Trên {resolvedLive.length} hồ sơ hoàn thành</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border-2 border-sky-300 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                TỶ LỆ HOÀN TẤT
              </span>
              <div className="text-2xl font-extrabold text-sky-700 mt-1 font-mono">
                {Math.round((resolvedLive.length / Math.max(1, totalLive)) * 100)}%
              </div>
              <span className="text-[11px] text-slate-500">
                Đang xử lý: {processingLive.length} • Chờ: {pendingLive.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border-2 border-sky-300 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                ĐỘ PHỦ QUẢN TRỊ
              </span>
              <div className="text-2xl font-extrabold text-slate-950 mt-1 font-mono">95 XÃ/PHƯỜNG</div>
              <span className="text-[11px] text-slate-500">{CLUSTERS.length} Cụm khu vực Đồng Nai</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border-2 border-sky-300 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                HỒ SƠ MỨC ĐỘ GẤP
              </span>
              <div className="text-2xl font-extrabold text-slate-950 mt-1 font-mono">
                {reports.filter((r) => (r.urgency || 'medium') === 'urgent').length} VỤ
              </div>
              <span className="text-[11px] text-sky-800 font-medium">Ưu tiên điều phối ngay</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Bảng Thống kê 7 cụm khu vực */}
        <div className="bg-white border-2 border-sky-300 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 bg-sky-50 text-sky-950 border-b border-sky-200">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Map className="w-4 h-4 text-sky-600" />
              <span>Báo Cáo Hiệu Suất Theo 7 Cụm Khu Vực Tỉnh Đồng Nai</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Phân bổ số lượng phản ánh, mức độ khẩn cấp và tiến độ giải quyết từng khu vực.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Cụm Khu Vực</th>
                  <th className="py-3 px-4 font-bold text-center">Số Xã/Phường</th>
                  <th className="py-3 px-4 font-bold text-center">Phản ánh Live</th>
                  <th className="py-3 px-4 font-bold text-center">Gấp / Vừa / Chậm</th>
                  <th className="py-3 px-4 font-bold text-center">Tổng kỳ</th>
                  <th className="py-3 px-4 font-bold text-center">Đã hoàn thành</th>
                  <th className="py-3 px-4 font-bold text-center">TG Xử Lý TB</th>
                  <th className="py-3 px-4 font-bold">Tỷ lệ xong</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {areaStats.map((item) => (
                  <tr key={item.area} className="hover:bg-sky-50/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.area}</td>
                    <td className="py-3 px-4 text-center text-slate-500 font-mono">{item.wardCount}</td>
                    <td className="py-3 px-4 text-center font-bold text-sky-900 font-mono">{item.liveCount}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded font-bold">
                          {item.urgentCount}
                        </span>
                        <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded border border-sky-200">
                          {item.mediumCount}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                          {item.slowCount}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">{item.total}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-950">{item.resolved}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">{item.avgHours}h</td>
                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${item.completionRate}%` }} />
                        </div>
                        <span className="font-mono text-sky-900 text-[11px] font-bold w-10 text-right">
                          {item.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phân bổ theo Hạng mục & Tỷ lệ Gấp/Vừa/Chậm */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white border-2 border-sky-300 p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Cơ Cấu Phản Ánh Theo Hạng Mục Hạ Tầng
            </h3>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const catReports = reports.filter((r) => r.categoryId === cat.id);
                const catResolved = catReports.filter((r) => r.status === 'resolved').length;
                const pct = Math.round((catReports.length / Math.max(1, reports.length)) * 100);
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        <strong className="text-slate-950">{catReports.length}</strong> vụ ({catResolved} xong) • {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${catReports.length > 0 ? Math.max(6, pct) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border-2 border-sky-300 p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Phân Loại Theo Mức Độ Khẩn Cấp
            </h3>
            <div className="space-y-3">
              {Object.values(URGENCY_LEVELS).map((u) => {
                const count = reports.filter((r) => (r.urgency || 'medium') === u.id).length;
                const pct = Math.round((count / Math.max(1, reports.length)) * 100);
                return (
                  <div key={u.id} className="p-3.5 rounded-xl bg-sky-50/40 border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-slate-900">
                        {u.label}
                      </span>
                      <span className="font-mono text-slate-900 text-[11px] font-bold">
                        {count} phản ánh ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          u.id === 'urgent' ? 'bg-slate-900' : u.id === 'medium' ? 'bg-sky-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${count > 0 ? Math.max(6, pct) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // mode === 'ranking'
  return (
    <div className="space-y-6">
      {/* Top 3 Đơn vị dẫn đầu: Khung xanh, khi hover/chọn khung xám */}
      <div className="bg-white border-2 border-sky-300 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-900">
            <Trophy className="w-4 h-4 text-sky-600" />
            <span>Top 3 Đơn Vị Xã/Phường Dẫn Đầu Về Xử Lý Nhanh</span>
          </h3>
          <span className="text-[10px] font-mono bg-sky-50 border border-sky-200 text-sky-800 px-2.5 py-0.5 rounded-full font-bold">
            CẬP NHẬT TRỰC TUYẾN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {wardRankings.slice(0, 3).map((w, i) => (
            <div
              key={w.id}
              className="bg-sky-50/40 border-2 border-sky-300 rounded-xl p-3.5 flex items-center justify-between hover:bg-slate-200 hover:border-slate-500 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                    i === 0
                      ? 'bg-slate-900 text-white'
                      : i === 1
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-300 text-slate-800'
                  }`}
                >
                  #{i + 1}
                </span>
                <div>
                  <div className="font-bold text-xs text-slate-900">{w.name}</div>
                  <div className="text-[10px] text-slate-500">{w.area}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono text-sky-700 font-bold">{w.avgHours}h/vụ</div>
                <div className="text-[10px] font-mono text-slate-500">{w.completionRate}% ({w.kpiScore}đ)</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bảng Xếp Hạng 95 Xã/Phường */}
      <div className="bg-white border-2 border-sky-300 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 bg-sky-50 text-sky-950 border-b border-sky-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Bảng Xếp Hạng 95 Xã/Phường Tỉnh Đồng Nai
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Tổng hợp điểm hiệu suất KPI dựa trên tốc độ xử lý hiện trường và tỷ lệ giải quyết dứt điểm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên xã/phường..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border-2 border-sky-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
              />
            </div>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="text-xs bg-white border-2 border-sky-300 rounded-xl px-3 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
            >
              <option value="all">Tất cả khu vực ({WARDS_95.length})</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-white border-2 border-sky-300 rounded-xl px-3 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-slate-500 focus:bg-slate-100 transition"
            >
              <option value="score_desc">KPI cao nhất</option>
              <option value="time_asc">Xử lý nhanh nhất</option>
              <option value="rate_desc">Tỷ lệ xong cao nhất</option>
              <option value="code_asc">Mã số hành chính</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">Hạng</th>
                <th className="py-3 px-4 font-bold">Xã / Phường</th>
                <th className="py-3 px-4 font-bold">Khu Vực</th>
                <th className="py-3 px-4 font-bold text-center">Tiếp nhận</th>
                <th className="py-3 px-4 font-bold text-center">Đã xong</th>
                <th className="py-3 px-4 font-bold text-center">Đang/Chờ</th>
                <th className="py-3 px-4 font-bold text-center">TG Xử Lý</th>
                <th className="py-3 px-4 font-bold text-center">Tỷ Lệ Xong</th>
                <th className="py-3 px-4 font-bold text-center">KPI</th>
                <th className="py-3 px-4 font-bold text-right">Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRankings.map((w) => (
                <tr key={w.id} className="hover:bg-sky-50/50 transition">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-400">#{w.rank}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {w.name}
                    <span className="ml-1 text-[10px] font-mono text-slate-400 font-normal">({w.id})</span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">{w.area.replace('Khu vực ', '')}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-700">{w.total}</td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-950">{w.resolved}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-500">{w.processing + w.pending}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-700">{w.avgHours}h</td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-sky-800">{w.completionRate}%</td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">{w.kpiScore}</td>
                  <td className="py-2.5 px-4 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${w.ratingClass}`}>
                      {w.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
