import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Camera,
  Map,
  Shield,
  BarChart3,
  RotateCcw,
  LogIn,
  Wrench,
  CheckCheck,
  Trophy,
  LogOut,
  Building,
  User
} from 'lucide-react';
import { INITIAL_REPORTS, WARDS_95 } from './data/wardsData';
import { formatDateTimeVN } from './utils/watermark';
import ReportForm from './components/ReportForm';
import PublicMap from './components/PublicMap';
import WardDispatch from './components/WardDispatch';
import DashboardStats from './components/DashboardStats';
import LoginView from './components/LoginView';

const STORAGE_KEY = 'dong_nai_citizen_reports_v2';
const AUTH_STORAGE_KEY = 'dong_nai_auth_role_v2';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.role === 'citizen' || parsed?.role === 'agency') {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return {
      role: 'citizen',
      label: 'Nguyễn Minh Tâm • Phường Tam Hiệp',
      agencyWardId: 'all',
      account: {
        id: 'ACC-ND-01',
        fullName: 'Nguyễn Minh Tâm',
        phone: '0918 123 456'
      }
    };
  });

  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r) => ({ ...r, urgency: r.urgency || 'medium' }));
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_REPORTS;
  });

  const [focusReportId, setFocusReportId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch {
      // Quota
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } catch {
      // Quota
    }
  }, [auth]);

  function handleLogin(role, info = {}) {
    setAuth({
      role,
      label: info.label || (role === 'agency' ? 'Cán bộ quản lý' : 'Công dân'),
      agencyWardId: info.agencyWardId || 'all',
      account: info.account || null
    });
  }

  function handleLogout() {
    setAuth({
      role: 'citizen',
      label: 'Khách vãng lai',
      agencyWardId: 'all',
      account: null
    });
    navigate('/login');
  }

  function handleAddReport(payload) {
    const nextNumber = String(reports.length + 1).padStart(3, '0');
    const nowIso = new Date().toISOString();
    const newReport = {
      id: `PA-2026-${nextNumber}`,
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      customCategoryName: payload.customCategoryName || '',
      urgency: payload.urgency || 'medium',
      wardId: payload.wardId,
      wardName: payload.wardName,
      lat: payload.lat,
      lng: payload.lng,
      accuracy: payload.accuracy,
      addressNote: payload.addressNote,
      status: 'pending',
      reporterName: payload.reporterName || auth?.account?.fullName || 'Công dân',
      reporterPhone: payload.reporterPhone || auth?.account?.phone || '',
      createdAt: nowIso,
      updatedAt: nowIso,
      resolvedAt: null,
      processingHours: null,
      assignedOfficer: '',
      progressNote: 'Đã tiếp nhận hồ sơ từ hiện trường. Chờ phân công cán bộ xử lý.',
      photoUrl: payload.photoUrl,
      history: [
        {
          time: payload.capturedAtStr || formatDateTimeVN(new Date()),
          actor: payload.reporterName || 'Công dân',
          note: `Chụp ảnh hiện trường kèm tọa độ GPS (${payload.lat.toFixed(5)}, ${payload.lng.toFixed(
            5
          )}) gửi tới ${payload.wardName}.`
        }
      ]
    };

    setReports((prev) => [newReport, ...prev]);
    return newReport;
  }

  function handleUpdateReport(reportId, updates) {
    const nowStr = formatDateTimeVN(new Date());
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;
        const nextHistory = [
          ...(rep.history || []),
          {
            time: nowStr,
            actor: updates.assignedOfficer || `UBND ${rep.wardName}`,
            note: `${
              updates.status === 'resolved'
                ? `Đã nghiệm thu hoàn thành (${updates.processingHours}h): `
                : 'Tiến độ phân công: '
            }${updates.progressNote}`
          }
        ];
        return {
          ...rep,
          ...updates,
          updatedAt: new Date().toISOString(),
          resolvedAt: updates.status === 'resolved' ? new Date().toISOString() : rep.resolvedAt,
          history: nextHistory
        };
      })
    );
  }

  function handleResetSampleData() {
    localStorage.removeItem(STORAGE_KEY);
    setReports(INITIAL_REPORTS);
  }

  function handleOpenMapFocus(reportId) {
    setFocusReportId(reportId);
    navigate('/citizen/map');
  }

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const processingCount = reports.filter((r) => r.status === 'processing').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const isLoginPage = location.pathname === '/login';
  const isAgencyRole = auth.role === 'agency';

  // Style NavLink: Mặc định khung xanh biển nhạt, khi chọn (active) chuyển sang khung xám
  const navLinkClass = ({ isActive }) =>
    `px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition border-2 ${
      isActive
        ? 'bg-slate-200 text-slate-900 border-slate-500 shadow-sm'
        : 'bg-sky-50/60 text-sky-900 border-sky-300 hover:bg-sky-100 hover:border-sky-400'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* HEADER: Nền trắng, khung viền xanh biển nhạt */}
      <header className="bg-white/95 border-b-2 border-sky-300 sticky top-0 z-40 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-900 border-2 border-sky-400 flex items-center justify-center font-black text-sm tracking-tight shadow-sm">
              ĐN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-slate-950">
                  TAI MẮT CÔNG DÂN ĐỒNG NAI
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-sky-300 bg-sky-50 text-sky-800 font-bold uppercase">
                  {isAgencyRole ? 'Cổng Cơ Quan' : 'Cổng Người Dân'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {auth.label}
              </p>
            </div>
          </div>

          {/* Thanh điều hướng */}
          <nav className="flex flex-wrap items-center gap-1.5">
            {!isLoginPage && !isAgencyRole && (
              <>
                <NavLink to="/citizen" end className={navLinkClass}>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Gửi Phản Ánh</span>
                </NavLink>
                <NavLink to="/citizen/map" className={navLinkClass}>
                  <Map className="w-3.5 h-3.5" />
                  <span>Bản Đồ ({reports.length})</span>
                </NavLink>
              </>
            )}

            {!isLoginPage && isAgencyRole && (
              <>
                <NavLink to="/agency/dispatch" className={navLinkClass}>
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Phân Công</span>
                  {pendingCount + processingCount > 0 && (
                    <span className="bg-sky-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                      {pendingCount + processingCount}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/agency/completed" className={navLinkClass}>
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Hoàn Thành ({resolvedCount})</span>
                </NavLink>
                <NavLink to="/agency/ranking" className={navLinkClass}>
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Bảng Xếp Hạng</span>
                </NavLink>
                <NavLink to="/agency/area-stats" className={navLinkClass}>
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Thống Kê Khu Vực</span>
                </NavLink>
              </>
            )}

            {/* Tag Đăng Nhập */}
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-2 transition ${
                  isActive
                    ? 'bg-slate-200 text-slate-900 border-slate-500 shadow-sm'
                    : 'bg-sky-50/60 text-sky-900 border-sky-300 hover:bg-sky-100 hover:border-sky-400'
                }`
              }
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng Nhập</span>
            </NavLink>

            {auth.account && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl border-2 border-sky-300 bg-sky-50/50 text-sky-800 hover:bg-slate-200 hover:border-slate-500 hover:text-slate-900 transition"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* VÙNG NỘI DUNG CHÍNH */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={isAgencyRole ? '/agency/dispatch' : '/citizen'} replace />}
          />

          <Route
            path="/login"
            element={<LoginView currentRole={auth.role} onLogin={handleLogin} />}
          />

          {/* Giao diện Người dân */}
          <Route
            path="/citizen"
            element={
              !isAgencyRole ? (
                <ReportForm onSubmitReport={handleAddReport} userAccount={auth.account} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/citizen/map"
            element={
              <PublicMap
                reports={reports}
                initialSelectedId={focusReportId}
                onSelectReport={(r) => setFocusReportId(r.id)}
              />
            }
          />

          {/* Giao diện Cơ quan */}
          <Route
            path="/agency/dispatch"
            element={
              isAgencyRole ? (
                <WardDispatch
                  reports={reports}
                  onUpdateReport={handleUpdateReport}
                  mode="dispatch"
                  defaultWardId={auth.agencyWardId}
                  onOpenMapFocus={handleOpenMapFocus}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/agency/completed"
            element={
              isAgencyRole ? (
                <WardDispatch
                  reports={reports}
                  onUpdateReport={handleUpdateReport}
                  mode="completed"
                  defaultWardId={auth.agencyWardId}
                  onOpenMapFocus={handleOpenMapFocus}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/agency/ranking"
            element={
              isAgencyRole ? (
                <DashboardStats reports={reports} mode="ranking" />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/agency/area-stats"
            element={
              isAgencyRole ? (
                <DashboardStats reports={reports} mode="area-stats" />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="*"
            element={<Navigate to={isAgencyRole ? '/agency/dispatch' : '/citizen'} replace />}
          />
        </Routes>
      </main>

      {/* FOOTER: Nền trắng, khung xám viền đen nhẹ */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-[11px]">
            HỆ THỐNG TAI MẮT CÔNG DÂN TỈNH ĐỒNG NAI • 95 ĐƠN VỊ HÀNH CHÍNH • TỔNG HỒ SƠ: {reports.length}
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/pitch-deck.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-sky-300 bg-sky-50 text-sky-900 hover:bg-slate-200 hover:border-slate-500 hover:text-slate-900 transition font-mono text-[11px] font-bold"
            >
              📊 Pitch Deck (10 Slide) & 7 Mockup
            </a>
            <button
              type="button"
              onClick={handleResetSampleData}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition font-mono text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              Khôi phục dữ liệu gốc
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
