import React from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

export default function GeofenceRadarCard({
  latitude = 10.957412,
  longitude = 106.842685,
  radiusM = 150,
  locationLabel = 'Địa điểm sinh hoạt Đoàn',
  distanceM = null,
  accuracyM = null
}) {
  const lat = Number(latitude || 10.957412);
  const lon = Number(longitude || 106.842685);
  const radius = Math.max(25, Number(radiusM || 150));

  const hasProbe = distanceM !== null && distanceM !== undefined && Number.isFinite(Number(distanceM));
  const dist = hasProbe ? Number(distanceM) : null;
  const inside = hasProbe ? dist <= radius : true;

  const normalizedRatio = hasProbe ? Math.min(1.28, dist / radius) : 0;
  const angleRad = -Math.PI / 4;
  const dotX = 64 + Math.cos(angleRad) * (normalizedRatio * 42);
  const dotY = 64 + Math.sin(angleRad) * (normalizedRatio * 42);

  return (
    <div className="app-subcard p-4 flex flex-wrap items-center justify-between gap-3.5 w-full min-w-0 overflow-hidden">
      <div className="flex items-center gap-3.5 min-w-0 flex-1 basis-[240px]">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-surface border border-slate-200/90 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
          <svg viewBox="0 0 128 128" className="w-full h-full" aria-hidden="true">
            <defs>
              <pattern id="geo-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#E2E8F0" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="128" height="128" fill="url(#geo-grid)" />
            <circle
              cx="64"
              cy="64"
              r="42"
              fill={inside ? 'rgba(0, 91, 172, 0.08)' : 'rgba(225, 29, 72, 0.08)'}
              stroke={inside ? '#005BAC' : '#E11D48'}
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <circle cx="64" cy="64" r="22" fill="none" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="2 2" />
            {hasProbe && (
              <>
                <line
                  x1="64"
                  y1="64"
                  x2={dotX}
                  y2={dotY}
                  stroke={inside ? '#0F766E' : '#E11D48'}
                  strokeWidth="1.5"
                />
                <circle
                  cx={dotX}
                  cy={dotY}
                  r="4.5"
                  fill={inside ? '#0F766E' : '#E11D48'}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </>
            )}
            <circle cx="64" cy="64" r="5.5" fill="#005BAC" stroke="#FFFFFF" strokeWidth="2" />
          </svg>
          <span className="absolute bottom-1 right-1 text-[11px] font-mono font-bold text-[#005BAC] bg-white/95 px-1.5 rounded">
            {radius}m
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-[15px] font-bold text-ink flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 text-[#005BAC] shrink-0" aria-hidden="true" />
            <span className="truncate">Bản đồ vùng điểm danh GPS</span>
          </div>
          <div className="text-sm text-muted truncate">{locationLabel}</div>
          <div className="font-mono text-xs sm:text-sm text-slate-600 tabular-nums truncate">
            {lat.toFixed(6)}, {lon.toFixed(6)}
          </div>
          {hasProbe ? (
            <div
              className={`inline-flex max-w-full items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border tabular-nums ${
                inside
                  ? 'bg-emerald-50 border-emerald-200 text-accent'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Cách tâm {dist}m {accuracyM ? `(±${accuracyM}m)` : ''} • {inside ? 'Trong vùng' : 'Ngoài vùng'}
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted tabular-nums">
              Bán kính hợp lệ: <strong className="text-ink">{radius}m</strong>
            </div>
          )}
        </div>
      </div>

      <a
        href={`https://www.google.com/maps?q=${lat},${lon}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-auto shrink-0 min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 bg-surface hover:bg-slate-50 hover:border-brand/45 text-sm font-semibold text-[#005BAC] inline-flex items-center justify-center gap-2 transition whitespace-nowrap"
      >
        <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
        Mở bản đồ
      </a>
    </div>
  );
}
