import {
  INITIAL_ACTIVITIES,
  INITIAL_CHI_DOAN_INFO,
  INITIAL_MAKEUP_REGISTRATIONS,
  INITIAL_REMINDERS,
  INITIAL_SOCIAL_LEDGER,
  INITIAL_WARD_MEMBERS,
  YOUTH_UNION_NEWS
} from '../data/chiDoanData';
import { apiRequest } from './apiClient';
import { getApiBaseUrl, loadJson, saveJson } from './storageService';

const STORAGE_KEY = 'dong_nai_chi_doan_kp5_v6';

export function getDefaultChiDoanState() {
  return {
    info: INITIAL_CHI_DOAN_INFO,
    members: INITIAL_WARD_MEMBERS,
    activities: INITIAL_ACTIVITIES,
    ledger: INITIAL_SOCIAL_LEDGER,
    reminders: INITIAL_REMINDERS,
    news: YOUTH_UNION_NEWS,
    makeupRegistrations: INITIAL_MAKEUP_REGISTRATIONS
  };
}

export function loadChiDoanState() {
  return loadJson(
    STORAGE_KEY,
    getDefaultChiDoanState(),
    (parsed) =>
      Array.isArray(parsed?.members) &&
      Array.isArray(parsed?.activities) &&
      Array.isArray(parsed?.reminders) &&
      Array.isArray(parsed?.ledger) &&
      Array.isArray(parsed?.news)
  );
}

export function saveChiDoanState(state) {
  return saveJson(STORAGE_KEY, state);
}

export function isRemoteApiConfigured() {
  return Boolean(getApiBaseUrl());
}

export async function syncHealthWithBackend() {
  if (!isRemoteApiConfigured()) return null;
  return apiRequest('/api/v1/health');
}
