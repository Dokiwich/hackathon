import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Shield, FolderCheck } from 'lucide-react';

function StarterHome() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4">
      <section className="max-w-2xl w-full bg-surface border border-line rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand">
              Đề 1 • Starter Skeleton
            </span>
            <h1 className="text-xl font-bold text-ink">Sổ Tay Chi Đoàn Số</h1>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Khung cấu trúc chuẩn đã sẵn sàng triển khai tính năng: Quản lý đoàn viên, chấm công QR động, xuất báo cáo Thành đoàn 1-click và nhắc lịch sinh hoạt.
        </p>
        <div className="p-4 rounded-xl bg-canvas border border-line text-xs text-muted space-y-1.5 tabular-nums">
          <div className="font-bold text-ink flex items-center gap-1.5">
            <FolderCheck className="w-4 h-4 text-accent" aria-hidden="true" />
            Thành phần khung &amp; Design Tokens đã cấu hình
          </div>
          <p>• Tokens: bg-canvas (#F8FAFC) • bg-brand (#0066B3) • Be Vietnam Pro + JetBrains Mono</p>
          <p>• Router + BASE_URL + ErrorBoundary + SEO/PWA + CSP + ESLint + Vitest</p>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StarterHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
