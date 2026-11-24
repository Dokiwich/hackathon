import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { changePasswordByCredentials, changeUserPassword } from '../../services/authService';

export default function ChangePasswordForm({
  mode = 'session',
  accessToken = '',
  userId = '',
  initialIdentifier = '',
  idPrefix = 'chg-pwd',
  submitLabel = 'Xác nhận đổi mật khẩu',
  onCancel,
  onSuccess
}) {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      if (mode === 'credentials') {
        await changePasswordByCredentials({
          identifier,
          currentPassword,
          newPassword,
          confirmNewPassword
        });
      } else {
        await changeUserPassword({
          currentPassword,
          newPassword,
          confirmNewPassword,
          accessToken,
          userId
        });
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      const msg = 'Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.';
      setSuccessMsg(msg);
      if (onSuccess) onSuccess(msg);
    } catch (err) {
      setError(err.message || 'Không thể đổi mật khẩu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'credentials' && (
        <div>
          <label htmlFor={`${idPrefix}-identifier`} className="block text-sm font-semibold text-ink mb-1.5">
            Tài khoản, SĐT hoặc mã đoàn viên
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id={`${idPrefix}-identifier`}
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="VD: bithu.kp5 hoặc DN-KP5-002"
              className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-line bg-surface text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor={`${idPrefix}-current`} className="block text-sm font-semibold text-ink mb-1.5">
          Mật khẩu cũ (xác nhận)
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id={`${idPrefix}-current`}
            type={showCurrent ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Nhập mật khẩu cũ để xác nhận"
            className="w-full min-h-[46px] pl-10 pr-11 rounded-xl border border-line bg-surface text-sm text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            aria-label={showCurrent ? 'Ẩn mật khẩu cũ' : 'Hiện mật khẩu cũ'}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-lg text-muted hover:text-ink"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={mode === 'session' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-4'}>
        <div>
          <label htmlFor={`${idPrefix}-new`} className="block text-sm font-semibold text-ink mb-1.5">
            Mật khẩu mới
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id={`${idPrefix}-new`}
              type={showNew ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className="w-full min-h-[46px] pl-10 pr-11 rounded-xl border border-line bg-surface text-sm text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-lg text-muted hover:text-ink"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-confirm`} className="block text-sm font-semibold text-ink mb-1.5">
            Nhập lại mật khẩu mới
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id={`${idPrefix}-confirm`}
              type={showNew ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
              className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-line bg-surface text-sm text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className={onCancel ? 'flex items-center justify-end gap-2 pt-1' : 'pt-1'}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-line bg-surface hover:bg-canvas text-sm font-semibold text-ink"
          >
            Đóng
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold transition inline-flex items-center justify-center gap-2"
        >
          <KeyRound className="w-4 h-4" aria-hidden="true" />
          {submitting ? 'Đang cập nhật...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
