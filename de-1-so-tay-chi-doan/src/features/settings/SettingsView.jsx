import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  X,
  ArrowRight,
  LogOut
} from 'lucide-react';
import ChangePasswordForm from '../../shared/components/ChangePasswordForm';
import { getInitials } from '../../shared/utils/format';
import {
  BASE_MEMBER_CAPABILITIES,
  CAPABILITY_LABELS,
  getUserCapabilities
} from '../auth/permissions';

export default function SettingsView({
  session,
  syncState = { mode: 'offline', loading: false, lastSyncedAt: null },
  onRefreshData,
  onResetData,
  onLogout,
  canResetData = false
}) {
  const user = session.user;
  const [resetSuccess, setResetSuccess] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [permsOpen, setPermsOpen] = useState(false);

  const capabilities = useMemo(() => getUserCapabilities(user), [user]);
  const baseSet = useMemo(() => new Set(BASE_MEMBER_CAPABILITIES), []);

  const handleReset = () => {
    if (!canResetData || !onResetData) return;
    onResetData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <section className="app-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 text-[#005BAC] font-bold text-base flex items-center justify-center shrink-0">
            {getInitials(user.fullName)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink truncate">{user.fullName}</h1>
            <div className="text-sm font-mono text-muted truncate mt-0.5">
              @{user.username} • {user.roleLabel}
            </div>
          </div>
        </div>

        {syncState.mode === 'online' && onRefreshData && (
          <button
            type="button"
            onClick={onRefreshData}
            aria-label="Đồng bộ dữ liệu ngay"
            className="app-btn-secondary min-h-[42px] text-sm shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-[#005BAC] ${syncState.loading ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </button>
        )}
      </section>

      <section className="app-card divide-y divide-slate-200/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setPwdOpen(true)}
          className="w-full text-left p-5 sm:px-6 flex items-center justify-between gap-3.5 hover:bg-slate-50/80 transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-[#005BAC] flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-base font-bold text-ink">Đổi mật khẩu tài khoản</div>
              <div className="text-sm text-slate-600 mt-0.5">
                Xác thực mật khẩu cũ và tự động khóa các phiên đăng nhập cũ
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted shrink-0" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setPermsOpen(true)}
          className="w-full text-left p-5 sm:px-6 flex items-center justify-between gap-3.5 hover:bg-slate-50/80 transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-accent flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-base font-bold text-ink">Quyền hạn &amp; Kế thừa vai trò</div>
              <div className="text-sm text-slate-600 mt-0.5">
                {capabilities.length} quyền đang kích hoạt cho tài khoản này
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted shrink-0" aria-hidden="true" />
        </button>

        {canResetData && onResetData && syncState.mode !== 'online' && (
          <div className="p-5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted">
              {resetSuccess ? (
                <span className="text-accent font-semibold inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Đã khôi phục dữ liệu mẫu.
                </span>
              ) : (
                'Khôi phục dữ liệu mẫu cục bộ khi chạy ngoại tuyến'
              )}
            </div>
            <button type="button" onClick={handleReset} className="app-btn-secondary">
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Reset dữ liệu mẫu
            </button>
          </div>
        )}

        {onLogout && (
          <div className="p-5 sm:px-6 flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600">Kết thúc phiên làm việc trên thiết bị này</div>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[46px] px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[15px] font-semibold text-rose-700 inline-flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
        )}
      </section>

      {pwdOpen && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="app-modal-panel max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Đổi mật khẩu tài khoản</h2>
              <button
                type="button"
                onClick={() => setPwdOpen(false)}
                aria-label="Đóng"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ChangePasswordForm
              mode="session"
              accessToken={session.accessToken}
              userId={user.id}
              idPrefix="set-pwd"
              submitLabel="Cập nhật mật khẩu mới"
              onCancel={() => setPwdOpen(false)}
            />
          </div>
        </div>
      )}

      {permsOpen && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="app-modal-panel max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Chi tiết quyền hạn ({user.roleLabel})</h2>
              <button
                type="button"
                onClick={() => setPermsOpen(false)}
                aria-label="Đóng"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2.5 text-sm sm:text-[15px] text-slate-700 list-disc pl-5 max-h-[60vh] overflow-y-auto">
              {capabilities.map((cap) => (
                <li key={cap}>
                  {CAPABILITY_LABELS[cap] || cap}
                  {user.role !== 'member' && baseSet.has(cap) && (
                    <span className="ml-1.5 text-xs font-mono text-[#005BAC]">(kế thừa Đoàn viên)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
