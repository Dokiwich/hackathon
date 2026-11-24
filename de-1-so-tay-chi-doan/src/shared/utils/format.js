import { sanitizeSafeImageSrc } from '../../utils/security';

export function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'ĐV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function resolveImageSrc(image) {
  if (!image) return '';
  const safe = sanitizeSafeImageSrc(image, '');
  if (!safe) return '';
  if (safe.startsWith('data:') || safe.startsWith('http://') || safe.startsWith('https://')) {
    return safe;
  }
  const clean = safe.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}

export function formatDateVN(value, includeTime = false) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}:\d{2}))?/);
  if (match) {
    const [, y, m, d, time] = match;
    if (includeTime && time) return `${d}/${m}/${y} ${time}`;
    return `${d}/${m}/${y}`;
  }
  return raw;
}
