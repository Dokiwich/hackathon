import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../../services/apiClient';
import {
  getDefaultChiDoanState,
  loadChiDoanState,
  saveChiDoanState
} from '../../services/chiDoanService';
import { createDynamicQrSession } from '../../utils/qrToken';
import {
  sanitizePlainText,
  validateActivityInput,
  validateMemberInput,
  validateNewsInput
} from '../../utils/security';
import { hasAnyCapability, hasCapability } from '../auth/permissions';

export function useChiDoanStore(session) {
  const user = session?.user || null;
  const accessToken = session?.accessToken || '';
  const isOnlineSession = Boolean(
    session?.mode === 'api' && accessToken && !String(accessToken).startsWith('local-session-')
  );

  const [state, setState] = useState(loadChiDoanState);
  const [reportSummary, setReportSummary] = useState(null);
  const [syncState, setSyncState] = useState({
    mode: isOnlineSession ? 'online' : 'offline',
    loading: false,
    lastSyncedAt: null,
    error: ''
  });
  const lastSyncMsRef = useRef(0);

  useEffect(() => {
    saveChiDoanState(state);
  }, [state]);

  const branchId = user?.branchId || 'BR-KP5';
  const canReadWardMembers = hasCapability(user, 'members:read_ward');
  const canReadBranchMembers = hasCapability(user, 'members:read_branch');
  const canWriteBranchMembers = hasCapability(user, 'members:write_branch');
  const canWriteNews = hasCapability(user, 'news:write');
  const canCreateWardEvent = hasCapability(user, 'events:create_ward');
  const canIssueWardQr = hasCapability(user, 'qr:issue_ward');
  const canManageWardAtt = hasCapability(user, 'attendance:manage_ward');
  const canScanQrGps = hasCapability(user, 'attendance:scan_qr_gps');
  const canViewBranchProgress = hasCapability(user, 'attendance:view_branch_progress');
  const canRegisterMakeup = hasCapability(user, 'makeup:register');
  const canApproveMakeup = hasCapability(user, 'makeup:approve');
  const canWriteWardReminders = hasCapability(user, 'reminders:write_ward');
  const canWriteBranchReminders = hasCapability(user, 'reminders:write_branch');
  const canViewReports = hasAnyCapability(user, ['reports:branch', 'reports:ward_summary']);
  const canResetDemo = hasCapability(user, 'data:reset_demo');

  const refreshData = useCallback(async () => {
    if (!isOnlineSession) {
      setSyncState((prev) => ({ ...prev, mode: 'offline', loading: false }));
      return;
    }

    lastSyncMsRef.current = Date.now();
    setSyncState((prev) => ({ ...prev, mode: 'online', loading: true, error: '' }));
    try {
      const membersPromise =
        canReadWardMembers || canReadBranchMembers
          ? apiRequest('/api/v1/members', { token: accessToken })
          : apiRequest('/api/v1/members/me', { token: accessToken }).then((m) => (m ? [m] : []));

      const summaryPromise = canViewReports
        ? apiRequest('/api/v1/reports/summary', { token: accessToken }).catch(() => null)
        : Promise.resolve(null);

      const [
        newsList,
        membersList,
        activitiesList,
        remindersList,
        ledgerList,
        makeupList,
        summaryData
      ] = await Promise.all([
        apiRequest('/api/v1/news', { token: accessToken }),
        membersPromise,
        apiRequest('/api/v1/attendance/activities', { token: accessToken }),
        apiRequest('/api/v1/reminders', { token: accessToken }),
        apiRequest('/api/v1/members/ledger', { token: accessToken }).catch(() => []),
        apiRequest('/api/v1/attendance/makeup', { token: accessToken }).catch(() => []),
        summaryPromise
      ]);

      setState((prev) => ({
        ...prev,
        news: Array.isArray(newsList) ? newsList : prev.news,
        members: Array.isArray(membersList) ? membersList : prev.members,
        activities: Array.isArray(activitiesList) ? activitiesList : prev.activities,
        reminders: Array.isArray(remindersList) ? remindersList : prev.reminders,
        ledger: Array.isArray(ledgerList) ? ledgerList : prev.ledger,
        makeupRegistrations: Array.isArray(makeupList) ? makeupList : prev.makeupRegistrations || []
      }));
      if (summaryData) {
        setReportSummary(summaryData);
      }
      setSyncState({
        mode: 'online',
        loading: false,
        lastSyncedAt: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        error: ''
      });
    } catch (err) {
      setSyncState((prev) => ({
        ...prev,
        mode: 'offline',
        loading: false,
        error: err.message || 'Không đồng bộ được với máy chủ.'
      }));
    }
  }, [isOnlineSession, accessToken, canReadWardMembers, canReadBranchMembers, canViewReports]);

  useEffect(() => {
    if (user && isOnlineSession) {
      refreshData();
    } else {
      setSyncState({ mode: 'offline', loading: false, lastSyncedAt: null, error: '' });
      setReportSummary(null);
    }
  }, [user?.id, isOnlineSession, refreshData, user]);

  // Automatic cross-tab / cross-role live sync when switching windows or regaining focus
  useEffect(() => {
    if (!user || !isOnlineSession || typeof window === 'undefined') return undefined;
    const handleFocusSync = () => {
      if (!document.hidden && Date.now() - lastSyncMsRef.current > 8000) {
        refreshData();
      }
    };
    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);
    return () => {
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
    };
  }, [user, isOnlineSession, refreshData]);

  const scopedMembers = useMemo(() => {
    if (canReadWardMembers) return state.members;
    if (canReadBranchMembers) {
      return state.members.filter((m) => (m.branchId || 'BR-KP5') === branchId);
    }
    return state.members.filter((m) => m.id === user?.memberId);
  }, [state.members, canReadWardMembers, canReadBranchMembers, branchId, user?.memberId]);

  const scopedMemberIds = useMemo(() => new Set(scopedMembers.map((m) => m.id)), [scopedMembers]);

  const scopedActivities = useMemo(() => {
    if (canReadWardMembers) return state.activities;
    return state.activities.filter(
      (a) => a.scope === 'ward' || (a.branchId || 'BR-KP5') === branchId
    );
  }, [state.activities, canReadWardMembers, branchId]);

  const scopedLedger = useMemo(() => {
    if (hasCapability(user, 'hours:read_ward')) return state.ledger;
    if (hasCapability(user, 'hours:read_branch')) {
      return state.ledger.filter((l) => scopedMemberIds.has(l.memberId));
    }
    return state.ledger.filter((l) => l.memberId === user?.memberId);
  }, [state.ledger, user, scopedMemberIds]);

  const scopedReminders = useMemo(() => {
    const base = canWriteWardReminders
      ? state.reminders
      : state.reminders.filter((r) => r.scope === 'ward' || (r.branchId || 'BR-KP5') === branchId);
    if (user?.role === 'member') {
      const internalAdminRe = /(chốt báo cáo|gửi đoàn phường|tổng hợp danh sách|thu đoàn phí|còn \d+ đv chưa đóng)/i;
      return base.filter((r) => !internalAdminRe.test(r.tieuDe || ''));
    }
    return base;
  }, [state.reminders, canWriteWardReminders, branchId, user?.role]);

  const scopedMakeupRegistrations = useMemo(() => {
    const list = state.makeupRegistrations || [];
    if (canReadWardMembers) return list;
    if (canReadBranchMembers) {
      return list.filter((item) => (item.branchId || 'BR-KP5') === branchId);
    }
    return list.filter((item) => item.memberId === user?.memberId);
  }, [state.makeupRegistrations, canReadWardMembers, canReadBranchMembers, branchId, user?.memberId]);

  const addMember = async (member) => {
    if (!canWriteBranchMembers) return;
    const validated = validateMemberInput(member);
    if (isOnlineSession) {
      await apiRequest('/api/v1/members', {
        method: 'POST',
        token: accessToken,
        body: validated
      });
      await refreshData();
      return;
    }
    const enriched = {
      ...validated,
      id: member.id || `DV-${Date.now().toString().slice(-5)}`,
      branchId,
      chiDoan: user?.unitName || member.chiDoan || 'Chi đoàn Khu phố 5'
    };
    setState((prev) => ({ ...prev, members: [enriched, ...prev.members] }));
  };

  const importMembers = async (imported) => {
    if (!canWriteBranchMembers) return;
    const sanitizedBatch = (Array.isArray(imported) ? imported : [])
      .slice(0, 200)
      .map((item) => {
        try {
          return validateMemberInput(item);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (sanitizedBatch.length === 0) return;

    if (isOnlineSession) {
      await apiRequest('/api/v1/members/import', {
        method: 'POST',
        token: accessToken,
        body: { members: sanitizedBatch }
      });
      await refreshData();
      return;
    }
    setState((prev) => {
      const existingCodes = new Set(prev.members.map((m) => m.maDoanVien));
      const uniqueNew = sanitizedBatch
        .filter((m) => !existingCodes.has(m.maDoanVien))
        .map((m, idx) => ({
          ...m,
          id: m.id || `DV-IMP-${Date.now().toString().slice(-4)}-${idx}`,
          branchId,
          chiDoan: user?.unitName || m.chiDoan || 'Chi đoàn Khu phố 5'
        }));
      return { ...prev, members: [...uniqueNew, ...prev.members] };
    });
  };

  const updateMember = async (id, updated) => {
    if (!canWriteBranchMembers) return;
    const validated = validateMemberInput(updated);
    if (isOnlineSession) {
      await apiRequest(`/api/v1/members/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        token: accessToken,
        body: validated
      });
      await refreshData();
      return;
    }
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === id && (m.branchId || 'BR-KP5') === branchId ? { ...m, ...validated } : m
      )
    }));
  };

  const deleteMember = async (id) => {
    if (!canWriteBranchMembers) return;
    if (isOnlineSession) {
      await apiRequest(`/api/v1/members/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        token: accessToken
      });
      await refreshData();
      return;
    }
    setState((prev) => {
      const target = prev.members.find((m) => m.id === id);
      if (!target || (target.branchId || 'BR-KP5') !== branchId) return prev;
      return {
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
        activities: prev.activities.map((a) => ({
          ...a,
          checkedInRecords: (a.checkedInRecords || []).filter((r) => r.memberId !== id)
        })),
        ledger: prev.ledger.filter((l) => l.memberId !== id)
      };
    });
  };

  const toggleFee = async (id) => {
    if (!canWriteBranchMembers) return;
    const current = state.members.find((m) => m.id === id);
    if (!current) return;
    if (isOnlineSession) {
      await apiRequest(`/api/v1/members/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        token: accessToken,
        body: { daDongDoanPhi: !current.daDongDoanPhi }
      });
      await refreshData();
      return;
    }
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === id && (m.branchId || 'BR-KP5') === branchId
          ? { ...m, daDongDoanPhi: !m.daDongDoanPhi }
          : m
      )
    }));
  };

  const verifyQrOnServer = async (token, activityId = null) => {
    if (!isOnlineSession || !token) return null;
    const res = await apiRequest('/api/v1/attendance/verify-qr', {
      method: 'POST',
      token: accessToken,
      body: { token, activityId }
    });
    if (res?.activity) {
      setState((prev) => {
        const exists = prev.activities.some((a) => a.id === res.activity.id);
        const nextActivities = exists
          ? prev.activities.map((a) => (a.id === res.activity.id ? res.activity : a))
          : [res.activity, ...prev.activities];
        return { ...prev, activities: nextActivities };
      });
    }
    return res;
  };

  const checkIn = async (
    activityId,
    memberId,
    method = 'QR + GPS',
    gpsMeta = null,
    position = null
  ) => {
    const isSelfScan = canScanQrGps && memberId === user?.memberId;
    if (!canManageWardAtt && !isSelfScan) return null;

    if (isOnlineSession && position) {
      const act = state.activities.find((a) => a.id === activityId);
      const token = gpsMeta?.token || act?.qrSession?.token || '';
      const result = await apiRequest('/api/v1/attendance/check-in', {
        method: 'POST',
        token: accessToken,
        body: { activityId, memberId, token, position }
      });
      await refreshData();
      return result;
    }

    setState((prev) => {
      const targetAct = prev.activities.find((a) => a.id === activityId);
      if (!targetAct || targetAct.isClosed) return prev;

      const records = targetAct.checkedInRecords || [];
      const already = records.some((r) => r.memberId === memberId);
      if (already) return prev;

      const hours = Number(targetAct.gioCongTacXaHoi || 0);
      const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const newRecord = {
        memberId,
        checkedInAt: nowStr,
        method,
        distanceM: gpsMeta?.distance ?? null,
        accuracyM: gpsMeta?.accuracy ?? null
      };

      const nextRecords = [...records, newRecord];
      const nextLedger = [
        {
          id: `LG-${Date.now().toString().slice(-4)}`,
          memberId,
          activityId,
          activityTitle: targetAct.tenHoatDong,
          hours,
          method:
            gpsMeta?.distance !== undefined && gpsMeta?.distance !== null
              ? `${method} (${gpsMeta.distance}m)`
              : method,
          recordedAt: nowStr,
          approvedBy: user?.fullName || prev.info.biThu
        },
        ...prev.ledger
      ];

      return {
        ...prev,
        activities: prev.activities.map((a) =>
          a.id === activityId ? { ...a, checkedInRecords: nextRecords } : a
        ),
        members: prev.members.map((m) =>
          m.id === memberId ? { ...m, gioCtxh: Math.max(0, Number(m.gioCtxh || 0) + hours) } : m
        ),
        ledger: nextLedger
      };
    });
    return null;
  };

  const addActivity = async (activity) => {
    if (!canCreateWardEvent) return null;
    const validated = validateActivityInput(activity);
    if (isOnlineSession) {
      const created = await apiRequest('/api/v1/attendance/activities', {
        method: 'POST',
        token: accessToken,
        body: validated
      });
      await refreshData();
      return created;
    }
    const localId = activity.id || `ACT-WARD-${Date.now().toString().slice(-4)}`;
    const qrSession = activity.qrSession || createDynamicQrSession(localId, 900);
    const enriched = {
      ...validated,
      id: localId,
      scope: 'ward',
      branchId: null,
      chiDoan: user?.unitName || 'Đoàn Phường Tam Hiệp',
      isClosed: false,
      checkedInRecords: [],
      qrSession
    };
    setState((prev) => ({ ...prev, activities: [enriched, ...prev.activities] }));
    return enriched;
  };

  const rotateActivityQr = async (activityId, ttlSeconds = 900) => {
    if (!canIssueWardQr) return;
    if (isOnlineSession) {
      await apiRequest(`/api/v1/attendance/activities/${encodeURIComponent(activityId)}/qr-session`, {
        method: 'POST',
        token: accessToken,
        body: { ttlSeconds }
      });
      await refreshData();
      return;
    }
    const nextSession = createDynamicQrSession(activityId, ttlSeconds);
    setState((prev) => ({
      ...prev,
      activities: prev.activities.map((a) =>
        a.id === activityId && !a.isClosed
          ? { ...a, qrSession: nextSession, trangThai: 'Đang điểm danh' }
          : a
      )
    }));
  };

  const updateActivityLocation = async (activityId, { latitude, longitude, geofenceRadiusM, diaDiem }) => {
    if (!canIssueWardQr) return null;
    const lat = Number(latitude);
    const lon = Number(longitude);
    const radius = Math.min(5000, Math.max(25, Math.round(Number(geofenceRadiusM || 200))));
    if (isOnlineSession) {
      const updated = await apiRequest(
        `/api/v1/attendance/activities/${encodeURIComponent(activityId)}/location`,
        {
          method: 'PATCH',
          token: accessToken,
          body: { latitude: lat, longitude: lon, geofenceRadiusM: radius, diaDiem }
        }
      );
      await refreshData();
      return updated;
    }
    setState((prev) => ({
      ...prev,
      activities: prev.activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              latitude: lat,
              longitude: lon,
              geofenceRadiusM: radius,
              diaDiem: diaDiem ? sanitizePlainText(diaDiem, 180) : a.diaDiem
            }
          : a
      )
    }));
    return null;
  };

  const closeActivity = async (activityId) => {
    if (!canIssueWardQr) return;
    if (isOnlineSession) {
      await apiRequest(`/api/v1/attendance/activities/${encodeURIComponent(activityId)}/close`, {
        method: 'POST',
        token: accessToken,
        body: {}
      });
      await refreshData();
      return;
    }
    setState((prev) => ({
      ...prev,
      activities: prev.activities.map((a) =>
        a.id === activityId ? { ...a, isClosed: true, trangThai: 'Đã hoàn thành' } : a
      )
    }));
  };

  const deleteActivity = async (activityId) => {
    if (!canCreateWardEvent) return;
    if (isOnlineSession) {
      await apiRequest(`/api/v1/attendance/activities/${encodeURIComponent(activityId)}`, {
        method: 'DELETE',
        token: accessToken
      });
      await refreshData();
      return;
    }
    setState((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== activityId)
    }));
  };

  const registerMakeup = async ({ missedActivityId, makeupActivityId, shiftReason }) => {
    if (!canRegisterMakeup) return null;
    const cleanReason = sanitizePlainText(shiftReason || 'Trùng ca sản xuất KCN', 200);
    if (isOnlineSession) {
      const created = await apiRequest('/api/v1/attendance/makeup', {
        method: 'POST',
        token: accessToken,
        body: { missedActivityId, makeupActivityId, shiftReason: cleanReason }
      });
      await refreshData();
      return created;
    }
    const missed = state.activities.find((a) => a.id === missedActivityId);
    const makeup = state.activities.find((a) => a.id === makeupActivityId);
    const item = {
      id: Date.now(),
      memberId: user?.memberId || 'DV-KP5-002',
      memberCode: user?.memberCode || 'DN-KP5-002',
      memberName: user?.fullName || 'Nguyễn Hoàng Anh',
      branchId,
      branchName: user?.unitName || 'Chi đoàn Khu phố 5',
      workShift: 'rotating_shift',
      missedActivityId,
      missedActivityTitle: missed?.tenHoatDong || missedActivityId,
      makeupActivityId,
      makeupActivityTitle: makeup?.tenHoatDong || makeupActivityId,
      makeupDate: makeup?.ngayToChuc || '2026-11-28',
      shiftReason: cleanReason,
      status: canApproveMakeup ? 'approved' : 'pending',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setState((prev) => ({
      ...prev,
      makeupRegistrations: [
        item,
        ...(prev.makeupRegistrations || []).filter(
          (r) => !(r.memberId === item.memberId && r.missedActivityId === missedActivityId)
        )
      ]
    }));
    return item;
  };

  const reviewMakeup = async (id, status) => {
    if (!canApproveMakeup) return;
    if (isOnlineSession) {
      await apiRequest(`/api/v1/attendance/makeup/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        token: accessToken,
        body: { status }
      });
      await refreshData();
      return;
    }
    setState((prev) => ({
      ...prev,
      makeupRegistrations: (prev.makeupRegistrations || []).map((r) =>
        r.id === id ? { ...r, status } : r
      )
    }));
  };

  const addReminder = async (reminder) => {
    if (!canWriteBranchReminders && !canWriteWardReminders) return;
    const cleanTitle = sanitizePlainText(reminder?.tieuDe, 180);
    if (cleanTitle.length < 3) throw new Error('Nội dung lịch nhắc không hợp lệ.');
    const payload = { ...reminder, tieuDe: cleanTitle };
    if (isOnlineSession) {
      await apiRequest('/api/v1/reminders', {
        method: 'POST',
        token: accessToken,
        body: payload
      });
      await refreshData();
      return;
    }
    const isWard = canWriteWardReminders;
    const enriched = {
      ...payload,
      scope: isWard ? 'ward' : 'branch',
      branchId: isWard ? null : branchId
    };
    setState((prev) => ({ ...prev, reminders: [enriched, ...prev.reminders] }));
  };

  const toggleReminder = async (id) => {
    if (!canWriteBranchReminders && !canWriteWardReminders) return;
    const current = state.reminders.find((r) => r.id === id);
    if (!current) return;
    if (isOnlineSession) {
      await apiRequest(`/api/v1/reminders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        token: accessToken,
        body: { daHoanThanh: !current.daHoanThanh }
      });
      await refreshData();
      return;
    }
    setState((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) =>
        r.id === id ? { ...r, daHoanThanh: !r.daHoanThanh } : r
      )
    }));
  };

  const toggleAutoNotify = async (id) => {
    if (!canWriteBranchReminders && !canWriteWardReminders) return;
    const current = state.reminders.find((r) => r.id === id);
    if (!current) return;
    if (isOnlineSession) {
      await apiRequest(`/api/v1/reminders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        token: accessToken,
        body: { batNhacTuDong: !current.batNhacTuDong }
      });
      await refreshData();
      return;
    }
    setState((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) =>
        r.id === id ? { ...r, batNhacTuDong: !r.batNhacTuDong } : r
      )
    }));
  };

  const deleteReminder = async (id) => {
    if (!canWriteBranchReminders && !canWriteWardReminders) return;
    if (isOnlineSession) {
      await apiRequest(`/api/v1/reminders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        token: accessToken
      });
      await refreshData();
      return;
    }
    setState((prev) => ({
      ...prev,
      reminders: prev.reminders.filter((r) => r.id !== id)
    }));
  };

  const addNews = async (article) => {
    if (!canWriteNews) return;
    const validated = validateNewsInput(article);
    if (isOnlineSession) {
      await apiRequest('/api/v1/news', {
        method: 'POST',
        token: accessToken,
        body: validated
      });
      await refreshData();
      return;
    }
    setState((prev) => {
      const normalized = validated.featured
        ? prev.news.map((item) => ({ ...item, featured: false }))
        : prev.news;
      return {
        ...prev,
        news: [{ ...validated, id: article.id || `NEWS-${Date.now().toString().slice(-4)}` }, ...normalized]
      };
    });
  };

  const updateNews = async (id, updates) => {
    if (!canWriteNews) return;
    const validated = validateNewsInput(updates);
    if (isOnlineSession) {
      await apiRequest(`/api/v1/news/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        token: accessToken,
        body: validated
      });
      await refreshData();
      return;
    }
    setState((prev) => ({
      ...prev,
      news: prev.news.map((item) => {
        if (item.id === id) return { ...item, ...validated };
        if (validated.featured) return { ...item, featured: false };
        return item;
      })
    }));
  };

  const deleteNews = async (id) => {
    if (!canWriteNews) return;
    if (isOnlineSession) {
      await apiRequest(`/api/v1/news/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        token: accessToken
      });
      await refreshData();
      return;
    }
    setState((prev) => {
      const remaining = prev.news.filter((item) => item.id !== id);
      if (remaining.length > 0 && !remaining.some((item) => item.featured)) {
        remaining[0] = { ...remaining[0], featured: true };
      }
      return { ...prev, news: remaining };
    });
  };

  const resetData = () => {
    if (!canResetDemo) return;
    setState(getDefaultChiDoanState());
  };

  return {
    info: state.info,
    news: state.news,
    allMembers: state.members,
    scopedMembers,
    scopedActivities,
    scopedLedger,
    scopedReminders,
    scopedMakeup: scopedMakeupRegistrations,
    reportSummary,
    syncState,
    capabilities: {
      canManageMembers: canWriteBranchMembers,
      canViewMembersDirectory: hasAnyCapability(user, ['members:read_branch', 'members:read_ward']),
      canViewWardMembers: canReadWardMembers,
      canOrganizeQr: canIssueWardQr,
      canCreateWardEvent,
      canScanQrGps,
      canViewBranchAttendanceProgress: canViewBranchProgress,
      canRegisterMakeup,
      canApproveMakeup,
      canManageNews: canWriteNews,
      canViewReports,
      canViewWardSummary: hasCapability(user, 'reports:ward_summary'),
      canExportHoursCsv: hasCapability(user, 'hours:export_csv'),
      canManageReminders: canWriteBranchReminders || canWriteWardReminders,
      canResetDemo
    },
    actions: {
      refreshData,
      addMember,
      importMembers,
      updateMember,
      deleteMember,
      toggleFee,
      verifyQrOnServer,
      checkIn,
      addActivity,
      rotateActivityQr,
      updateActivityLocation,
      closeActivity,
      deleteActivity,
      registerMakeup,
      reviewMakeup,
      addReminder,
      toggleReminder,
      toggleAutoNotify,
      deleteReminder,
      addNews,
      updateNews,
      deleteNews,
      resetData
    }
  };
}
