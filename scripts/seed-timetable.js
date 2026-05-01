// scripts/seed-timetable.js
// Seeds timetable entries: every subject taught in a class gets a daily slot
// Monday–Friday, one period per subject per day (no conflicts).
// Safe to re-run — clears existing timetable first.

const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.odvlzuktfdnmsoijlhaq',
  password: 'Shaheer@0107',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const P = [
  { start: '08:00:00', end: '08:45:00' },  // P1
  { start: '09:00:00', end: '09:45:00' },  // P2
  { start: '10:00:00', end: '10:45:00' },  // P3
  { start: '11:00:00', end: '11:45:00' },  // P4
  { start: '12:00:00', end: '12:45:00' },  // P5
  { start: '14:00:00', end: '14:45:00' },  // P6
];

// Conflict-free schedule — all 6 subjects every day for all 3 classes.
// Each class uses P1-P6 exactly once.  Each teacher's 6 slots use P1-P6 exactly once.
//
// Teachers:  Rafeh=English+Math,  Rizwana=Biology+Physics,  Sitara=Chemistry+CS
//
//  Period | Class 8          | Class 9          | Class 10
//  -------|------------------|------------------|------------------
//  P1     | Biology (Rz)     | Mathematics (Ra) | Computer Sci (Si)
//  P2     | Chemistry (Si)   | Physics (Rz)     | English (Ra)
//  P3     | Computer Sci (Si)| Biology (Rz)     | Mathematics (Ra)
//  P4     | English (Ra)     | Chemistry (Si)   | Physics (Rz)
//  P5     | Mathematics (Ra) | Computer Sci (Si)| Biology (Rz)
//  P6     | Physics (Rz)     | English (Ra)     | Chemistry (Si)
//
// Teacher conflict check (all 6 periods distinct per teacher):
//   Rafeh  : Eng8@P4, Eng9@P6, Eng10@P2, Math8@P5, Math9@P1, Math10@P3  → P1-P6 ✓
//   Rizwana: Bio8@P1, Bio9@P3, Bio10@P5, Phy8@P6,  Phy9@P2,  Phy10@P4  → P1-P6 ✓
//   Sitara : Che8@P2, Che9@P4, Che10@P6, CS8@P3,  CS9@P5,   CS10@P1   → P1-P6 ✓
//
const SCHEDULE = [
  // Class 8
  { class: 'Class 8',  subject: 'Biology',           period: 0 },
  { class: 'Class 8',  subject: 'Chemistry',          period: 1 },
  { class: 'Class 8',  subject: 'Computer Science',   period: 2 },
  { class: 'Class 8',  subject: 'English',            period: 3 },
  { class: 'Class 8',  subject: 'Mathematics',        period: 4 },
  { class: 'Class 8',  subject: 'Physics',            period: 5 },
  // Class 9
  { class: 'Class 9',  subject: 'Mathematics',        period: 0 },
  { class: 'Class 9',  subject: 'Physics',            period: 1 },
  { class: 'Class 9',  subject: 'Biology',            period: 2 },
  { class: 'Class 9',  subject: 'Chemistry',          period: 3 },
  { class: 'Class 9',  subject: 'Computer Science',   period: 4 },
  { class: 'Class 9',  subject: 'English',            period: 5 },
  // Class 10
  { class: 'Class 10', subject: 'Computer Science',   period: 0 },
  { class: 'Class 10', subject: 'English',            period: 1 },
  { class: 'Class 10', subject: 'Mathematics',        period: 2 },
  { class: 'Class 10', subject: 'Physics',            period: 3 },
  { class: 'Class 10', subject: 'Biology',            period: 4 },
  { class: 'Class 10', subject: 'Chemistry',          period: 5 },
];

const ROOM = {
  'Class 8':  'Room 101',
  'Class 9':  'Room 102',
  'Class 10': 'Room 103',
};

async function main() {
  await client.connect();
  console.log('\n========== TIMETABLE SEED ==========\n');

  // ── 1. Fetch existing data ────────────────────────────────────────────────
  const { rows: enrollments } = await client.query(`
    SELECT
      tse.class_id,
      tse.subject_id,
      tse.teacher_id,
      c.name  AS class_name,
      s.name  AS subject_name,
      p.email AS teacher_email
    FROM teacher_subject_enrollments tse
    JOIN classes  c ON c.id = tse.class_id
    JOIN subjects s ON s.id = tse.subject_id
    JOIN profiles p ON p.id = tse.teacher_id
    WHERE tse.is_active = true
    ORDER BY c.name, s.name
  `);

  if (!enrollments.length) {
    console.error('❌ No teacher_subject_enrollments found. Run seed-database.js first.');
    process.exit(1);
  }

  // ── 2. Fetch admin/creator profile (use first teacher as created_by) ───────
  const { rows: teachers } = await client.query(
    `SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1`
  );
  const createdBy = teachers[0]?.id;

  // ── 3. Clear existing timetable ──────────────────────────────────────────
  console.log('Clearing existing timetable...');
  await client.query(`DELETE FROM timetable`);
  console.log('  ✓ Cleared\n');

  // ── 4. Build lookup: class_name+subject_name → enrollment row ────────────
  const lookup = {};
  for (const row of enrollments) {
    lookup[`${row.class_name}|${row.subject_name}`] = row;
  }

  // ── 5. Insert entries per schedule ───────────────────────────────────────
  let inserted = 0;
  const errors = [];
  let currentClass = null;

  for (const slot of SCHEDULE) {
    const key = `${slot.class}|${slot.subject}`;
    const enr = lookup[key];

    if (!enr) {
      errors.push(`  ✗ No enrollment found for: ${key}`);
      continue;
    }

    const period = P[slot.period];
    const room   = ROOM[slot.class] || 'Room 100';

    if (slot.class !== currentClass) {
      console.log(`\n── ${slot.class} ──`);
      currentClass = slot.class;
    }

    for (const day of DAYS) {
      try {
        await client.query(`
          INSERT INTO timetable
            (day, start_time, end_time, subject_id, room_number, class_id, teacher_id, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [day, period.start, period.end, enr.subject_id, room, enr.class_id, enr.teacher_id, createdBy]);
        inserted++;
      } catch (err) {
        errors.push(`  ✗ [${slot.class}/${slot.subject}/${day}] ${err.message}`);
      }
    }

    console.log(`  ✓ ${slot.subject.padEnd(20)} P${slot.period + 1}  ${period.start.slice(0,5)}–${period.end.slice(0,5)}  daily  (${enr.teacher_email})`);
  }

  // ── 6. Summary ────────────────────────────────────────────────────────────
  console.log(`\n========== DONE ==========`);
  console.log(`  Inserted : ${inserted} entries`);
  if (errors.length) {
    console.log(`  Errors   : ${errors.length}`);
    errors.forEach(e => console.log(e));
  }

  await client.end();
}

main().catch(err => {
  console.error('Fatal:', err);
  client.end();
  process.exit(1);
});
