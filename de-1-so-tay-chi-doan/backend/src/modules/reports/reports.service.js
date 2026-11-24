function sanitizeCsvCell(value) {
  const str = String(value ?? '').replace(/\r?\n/g, ' ');
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function createReportsService({ membersApi, attendanceApi }) {
  return {
    async buildSummary(user, period = 'month') {
      const [members, activities] = await Promise.all([
        membersApi.getMembersList(user),
        attendanceApi.getActivitiesList(user)
      ]);
      const localCount = members.filter((m) => m.residenceStatus === 'local').length;
      const migrantWorkerCount = members.filter((m) => m.residenceStatus === 'migrant_worker').length;
      const transferredCount = members.filter((m) => m.residenceStatus === 'transferred').length;
      const feePaidCount = members.filter((m) => Boolean(m.daDongDoanPhi)).length;
      const totalSocialHours = members.reduce((sum, m) => sum + Number(m.gioCtxh || 0), 0);
      const totalCheckins = activities.reduce(
        (sum, a) => sum + (a.checkedInMemberIds ? a.checkedInMemberIds.length : 0),
        0
      );
      const totalMembers = members.length;
      const feePaidPct = totalMembers ? Math.round((feePaidCount / totalMembers) * 100) : 0;
      const avgAttendancePct =
        activities.length && totalMembers
          ? Math.round((totalCheckins / (activities.length * totalMembers)) * 100)
          : 0;

      const branchMap = new Map();
      for (const m of members) {
        const bId = m.branchId || 'BR-KP5';
        if (!branchMap.has(bId)) {
          branchMap.set(bId, {
            branchId: bId,
            branchName: m.chiDoan || bId,
            totalMembers: 0,
            localCount: 0,
            migrantWorkerCount: 0,
            transferredCount: 0,
            feePaidCount: 0,
            totalSocialHours: 0
          });
        }
        const b = branchMap.get(bId);
        b.totalMembers += 1;
        if (m.residenceStatus === 'local') b.localCount += 1;
        if (m.residenceStatus === 'migrant_worker') b.migrantWorkerCount += 1;
        if (m.residenceStatus === 'transferred') b.transferredCount += 1;
        if (m.daDongDoanPhi) b.feePaidCount += 1;
        b.totalSocialHours += Number(m.gioCtxh || 0);
      }

      const branchSummary = Array.from(branchMap.values()).map((b) => ({
        ...b,
        feePaidPct: b.totalMembers ? Math.round((b.feePaidCount / b.totalMembers) * 100) : 0
      }));

      return {
        period,
        scope: user.role === 'ward_officer' ? 'ward' : 'branch',
        unitName: user.unitName,
        totalMembers,
        localCount,
        migrantWorkerCount,
        transferredCount,
        feePaidCount,
        feePaidPct,
        totalActivities: activities.length,
        totalCheckins,
        avgAttendancePct,
        totalSocialHours,
        branchSummary
      };
    },

    async buildMembersCsv(user) {
      const members = await membersApi.getMembersList(user);
      const headers = ['STT', 'Ma Doan Vien', 'Ho va Ten', 'Chi Doan', 'Chuc Vu', 'Trang Thai', 'Diem Thi Dua'];
      const rows = members.map((m, i) => [
        i + 1,
        m.maDoanVien,
        m.hoTen,
        m.chiDoan,
        m.chucVu,
        m.trangThai,
        m.gioCtxh
      ]);
      const lines = [
        headers.map(sanitizeCsvCell).join(','),
        ...rows.map((r) => r.map(sanitizeCsvCell).join(','))
      ];
      return '\uFEFF' + lines.join('\r\n');
    }
  };
}
