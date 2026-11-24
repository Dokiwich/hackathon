import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  QrCode,
  Clock,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { clearAuthSession, loadAuthSession, saveAuthSession } from './services/authService';
import { getInitials } from './shared/utils/format';
import { useChiDoanStore } from './features/app/useChiDoanStore';
import LoginView from './features/auth/LoginView';
import NewsFeedView from './features/news/NewsFeedView';
import MembersView from './features/members/MembersView';
import QrAttendanceView from './features/attendance/QrAttendanceView';
import SocialHoursView from './features/social-hours/SocialHoursView';
import ReportExportView from './features/reports/ReportExportView';
import RemindersView from './features/reminders/RemindersView';
import SettingsView from './features/settings/SettingsView';

const ROLE_CHIP_STYLE = {
  ward_officer: 'bg-emerald-50 border-emerald-200 text-accent',
  branch_secretary: 'bg-sky-50 border-sky-200 text-[#005BAC]',
  member: 'bg-slate-100 border-slate-200 text-ink'
};

export default function App() {
  const [session, setSession] = useState(loadAuthSession);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const {
    info,
    news,
    allMembers,
    scopedMembers,
    scopedActivities,
    scopedLedger,
    scopedReminders,
    scopedMakeup,
    reportSummary,
    syncState,
    capabilities,
    actions
  } = useChiDoanStore(session);

  useEffect(() => {
    if (session && typeof window !== 'undefined' && window.location.hash.startsWith('#diem-danh=')) {
      navigate('/attendance');
    }
  }, [session, navigate]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onUnauthorized = () => {
      clearAuthSession();
      setSession(null);
      setMobileMenuOpen(false);
    };
    window.addEventListener('chidoan:unauthorized', onUnauthorized);
    return () => window.removeEventListener('chidoan:unauthorized', onUnauthorized);
  }, []);

  const navItems = useMemo(() => {
    const items = [{ to: '/', label: 'Tổng quan', shortLabel: 'Tổng quan', icon: LayoutDashboard, end: true }];
    if (capabilities.canViewMembersDirectory) {
      items.push({ to: '/members', label: 'Đoàn viên', shortLabel: 'Đoàn viên', icon: Users });
    }
    items.push({
      to: '/attendance',
      label: capabilities.canOrganizeQr ? 'Sự kiện & QR' : 'Quét QR & Bù',
      shortLabel: capabilities.canOrganizeQr ? 'Tạo QR' : 'Quét QR',
      icon: QrCode,
      featuredMobile: true
    });
    items.push({ to: '/social-hours', label: 'Giờ CTXH', shortLabel: 'Giờ CTXH', icon: Clock });
    if (capabilities.canViewReports) {
      items.push({ to: '/reports', label: 'Báo cáo', shortLabel: 'Báo cáo', icon: FileText });
    }
    items.push({ to: '/reminders', label: 'Nhắc lịch', shortLabel: 'Nhắc lịch', icon: Bell });
    items.push({ to: '/settings', label: 'Cài đặt', shortLabel: 'Cài đặt', icon: Settings });
    return items;
  }, [capabilities]);

  const mobileBottomItems = useMemo(() => {
    if (capabilities.canViewMembersDirectory && capabilities.canViewReports) {
      return [
        navItems.find((i) => i.to === '/'),
        navItems.find((i) => i.to === '/members'),
        navItems.find((i) => i.to === '/attendance'),
        navItems.find((i) => i.to === '/social-hours'),
        navItems.find((i) => i.to === '/reports')
      ].filter(Boolean);
    }
    return [
      navItems.find((i) => i.to === '/'),
      navItems.find((i) => i.to === '/attendance'),
      navItems.find((i) => i.to === '/social-hours'),
      navItems.find((i) => i.to === '/reminders'),
      navItems.find((i) => i.to === '/settings')
    ].filter(Boolean);
  }, [navItems, capabilities]);

  const handleAuthenticated = (nextSession) => {
    saveAuthSession(nextSession);
    const { rememberMe: _rm, ...clean } = nextSession;
    setSession(clean);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#diem-danh=')) {
      navigate('/attendance');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
    setMobileMenuOpen(false);
  };

  if (!session) {
    return <LoginView onAuthenticated={handleAuthenticated} />;
  }

  const pendingMakeupCount = scopedMakeup.filter((m) => m.status === 'pending').length;

  const renderSidebarBody = () => (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-5 border-b border-slate-200/80 flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white shadow-sm p-1.5 flex items-center justify-center shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}huy-hieu-doan.png`}
            alt="Huy hiệu Đoàn TNCS Hồ Chí Minh"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-lg text-[#005BAC] tracking-tight truncate">
            Đoàn Viên Số
          </div>
          <div className="text-sm text-muted truncate">{session.user.roleLabel}</div>
        </div>
      </div>

      <nav aria-label="Điều hướng chính" className="p-3.5 space-y-1.5 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const showBadge =
            item.to === '/attendance' && capabilities.canApproveMakeup && pendingMakeupCount > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `min-h-[48px] px-4 py-3 rounded-xl text-[15px] font-semibold flex items-center justify-between gap-2.5 transition-all duration-150 ${
                  isActive
                    ? 'bg-[#005BAC] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950'
                }`
              }
            >
              <span className="inline-flex items-center gap-3 min-w-0">
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </span>
              {showBadge && (
                <span className="px-2.5 py-0.5 rounded-full text-[13px] font-mono font-bold bg-amber-100 text-amber-800">
                  {pendingMakeupCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/80">
        <div className="p-3.5 rounded-xl bg-slate-50/85 border border-slate-200/80 space-y-3 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 text-[#005BAC] font-bold text-sm flex items-center justify-center shrink-0">
              {getInitials(session.user.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-ink truncate">{session.user.fullName}</div>
              <div
                className={`mt-1 inline-flex max-w-full overflow-hidden items-center gap-1 px-2.5 py-0.5 rounded-full border text-[13px] font-semibold ${
                  ROLE_CHIP_STYLE[session.user.role] || ROLE_CHIP_STYLE.member
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{session.user.roleLabel}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-surface hover:border-rose-300 hover:text-rose-700 text-sm font-semibold text-ink inline-flex items-center justify-center gap-1.5 transition"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-canvas text-ink">
      {/* Desktop Sticky Sidebar */}
      <aside className="no-print hidden lg:block w-[280px] shrink-0 bg-surface border-r border-slate-200/80 sticky top-0 h-screen overflow-y-auto">
        {renderSidebarBody()}
      </aside>

      {/* Mobile Sticky Frosted Top Header */}
      <header className="no-print lg:hidden bg-surface/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white p-1 shadow-sm shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}huy-hieu-doan.png`}
              alt="Huy hiệu Đoàn TNCS Hồ Chí Minh"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-base text-[#005BAC] leading-tight truncate">
              Đoàn Viên Số
            </div>
            <div className="text-[13px] sm:text-sm text-muted truncate">
              {session.user.roleLabel}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {syncState.mode === 'online' && (
            <button
              type="button"
              onClick={actions.refreshData}
              aria-label="Đồng bộ dữ liệu"
              className="w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center text-[#005BAC] active:scale-95 transition"
            >
              <RefreshCw className={`w-4 h-4 ${syncState.loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            type="button"
            aria-label="Mở menu điều hướng"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="w-11 h-11 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center text-ink active:scale-95 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Out Full Drawer */}
      {mobileMenuOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-40 flex">
          <div className="w-72 max-w-[85vw] bg-surface border-r border-slate-200 h-full shadow-2xl">
            {renderSidebarBody()}
          </div>
          <button
            type="button"
            aria-label="Đóng menu"
            className="flex-1 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area — Balanced Medium Frame */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-safe-nav lg:pb-10 max-w-5xl w-full mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                <NewsFeedView
                  info={info}
                  currentUser={session.user}
                  news={news}
                  members={scopedMembers}
                  activities={scopedActivities}
                  makeupList={scopedMakeup}
                  reminders={scopedReminders}
                  canManageNews={capabilities.canManageNews}
                  canOrganizeQr={capabilities.canOrganizeQr}
                  onAddNews={actions.addNews}
                  onUpdateNews={actions.updateNews}
                  onDeleteNews={actions.deleteNews}
                />
              }
            />
            <Route
              path="/members"
              element={
                capabilities.canViewMembersDirectory ? (
                  <MembersView
                    members={scopedMembers}
                    ledger={scopedLedger}
                    onAddMember={actions.addMember}
                    onImportMembers={actions.importMembers}
                    onUpdateMember={actions.updateMember}
                    onDeleteMember={actions.deleteMember}
                    onToggleFee={actions.toggleFee}
                    readOnly={!capabilities.canManageMembers}
                    allowBranchFilter={capabilities.canViewWardMembers}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/attendance"
              element={
                <QrAttendanceView
                  activities={scopedActivities}
                  members={scopedMembers}
                  allMembers={allMembers}
                  makeupList={scopedMakeup}
                  currentUser={session.user}
                  isOnline={syncState.mode === 'online'}
                  onRefresh={actions.refreshData}
                  onVerifyQrServer={actions.verifyQrOnServer}
                  onCheckIn={actions.checkIn}
                  onAddActivity={actions.addActivity}
                  onRotateQr={actions.rotateActivityQr}
                  onUpdateActivityLocation={actions.updateActivityLocation}
                  onCloseActivity={actions.closeActivity}
                  onDeleteActivity={actions.deleteActivity}
                  onRegisterMakeup={actions.registerMakeup}
                  onReviewMakeup={actions.reviewMakeup}
                  canOrganizeQr={capabilities.canOrganizeQr}
                  canViewBranchProgress={capabilities.canViewBranchAttendanceProgress}
                  canApproveMakeup={capabilities.canApproveMakeup}
                />
              }
            />
            <Route
              path="/social-hours"
              element={
                <SocialHoursView
                  info={info}
                  members={scopedMembers}
                  ledger={scopedLedger}
                  allowExport={capabilities.canExportHoursCsv}
                  isPersonalOnly={!capabilities.canViewMembersDirectory}
                />
              }
            />
            <Route
              path="/reports"
              element={
                capabilities.canViewReports ? (
                  <ReportExportView
                    info={info}
                    members={scopedMembers}
                    activities={scopedActivities}
                    ledger={scopedLedger}
                    makeupList={scopedMakeup}
                    reportSummary={reportSummary}
                    syncMode={syncState.mode}
                    onRefreshData={actions.refreshData}
                    currentUser={session.user}
                    canViewWardSummary={capabilities.canViewWardSummary}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/reminders"
              element={
                <RemindersView
                  reminders={scopedReminders}
                  onAddReminder={actions.addReminder}
                  onToggleReminder={actions.toggleReminder}
                  onToggleAutoNotify={actions.toggleAutoNotify}
                  onDeleteReminder={actions.deleteReminder}
                  readOnly={!capabilities.canManageReminders}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsView
                  session={session}
                  syncState={syncState}
                  onRefreshData={actions.refreshData}
                  onResetData={actions.resetData}
                  onLogout={handleLogout}
                  canResetData={capabilities.canResetDemo}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-slate-200/90 safe-bottom shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
      >
        <div className="grid grid-cols-5 px-1.5 py-1.5">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `min-h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 text-[13px] font-semibold transition-all ${
                    item.featuredMobile
                      ? isActive
                        ? 'text-[#005BAC] bg-sky-50'
                        : 'text-[#005BAC]'
                      : isActive
                        ? 'text-[#005BAC] bg-sky-50/70'
                        : 'text-slate-600 hover:text-ink'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[68px]">{item.shortLabel}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
