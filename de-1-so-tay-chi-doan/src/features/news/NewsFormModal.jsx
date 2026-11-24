import React, { useEffect, useState } from 'react';
import { X, Save, ImagePlus } from 'lucide-react';
import { NEWS_IMAGE_PRESETS } from '../../data/chiDoanData';
import { resolveImageSrc } from '../../shared/utils/format';

const NEWS_CATEGORIES = ['Phong trào', 'Chỉ đạo Đoàn', 'Chi đoàn KP5', 'Thông báo'];

function getInitialForm(article) {
  if (article) {
    return {
      title: article.title || '',
      category: article.category || 'Phong trào',
      source: article.source || 'Đoàn Phường Tam Hiệp',
      location: article.location || 'Phường Tam Hiệp, TP. Biên Hòa',
      publishedAt: article.publishedAt || new Date().toLocaleDateString('vi-VN'),
      image: article.image || NEWS_IMAGE_PRESETS[0].path,
      summary: article.summary || '',
      content: article.content || '',
      featured: Boolean(article.featured)
    };
  }
  return {
    title: '',
    category: 'Phong trào',
    source: 'Đoàn Phường Tam Hiệp',
    location: 'Phường Tam Hiệp, TP. Biên Hòa',
    publishedAt: new Date().toLocaleDateString('vi-VN'),
    image: NEWS_IMAGE_PRESETS[0].path,
    summary: '',
    content: '',
    featured: false
  };
}

export default function NewsFormModal({
  open,
  article = null,
  onClose,
  onSubmit
}) {
  const [form, setForm] = useState(() => getInitialForm(article));
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(getInitialForm(article));
      setUploadError('');
    }
  }, [open, article]);

  if (!open) return null;

  const isEditing = Boolean(article);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(file.type)) {
      setUploadError('Chỉ chấp nhận ảnh PNG, JPG hoặc WEBP (chặn SVG/script để bảo mật).');
      e.target.value = '';
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError('Ảnh vượt quá 1.5MB. Vui lòng chọn ảnh nhẹ hơn hoặc dùng ảnh mẫu.');
      e.target.value = '';
      return;
    }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, image: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) return;
    onSubmit({
      ...form,
      title: form.title.trim(),
      source: form.source.trim() || 'Đoàn Phường Tam Hiệp',
      location: form.location.trim() || 'Phường Tam Hiệp',
      publishedAt: form.publishedAt.trim() || new Date().toLocaleDateString('vi-VN'),
      summary: form.summary.trim(),
      content: form.content.trim() || form.summary.trim()
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-form-modal-title"
    >
      <form
        onSubmit={handleSave}
        className="bg-surface border border-line rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="news-form-modal-title" className="text-lg font-bold text-ink">
              {isEditing ? 'Chỉnh sửa bài viết Đoàn' : 'Đăng tin tức Đoàn mới'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Tin tức hiển thị ngay trên mục Tổng quan cho toàn bộ Cán bộ, Bí thư và Đoàn viên.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng biểu mẫu tin tức"
            className="w-9 h-9 rounded-xl border border-line bg-canvas hover:bg-surface inline-flex items-center justify-center text-muted hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="news-title" className="block text-xs font-semibold text-ink mb-1">
              Tiêu đề bài viết *
            </label>
            <input
              id="news-title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Phát động Ngày Chủ Nhật Xanh tại 6 Khu phố"
              className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm text-ink"
            />
          </div>

          <div>
            <label htmlFor="news-category" className="block text-xs font-semibold text-ink mb-1">
              Chuyên mục
            </label>
            <select
              id="news-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm text-ink"
            >
              {NEWS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="news-source" className="block text-xs font-semibold text-ink mb-1">
              Đơn vị đăng
            </label>
            <input
              id="news-source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm text-ink"
            />
          </div>

          <div>
            <label htmlFor="news-location" className="block text-xs font-semibold text-ink mb-1">
              Địa điểm diễn ra
            </label>
            <input
              id="news-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm text-ink"
            />
          </div>

          <div>
            <label htmlFor="news-date" className="block text-xs font-semibold text-ink mb-1">
              Ngày đăng
            </label>
            <input
              id="news-date"
              value={form.publishedAt}
              onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
              className="w-full min-h-[44px] px-3 rounded-xl border border-line bg-surface text-sm font-mono text-ink"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-ink">Ảnh bìa bài viết (chọn ảnh mẫu hoặc tải lên)</span>
            <label className="min-h-[36px] px-3 py-1.5 rounded-xl border border-line bg-canvas hover:bg-surface text-xs font-semibold text-brand inline-flex items-center gap-1.5 cursor-pointer">
              <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
              Tải ảnh từ máy
              <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {NEWS_IMAGE_PRESETS.map((preset) => {
              const selected = form.image === preset.path;
              return (
                <button
                  key={preset.path}
                  type="button"
                  onClick={() => setForm({ ...form, image: preset.path })}
                  className={`p-1.5 rounded-xl border text-left transition ${
                    selected
                      ? 'border-brand ring-2 ring-brand/20 bg-sky-50'
                      : 'border-line bg-canvas hover:bg-surface'
                  }`}
                >
                  <img
                    src={resolveImageSrc(preset.path)}
                    alt={preset.label}
                    className="w-full h-14 object-cover rounded-lg"
                  />
                  <div className="text-[11px] font-semibold text-ink mt-1 truncate">
                    {preset.label}
                  </div>
                </button>
              );
            })}
          </div>

          {uploadError && (
            <p className="text-xs text-rose-700 font-medium">{uploadError}</p>
          )}
        </div>

        <div>
          <label htmlFor="news-summary" className="block text-xs font-semibold text-ink mb-1">
            Tóm tắt ngắn *
          </label>
          <textarea
            id="news-summary"
            required
            rows={2}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="Mô tả ngắn gọn 1–2 câu hiển thị ngoài bảng tin..."
            className="w-full p-3 rounded-xl border border-line bg-surface text-sm text-ink"
          />
        </div>

        <div>
          <label htmlFor="news-content" className="block text-xs font-semibold text-ink mb-1">
            Nội dung chi tiết
          </label>
          <textarea
            id="news-content"
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Nội dung đầy đủ khi bấm Xem chi tiết..."
            className="w-full p-3 rounded-xl border border-line bg-surface text-sm text-ink"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            className="w-4 h-4 rounded border-line text-brand"
          />
          Ghim làm tin nổi bật trên đầu trang
        </label>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-line bg-surface hover:bg-canvas text-sm font-semibold text-ink"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {isEditing ? 'Lưu thay đổi' : 'Đăng bài viết'}
          </button>
        </div>
      </form>
    </div>
  );
}
