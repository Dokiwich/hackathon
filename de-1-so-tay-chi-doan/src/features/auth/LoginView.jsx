import React, { useEffect, useState } from 'react';
import { User, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { authenticateUser, identifyAccount } from '../../services/authService';
import ChangePasswordModal from './ChangePasswordModal';

const ROLE_BADGE_TONE = {
  branch_secretary: 'bg-sky-50 border-sky-200 text-[#005BAC]',
  ward_officer: 'bg-emerald-50 border-emerald-200 text-accent',
  member: 'bg-slate-100 border-slate-200 text-slate-800'
};

export default function LoginView({ onAuthenticated }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [detectedRole, setDetectedRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pwdModalOpen, setPwdModalOpen] = useState(false);

  useEffect(() => {
    const cleaned = identifier.trim();
    if (cleaned.length < 3) {
      setDetectedRole(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await identifyAccount(cleaned, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setDetectedRole(res?.found ? res : null);
        }
      } catch {
        if (!controller.signal.aborted) {
          setDetectedRole(null);
        }
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [identifier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const session = await authenticateUser({ identifier, password });
      onAuthenticated({ ...session, rememberMe });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#EAF3FC] via-[#F6FAFE] to-[#DCEBFA] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Subtle Civic Geometric Corner Accents matching reference */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden sm:block absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#005BAC]/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none hidden sm:block absolute -bottom-16 right-0 w-72 h-56 bg-[#005BAC] opacity-90"
        style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }}
      />

      <section className="w-full max-w-[440px] bg-surface border border-slate-200/80 rounded-2xl shadow-[0_14px_40px_rgba(15,42,88,0.09)] px-6 py-8 sm:px-9 sm:py-10 relative z-10">
        {/* Top Soft Blue User Avatar Circle */}
        <div className="w-16 h-16 rounded-full bg-[#EBF3FC] flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-[#005BAC]" strokeWidth={2.2} aria-hidden="true" />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A2B49] tracking-tight text-center uppercase">
          Đăng nhập hệ thống
        </h1>
        <p className="text-[15px] text-slate-500 mt-1.5 text-center">
          Vui lòng đăng nhập để tiếp tục
        </p>

        {/* Signature Divider + Short Blue Center Accent */}
        <div className="relative mt-5 mb-6" aria-hidden="true">
          <div className="h-px bg-slate-200/80 w-full" />
          <div className="w-12 h-[3px] rounded-full bg-[#005BAC] mx-auto -mt-[2px]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-identifier"
              className="block text-[15px] font-bold text-[#1A2B49] mb-2"
            >
              Mã đoàn viên / Tài khoản
            </label>
            <div className="relative">
              <User
                className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="login-identifier"
                name="identifier"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Nhập mã đoàn viên hoặc tài khoản"
                className="w-full h-[50px] pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005BAC] focus:ring-2 focus:ring-[#005BAC]/15 transition"
              />
            </div>

            {detectedRole && (
              <div
                className={`mt-2.5 px-3.5 py-2 rounded-xl border text-sm flex items-center gap-2 ${
                  ROLE_BADGE_TONE[detectedRole.role] || ROLE_BADGE_TONE.member
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-semibold">Tự động nhận diện: {detectedRole.roleLabel}</span>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-[15px] font-bold text-[#1A2B49] mb-2"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock
                className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full h-[50px] pl-11 pr-12 rounded-xl border border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#005BAC] focus:ring-2 focus:ring-[#005BAC]/15 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <label className="inline-flex items-center gap-2.5 text-sm sm:text-[15px] text-slate-600 cursor-pointer select-none">
              <input
                id="login-remember"
                name="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#005BAC] focus:ring-[#005BAC]"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>

            <button
              type="button"
              onClick={() => setPwdModalOpen(true)}
              className="text-sm sm:text-[15px] font-semibold text-[#005BAC] hover:underline"
            >
              Đổi mật khẩu?
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5"
            >
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[52px] px-5 rounded-xl bg-[#005BAC] hover:bg-[#004A8F] active:scale-[0.99] disabled:opacity-60 text-white text-base font-bold transition inline-flex items-center justify-center gap-2.5 shadow-sm"
          >
            <Lock className="w-5 h-5" aria-hidden="true" />
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Hệ thống tự động phân quyền theo vai trò tài khoản Đoàn.
        </p>
      </section>

      <ChangePasswordModal
        open={pwdModalOpen}
        onClose={() => setPwdModalOpen(false)}
        initialIdentifier={identifier}
      />
    </main>
  );
}
