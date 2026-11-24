import React from 'react';
import { X } from 'lucide-react';
import ChangePasswordForm from '../../shared/components/ChangePasswordForm';

export default function ChangePasswordModal({ open, onClose, initialIdentifier = '' }) {
  if (!open) return null;

  return (
    <div
      className="app-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-chg-pwd-title"
    >
      <div className="app-modal-panel max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 id="login-chg-pwd-title" className="text-lg font-bold text-ink">
              Đổi mật khẩu tài khoản
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Xác thực mật khẩu hiện tại trước khi lưu mật khẩu mới.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ đổi mật khẩu"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center justify-center text-muted hover:text-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ChangePasswordForm
          mode="credentials"
          initialIdentifier={initialIdentifier}
          idPrefix="login-pwd"
          submitLabel="Cập nhật mật khẩu"
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
