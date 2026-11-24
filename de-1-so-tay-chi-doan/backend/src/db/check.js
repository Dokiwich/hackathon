import { loadDotEnv } from '../config/loadDotEnv.js';
import { createDbClient } from './client.js';

loadDotEnv();

const databaseUrl = String(process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  console.error('[db:check] Missing DATABASE_URL. Set Neon PostgreSQL URL in backend/.env first.');
  process.exit(1);
}

const db = createDbClient({ databaseUrl });
try {
  const info = await db.query(
    'SELECT current_database() AS db, current_user AS usr, NOW() AS server_time'
  );
  const counts = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM roles) AS roles,
      (SELECT COUNT(*)::int FROM wards) AS wards,
      (SELECT COUNT(*)::int FROM branches) AS branches,
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM members) AS members,
      (SELECT COUNT(*)::int FROM activities) AS activities,
      (SELECT COUNT(*)::int FROM qr_sessions) AS qr_sessions,
      (SELECT COUNT(*)::int FROM attendance_records) AS attendance_records,
      (SELECT COUNT(*)::int FROM makeup_registrations) AS makeup_registrations,
      (SELECT COUNT(*)::int FROM emulation_point_ledger) AS emulation_point_ledger,
      (SELECT COUNT(*)::int FROM reminders) AS reminders,
      (SELECT COUNT(*)::int FROM reminder_channels) AS reminder_channels,
      (SELECT COUNT(*)::int FROM news) AS news
  `);

  const branchSummary = await db.query(`
    SELECT branch_id, branch_name, total_members, local_count, migrant_worker_count, transferred_count, branch_activities_count, total_checkins
    FROM v_branch_monthly_summary
    ORDER BY branch_id ASC
  `);

  const kp5Meetings = await db.query(`
    SELECT a.id, a.title, a.activity_date, COUNT(ar.id)::int AS attendees
    FROM activities a
    LEFT JOIN attendance_records ar ON ar.activity_id = a.id
    WHERE a.branch_id = 'BR-KP5' AND a.activity_type = 'regular_meeting'
    GROUP BY a.id
    ORDER BY a.activity_date DESC
  `);

  console.log(
    JSON.stringify(
      {
        status: 'connected',
        database: info.rows[0]?.db,
        user: info.rows[0]?.usr,
        serverTime: info.rows[0]?.server_time,
        tableCounts: counts.rows[0],
        branchSummary: branchSummary.rows,
        kp5RecentMeetings: kp5Meetings.rows
      },
      null,
      2
    )
  );
} finally {
  await db.close();
}
