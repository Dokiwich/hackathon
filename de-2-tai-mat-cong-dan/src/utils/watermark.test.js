import { describe, it, expect } from 'vitest';
import { formatDateTimeVN } from './watermark';
import { WARDS_95 } from '../data/wardsData';
import { loadJson, saveJson } from '../services/storageService';

describe('Đề 2 core data & watermark helpers', () => {
  it('formats Vietnamese date-time consistently', () => {
    const sample = new Date(2026, 10, 23, 8, 5, 9);
    expect(formatDateTimeVN(sample)).toBe('23/11/2026 08:05:09');
  });

  it('keeps at least 95 administrative units of Đồng Nai with unique IDs', () => {
    expect(WARDS_95.length).toBeGreaterThanOrEqual(95);
    const ids = new Set(WARDS_95.map((w) => w.id));
    expect(ids.size).toBe(WARDS_95.length);
  });

  it('loads fallback when validator rejects corrupted storage payload', () => {
    const prev = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: () => JSON.stringify({ role: 'admin_spoof' }),
      setItem: () => {}
    };
    try {
      const result = loadJson(
        'auth_test',
        { role: 'citizen' },
        (v) => v?.role === 'citizen' || v?.role === 'agency'
      );
      expect(result).toEqual({ role: 'citizen' });
      expect(saveJson('auth_test', { role: 'citizen' })).toBe(true);
    } finally {
      globalThis.localStorage = prev;
    }
  });
});
