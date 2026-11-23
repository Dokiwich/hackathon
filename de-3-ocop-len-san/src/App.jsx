import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sprout, FolderCheck } from 'lucide-react';

function StarterHome() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4">
      <section className="max-w-2xl w-full bg-surface border border-line rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand">
              Đề 3 • Starter Skeleton
            </span>
            <h1 className="text-xl font-bold text-ink">OCOP Đồng Nai Lên Sàn</h1>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Khung cấu trúc chuẩn đã sẵn sàng triển khai tính năng: Kết nối 150+ sản phẩm OCOP 3–4 sao lên TikTok Shop / Shopee / Lazada, Video Studio Template, Đoàn viên Affiliate và Kế hoạch 90 ngày.
        </p>
        <div className="p-4 rounded-xl bg-canvas border border-line text-xs text-muted space-y-1.5 tabular-nums">
          <div className="font-bold text-ink flex items-center gap-1.5">
            <FolderCheck className="w-4 h-4 text-accent" aria-hidden="true" />
            Thành phần khung &amp; Design Tokens đã cấu hình
          </div>
          <p>• Tokens: bg-canvas (#FAF8F5) • bg-brand (#15803D) • accent (#B45309)</p>
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
