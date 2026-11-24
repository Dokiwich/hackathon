import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Newspaper,
  QrCode,
  ArrowRight,
  X,
  Plus,
  Pencil,
  Trash2,
  Star,
  Users,
  Clock,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { formatDateVN, resolveImageSrc } from '../../shared/utils/format';
import NewsFormModal from './NewsFormModal';

const NEWS_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Phong trào', label: 'Phong trào' },
  { id: 'Chỉ đạo Đoàn', label: 'Chỉ đạo' },
  { id: 'Chi đoàn KP5', label: 'KP5' },
  { id: 'Thông báo', label: 'Thông báo' }
];

export default function NewsFeedView({
  currentUser,
  news = [],
  members = [],
  activities = [],
  makeupList = [],
  reminders = [],
  canManageNews = false,
  canOrganizeQr = false,
  onAddNews,
  onUpdateNews,
  onDeleteNews
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeArticle, setActiveArticle] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState('');

  const role = currentUser?.role || 'member';
  const selfMemberId = currentUser?.memberId || 'DV-KP5-002';

  const openEvents = useMemo(
    () => activities.filter((a) => !a.isClosed),
    [activities]
  );

  const recentRegularMeetings = useMemo(
    () =>
      activities
        .filter((a) => a.activityType === 'regular_meeting')
        .slice(0, 3),
    [activities]
  );

  const overviewStats = useMemo(() => {
    const totalMembers = members.length;
    const localCount = members.filter(
      (m) => m.trangThai === 'Đang ở địa phương' || m.residenceStatus === 'local'
    ).length;
    const farCount = members.filter(
      (m) => m.trangThai === 'Đi làm xa' || m.residenceStatus === 'migrant_worker'
    ).length;
    const totalHours = members.reduce((s, m) => s + Number(m.gioCtxh || 0), 0);
    const pendingMakeup = makeupList.filter((m) => m.status === 'pending').length;
    const myMember = members.find((m) => m.id === selfMemberId) || members[0];
    const myHours = Number(myMember?.gioCtxh || 0);
    const myAttended = activities.filter((a) =>
      (a.checkedInRecords || []).some((r) => r.memberId === selfMemberId)
    ).length;
    const pendingReminders = reminders.filter((r) => !r.daHoanThanh).length;

    return {
      totalMembers,
      localCount,
      farCount,
      totalHours,
      pendingMakeup,
      myHours,
      myRank: myHours >= 24 ? 'Xuất sắc' : myHours >= 14 ? 'Khá' : 'Đang tích lũy',
      myAttended,
      pendingReminders
    };
  }, [members, makeupList, activities, reminders, selfMemberId]);

  const filteredNews = useMemo(() => {
    if (selectedCategory === 'all') return news;
    return news.filter((item) => item.category === selectedCategory);
  }, [news, selectedCategory]);

  const featuredArticle = useMemo(
    () => filteredNews.find((item) => item.featured) || filteredNews[0] || null,
    [filteredNews]
  );

  const secondaryArticles = useMemo(() => {
    if (!featuredArticle) return [];
    return filteredNews.filter((item) => item.id !== featuredArticle.id);
  }, [filteredNews, featuredArticle]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setActionError('');
    setFormOpen(true);
  };

  const openEditModal = (item, e) => {
    if (e) e.stopPropagation();
    setEditingArticle(item);
    setActionError('');
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    setActionError('');
    try {
      if (editingArticle) {
        if (onUpdateNews) await onUpdateNews(editingArticle.id, payload);
        if (activeArticle?.id === editingArticle.id) {
          setActiveArticle({ ...editingArticle, ...payload });
        }
        return;
      }
      if (onAddNews) {
        await onAddNews({
          ...payload,
          id: `NEWS-${Date.now().toString().slice(-4)}`
        });
      }
    } catch (err) {
      setActionError(err.message || 'Không lưu được bản tin.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionError('');
    try {
      if (onDeleteNews) await onDeleteNews(deleteTarget.id);
      if (activeArticle?.id === deleteTarget.id) setActiveArticle(null);
      setDeleteTarget(null);
    } catch (err) {
      setActionError(err.message || 'Không xóa được bản tin.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Role-Specific Overview Hero + Upcoming Activities */}
      <section className="app-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs sm:text-sm font-semibold text-[#005BAC]">
              <span>{currentUser?.roleLabel || 'Đoàn viên'}</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#1A2B49] tracking-tight mt-2">
              Xin chào, {currentUser?.fullName || 'Đồng chí'}
            </h1>
            <p className="text-[15px] text-slate-600 mt-1">
              {role === 'ward_officer'
                ? 'Điều phối sự kiện QR + GPS, duyệt sinh hoạt bù và tổng hợp báo cáo tháng.'
                : role === 'branch_secretary'
                  ? 'Quản lý danh sách đoàn viên, quét QR sự kiện và duyệt sinh hoạt bù ca KCN.'
                  : 'Quét QR + GPS điểm danh sự kiện, đăng ký sinh hoạt bù khi trùng ca và tích lũy giờ CTXH.'}
            </p>
          </div>

          <Link to="/attendance" className="app-btn-primary shrink-0">
            <QrCode className="w-5 h-5" aria-hidden="true" />
            {canOrganizeQr ? 'Tạo sự kiện & QR' : 'Quét QR & Điểm danh'}
          </Link>
        </div>

        {/* 4 Medium-Large KPI Tiles */}
        {role === 'member' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 tabular-nums">
            <Link to="/social-hours" className="app-subcard p-4 hover:border-brand/45 transition">
              <div className="text-sm font-semibold text-slate-600">Giờ CTXH cá nhân</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#005BAC] mt-1">{overviewStats.myHours}h</div>
              <div className="text-sm text-accent font-semibold mt-1">{overviewStats.myRank}</div>
            </Link>
            <Link to="/attendance" className="app-subcard p-4 hover:border-brand/45 transition">
              <div className="text-sm font-semibold text-slate-600">Đã điểm danh</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">{overviewStats.myAttended} buổi</div>
              <div className="text-sm text-muted mt-1">Xác thực QR + GPS</div>
            </Link>
            <Link to="/attendance" className="app-subcard p-4 hover:border-brand/45 transition">
              <div className="text-sm font-semibold text-slate-600">Sự kiện đang mở</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-accent mt-1">{openEvents.length}</div>
              <div className="text-sm text-[#005BAC] font-semibold mt-1">Chạm để quét QR / Bù</div>
            </Link>
            <Link to="/reminders" className="app-subcard p-4 hover:border-brand/45 transition">
              <div className="text-sm font-semibold text-slate-600">Lịch nhắc sắp tới</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">{overviewStats.pendingReminders}</div>
              <div className="text-sm text-muted mt-1">Zalo OA &amp; Web Push</div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 tabular-nums">
            <Link to="/members" className="app-subcard p-4 hover:border-brand/45 transition">
              <div className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
                {role === 'ward_officer' ? 'Tổng đoàn viên' : 'Đoàn viên Chi đoàn'}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">{overviewStats.totalMembers}</div>
              <div className="text-sm text-muted mt-1">
                {overviewStats.localCount} tại chỗ • {overviewStats.farCount} đi xa
              </div>
            </Link>

            <Link to="/attendance" className="app-subcard p-4 hover:border-brand/45 transition">
              <div className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-accent" aria-hidden="true" />
                Đang mở QR / Bù ca
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-accent mt-1">{openEvents.length} sự kiện</div>
              <div className="text-sm text-[#005BAC] font-semibold mt-1">
                {overviewStats.pendingMakeup > 0
                  ? `${overviewStats.pendingMakeup} đơn xin bù chờ duyệt`
                  : 'Đã duyệt hết đơn bù'}
              </div>
            </Link>

            <Link to="/reports" className="app-subcard p-4 hover:border-brand/45 transition">
              <div className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
                3 kỳ sinh hoạt gần nhất
              </div>
              <div className="text-2xl sm:text-[26px] font-extrabold text-[#005BAC] mt-1 font-mono">
                {recentRegularMeetings.length > 0
                  ? `${recentRegularMeetings.map((m) => (m.checkedInRecords || []).length).join(' · ')} ĐV`
                  : '28 · 19 · 33 ĐV'}
              </div>
              <div className="text-sm text-muted mt-1">Số ĐV dự 3 kỳ sinh hoạt định kỳ</div>
            </Link>

            <Link to="/social-hours" className="app-subcard p-4 hover:border-brand/45 transition">
              <div className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
                Tổng giờ CTXH
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-ink mt-1">{overviewStats.totalHours}h</div>
              <div className="text-sm text-muted mt-1">Tích lũy toàn đơn vị</div>
            </Link>
          </div>
        )}

        {/* Upcoming / Active Sessions Strip */}
        {openEvents.length > 0 && (
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-sm sm:text-[15px]">
              <span className="font-bold text-ink flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
                Hoạt động sắp tới &amp; đang mở điểm danh ({openEvents.length})
              </span>
              <Link to="/attendance" className="font-semibold text-[#005BAC] hover:underline inline-flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {openEvents.slice(0, 2).map((act) => (
                <Link
                  key={act.id}
                  to="/attendance"
                  className="p-4 rounded-xl bg-slate-50/95 border border-slate-200/85 hover:border-[#005BAC]/45 flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-ink truncate">{act.tenHoatDong}</div>
                    <div className="text-sm text-muted font-mono truncate tabular-nums mt-0.5">
                      {formatDateVN(act.ngayToChuc)} ({act.khungGio}) • +{act.gioCongTacXaHoi}h
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-surface border border-slate-200 text-sm font-semibold text-[#005BAC] shrink-0">
                    {canOrganizeQr ? 'Mở QR' : 'Điểm danh'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Youth Union News Header + Category Pills */}
      <section className="app-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A2B49] flex items-center gap-2.5">
              <Newspaper className="w-6 h-6 text-[#005BAC]" aria-hidden="true" />
              Bản tin Đoàn Thanh Niên
            </h2>
            <p className="text-sm sm:text-[15px] text-slate-600 mt-0.5">
              Tin tức phong trào, chỉ đạo cơ sở và thông báo sinh hoạt Đoàn.
            </p>
          </div>

          {canManageNews && (
            <button type="button" onClick={openCreateModal} className="app-btn-primary shrink-0">
              <Plus className="w-5 h-5" aria-hidden="true" />
              Đăng tin mới
            </button>
          )}
        </div>

        {actionError && (
          <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {actionError}
          </div>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {NEWS_CATEGORIES.map((cat) => {
            const count =
              cat.id === 'all'
                ? news.length
                : news.filter((item) => item.category === cat.id).length;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[40px] px-4 py-2 rounded-full text-sm font-semibold border transition shrink-0 tabular-nums ${
                  active
                    ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-surface'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured News Hero Card */}
      {featuredArticle && (
        <button
          type="button"
          onClick={() => setActiveArticle(featuredArticle)}
          className="w-full text-left app-card-interactive overflow-hidden grid grid-cols-1 lg:grid-cols-12 group"
        >
          <div className="lg:col-span-5 relative bg-slate-100 h-56 sm:h-64 overflow-hidden">
            <img
              src={resolveImageSrc(featuredArticle.image)}
              alt={featuredArticle.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
            <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#005BAC] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 shadow-sm">
              <Star className="w-3.5 h-3.5" aria-hidden="true" />
              Tiêu điểm • {featuredArticle.category}
            </span>
          </div>

          <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-muted tabular-nums">
                <span className="font-semibold text-[#005BAC]">{featuredArticle.source}</span>
                <span>•</span>
                <span className="font-mono">{featuredArticle.publishedAt}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A2B49] group-hover:text-[#005BAC] transition line-clamp-2 leading-snug">
                {featuredArticle.title}
              </h3>
              <p className="text-[15px] sm:text-base text-slate-600 line-clamp-2 leading-relaxed">
                {featuredArticle.summary}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm pt-3.5 border-t border-slate-200/80">
              <span className="text-slate-600 inline-flex items-center gap-1.5 truncate">
                <MapPin className="w-4 h-4 text-[#005BAC] shrink-0" aria-hidden="true" />
                {featuredArticle.location}
              </span>
              <span className="font-bold text-[#005BAC] inline-flex items-center gap-1.5 shrink-0">
                Đọc chi tiết
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        </button>
      )}

      {/* Secondary News Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {secondaryArticles.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveArticle(item)}
            className="text-left app-card-interactive overflow-hidden flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={resolveImageSrc(item.image)}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-surface/95 border border-slate-200 text-xs sm:text-sm font-semibold text-ink">
                  {item.category}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm text-muted tabular-nums">
                  <span className="font-semibold text-[#005BAC] truncate">{item.source}</span>
                  <span className="font-mono shrink-0">{item.publishedAt}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#1A2B49] group-hover:text-[#005BAC] leading-snug line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-[15px] text-slate-600 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-sm">
              <span className="text-slate-600 truncate">{item.location}</span>
              <span className="font-bold text-[#005BAC] inline-flex items-center gap-1 shrink-0">
                Xem tin <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
          </button>
        ))}
      </section>

      {filteredNews.length === 0 && (
        <div className="app-card p-10 text-center text-base text-muted">
          Chưa có bản tin nào trong chuyên mục này.
        </div>
      )}

      {/* Article Reader Sheet/Modal */}
      {activeArticle && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-reader-title"
        >
          <div className="app-modal-panel max-w-2xl">
            <div className="relative h-56 sm:h-64 bg-slate-100">
              <img
                src={resolveImageSrc(activeArticle.image)}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="Đóng bản tin"
                className="absolute top-3.5 right-3.5 w-11 h-11 rounded-full bg-surface/95 border border-slate-200 text-ink inline-flex items-center justify-center shadow-sm hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted tabular-nums">
                <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#005BAC] font-semibold">
                  {activeArticle.category}
                </span>
                <span className="font-semibold text-ink">{activeArticle.source}</span>
                <span>•</span>
                <span className="font-mono inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  {activeArticle.publishedAt}
                </span>
              </div>

              <h2 id="news-reader-title" className="text-xl sm:text-2xl font-bold text-[#1A2B49] leading-snug">
                {activeArticle.title}
              </h2>

              <div className="text-sm text-slate-600 inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#005BAC]" aria-hidden="true" />
                {activeArticle.location}
              </div>

              <p className="text-base font-medium text-ink app-subcard p-4 leading-relaxed">
                {activeArticle.summary}
              </p>

              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {activeArticle.content}
              </p>

              <div className="pt-3 flex flex-wrap justify-between gap-2.5 border-t border-slate-200/80">
                {canManageNews ? (
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(activeArticle)}
                      className="app-btn-secondary text-[#005BAC]"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                      Sửa bài
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(activeArticle)}
                      className="min-h-[46px] px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[15px] font-semibold text-rose-700 inline-flex items-center gap-2 transition"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      Xóa bài
                    </button>
                  </div>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="app-btn-primary"
                >
                  Đóng bản tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NewsFormModal
        open={formOpen}
        article={editingArticle}
        onClose={() => {
          setFormOpen(false);
          setEditingArticle(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {deleteTarget && (
        <div
          className="app-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-news-title"
        >
          <div className="app-modal-panel max-w-md p-6 space-y-4">
            <h2 id="delete-news-title" className="text-lg font-bold text-ink">
              Xác nhận xóa bài viết?
            </h2>
            <p className="text-[15px] text-slate-600">
              Bài viết <strong className="text-ink">&ldquo;{deleteTarget.title}&rdquo;</strong> sẽ bị xóa khỏi bảng tin.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="app-btn-secondary"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[15px] font-semibold transition"
              >
                Xóa bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
