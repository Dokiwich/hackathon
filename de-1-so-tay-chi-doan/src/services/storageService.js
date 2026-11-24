export function getApiBaseUrl() {
  return (import.meta?.env?.VITE_API_BASE_URL || '').trim();
}

export function isSameOriginBrowserRuntime() {
  if (import.meta?.vitest || import.meta?.env?.VITEST) {
    return false;
  }
  return typeof window !== 'undefined' && /^https?:$/i.test(window.location?.protocol || '');
}

let cachedProbePromise = null;
let probeConfirmedOnline = false;

export function resetOnlineProbeCache() {
  cachedProbePromise = null;
  probeConfirmedOnline = false;
}

export async function isOnlineApiAvailable() {
  if (getApiBaseUrl()) return true;
  if (!isSameOriginBrowserRuntime()) return false;
  if (typeof fetch !== 'function') return false;
  if (probeConfirmedOnline) return true;

  if (!cachedProbePromise) {
    cachedProbePromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch('/api/v1/health', {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) return false;
        const json = await res.json().catch(() => null);
        const ok = Boolean(json?.ok && json?.data?.database === 'connected');
        if (ok) probeConfirmedOnline = true;
        return ok;
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
        if (!probeConfirmedOnline) {
          cachedProbePromise = null;
        }
      }
    })();
  }

  return cachedProbePromise;
}

export function loadJson(key, fallback, validator) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (typeof validator === 'function' && !validator(parsed)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
