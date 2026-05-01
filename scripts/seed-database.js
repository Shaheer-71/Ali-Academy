// scripts/seed-database.js
// Complete database reset and seed for Ali-Academy

const { Client } = require('pg');

const SUPABASE_URL = 'https://odvlzuktfdnmsoijlhaq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdmx6dWt0ZmRubXNvaWpsaGFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2MDAxMiwiZXhwIjoyMDg4NzM2MDEyfQ.PI3XLsWI0fUyFCgpRzK5IihkuyZltaSaYQ2kVM3jegw';

const client = new Client({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.odvlzuktfdnmsoijlhaq',
  password: 'Shaheer@0107',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function createAuthUser(email, password, fullName, role) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth user create failed for ${email}: ${JSON.stringify(data)}`);
  console.log(`  ✓ Auth user created: ${email} → ${data.id}`);
  return data.id;
}

async function deleteAuthUser(userId) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.warn(`  ! Could not delete auth user ${userId}: ${JSON.stringify(data)}`);
  }
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await client.connect();
  console.log('\n========== ALI-ACADEMY DB SEED ==========\n');

  // ── STEP 1: Clear existing data ──────────────────────────────────────────
  console.log('STEP 1: Clearing existing data...');

  await client.query(`
    DELETE FROM quiz_results;
    DELETE FROM quizzes;
    DELETE FROM attendance;
    DELETE FROM attendance_sessions;
    DELETE FROM diary_assignments;
    DELETE FROM lectures;
    DELETE FROM timetable;
    DELETE FROM student_subject_enrollments;
    DELETE FROM teacher_subject_enrollments;
    DELETE FROM classes_subjects;
    DELETE FROM students;
    DELETE FROM classes;
    DELETE FROM subjects;
  `);
  console.log('  ✓ Tables cleared\n');

  // ── STEP 2: Delete old student auth users (keep the 3 teacher accounts) ─
  console.log('STEP 2: Cleaning old student auth users...');

  const TEACHER_IDS = [
    '832699b1-72c2-45eb-86ca-c1edcce655fd',
    '72b7d443-61d4-446c-a53b-825eb3e29900',
    '503d8998-7091-4d5e-a423-17aef329a03e',
  ];

  // Get all non-teacher profiles to remove
  const { rows: oldProfiles } = await client.query(`
    SELECT id, email FROM profiles
    WHERE role = 'student'
  `);

  for (const p of oldProfiles) {
    console.log(`  Deleting auth user: ${p.email}`);
    await deleteAuthUser(p.id);
  }

  await client.query(`DELETE FROM profiles WHERE role = 'student'`);
  console.log(`  ✓ ${oldProfiles.length} old student profiles cleared\n`);

  // ── STEP 3: Ensure teacher profiles exist ────────────────────────────────
  console.log('STEP 3: Setting up teacher profiles...');

  // These auth users already exist in Supabase Auth
  const RAFEH_ID   = '832699b1-72c2-45eb-86ca-c1edcce655fd';
  const RIZWANA_ID = '72b7d443-61d4-446c-a53b-825eb3e29900';
  const SITARA_ID  = '503d8998-7091-4d5e-a423-17aef329a03e';

  // Upsert teacher profiles
  await client.query(`
    INSERT INTO profiles (id, email, full_name, role)
    VALUES
      ($1, 'rafeh@aliacademy.edu',   'Rafeh Siddiqui', 'teacher'),
      ($2, 'rizwana@aliacademy.edu', 'Rizwana Bibi',   'teacher'),
      ($3, 'sitara@aliacademy.edu',  'Sitara Naz',     'teacher')
    ON CONFLICT (id) DO UPDATE
      SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
  `, [RAFEH_ID, RIZWANA_ID, SITARA_ID]);

  // Reset teacher passwords to 123456
  for (const [tid, email] of [[RAFEH_ID,'rafeh@aliacademy.edu'],[RIZWANA_ID,'rizwana@aliacademy.edu'],[SITARA_ID,'sitara@aliacademy.edu']]) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${tid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'apikey': SERVICE_ROLE_KEY },
      body: JSON.stringify({ password: '123456', email_confirm: true }),
    });
    if (res.ok) console.log(`  ✓ Teacher ready: ${email}`);
    else console.warn(`  ! Could not update password for ${email}`);
  }

  console.log('  ✓ Teacher profiles ready\n');

  // ── STEP 4: Create classes ────────────────────────────────────────────────
  console.log('STEP 4: Creating classes...');

  const { rows: classRows } = await client.query(`
    INSERT INTO classes (name, description, teacher_id)
    VALUES
      ('Class 8',  'Grade 8 students',  $1),
      ('Class 9',  'Grade 9 students',  $1),
      ('Class 10', 'Grade 10 students', $1)
    RETURNING id, name
  `, [RAFEH_ID]);

  const CLASS8  = classRows.find(r => r.name === 'Class 8').id;
  const CLASS9  = classRows.find(r => r.name === 'Class 9').id;
  const CLASS10 = classRows.find(r => r.name === 'Class 10').id;

  console.log(`  ✓ Class 8  → ${CLASS8}`);
  console.log(`  ✓ Class 9  → ${CLASS9}`);
  console.log(`  ✓ Class 10 → ${CLASS10}\n`);

  // ── STEP 5: Create subjects ───────────────────────────────────────────────
  console.log('STEP 5: Creating subjects...');

  const { rows: subjectRows } = await client.query(`
    INSERT INTO subjects (name, description, created_by)
    VALUES
      ('Mathematics',      'Core mathematics curriculum',   $1),
      ('English',          'English language and literature',$1),
      ('Physics',          'Physics science subject',        $1),
      ('Biology',          'Biology science subject',        $1),
      ('Chemistry',        'Chemistry science subject',      $1),
      ('Computer Science', 'Information technology basics',  $1)
    RETURNING id, name
  `, [RAFEH_ID]);

  const SUB = {};
  for (const r of subjectRows) SUB[r.name] = r.id;

  console.log('  ✓ Subjects created:', Object.keys(SUB).join(', '), '\n');

  // ── STEP 5b: Populate classes_subjects junction table ────────────────────
  console.log('STEP 5b: Linking classes to subjects...');

  // Class 8 & 9: Math, Physics, Chemistry
  // Class 10: Math, English, Physics, Biology, Chemistry, CS
  const classeSubjectLinks = [
    [CLASS8,  SUB['Mathematics']],
    [CLASS8,  SUB['Physics']],
    [CLASS8,  SUB['Chemistry']],

    [CLASS9,  SUB['Mathematics']],
    [CLASS9,  SUB['Physics']],
    [CLASS9,  SUB['Chemistry']],

    [CLASS10, SUB['Mathematics']],
    [CLASS10, SUB['English']],
    [CLASS10, SUB['Physics']],
    [CLASS10, SUB['Biology']],
    [CLASS10, SUB['Chemistry']],
    [CLASS10, SUB['Computer Science']],
  ];

  for (const [cid, sid] of classeSubjectLinks) {
    await client.query(
      `INSERT INTO classes_subjects (class_id, subject_id, is_active, created_by) VALUES ($1, $2, true, $3)`,
      [cid, sid, RAFEH_ID]
    );
  }
  console.log(`  ✓ ${classeSubjectLinks.length} class-subject links created\n`);

  // ── STEP 6: Teacher subject enrollments ──────────────────────────────────
  console.log('STEP 6: Assigning teachers to classes/subjects...');

  // rafeh: Class8-Math, Class9-Math, Class10-Math, Class10-English
  // rizwana: Class8-Physics, Class9-Physics, Class10-Physics, Class10-Biology
  // sitara: Class8-Chemistry, Class9-Chemistry, Class10-Chemistry, Class10-CS

  const tseRows = [
    [RAFEH_ID,   CLASS8,  SUB['Mathematics']],
    [RAFEH_ID,   CLASS9,  SUB['Mathematics']],
    [RAFEH_ID,   CLASS10, SUB['Mathematics']],
    [RAFEH_ID,   CLASS10, SUB['English']],

    [RIZWANA_ID, CLASS8,  SUB['Physics']],
    [RIZWANA_ID, CLASS9,  SUB['Physics']],
    [RIZWANA_ID, CLASS10, SUB['Physics']],
    [RIZWANA_ID, CLASS10, SUB['Biology']],

    [SITARA_ID,  CLASS8,  SUB['Chemistry']],
    [SITARA_ID,  CLASS9,  SUB['Chemistry']],
    [SITARA_ID,  CLASS10, SUB['Chemistry']],
    [SITARA_ID,  CLASS10, SUB['Computer Science']],
  ];

  for (const [tid, cid, sid] of tseRows) {
    await client.query(
      `INSERT INTO teacher_subject_enrollments (teacher_id, class_id, subject_id) VALUES ($1, $2, $3)`,
      [tid, cid, sid]
    );
  }
  console.log(`  ✓ ${tseRows.length} teacher-subject-class assignments created\n`);

  // ── STEP 7: Create timetable ──────────────────────────────────────────────
  console.log('STEP 7: Creating timetable...');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = [
    { start: '08:00', end: '08:45' },
    { start: '08:50', end: '09:35' },
    { start: '09:40', end: '10:25' },
    { start: '10:30', end: '11:15' },
    { start: '11:30', end: '12:15' },
  ];

  // Class 8: Math(rafeh), Physics(rizwana), Chemistry(sitara) → 3 subjects
  // Class 9: Math(rafeh), Physics(rizwana), Chemistry(sitara) → 3 subjects
  // Class 10: Math(rafeh), English(rafeh), Physics(rizwana), Biology(rizwana), Chemistry(sitara), CS(sitara)

  // Conflict-free timetable: no teacher is double-booked in same slot
  // Slot legend: A=08:00-08:45, B=08:50-09:35, C=09:40-10:25, D=10:30-11:15, E=11:30-12:15
  const timetableEntries = [
    // CLASS 8: Math(Rafeh), Physics(Rizwana), Chemistry(Sitara)
    { day: 'Monday',    start: '08:00', end: '08:45', class_id: CLASS8,  subject_id: SUB['Mathematics'], teacher_id: RAFEH_ID,   room: 'R-101' }, // A
    { day: 'Wednesday', start: '08:00', end: '08:45', class_id: CLASS8,  subject_id: SUB['Mathematics'], teacher_id: RAFEH_ID,   room: 'R-101' }, // A
    { day: 'Friday',    start: '08:00', end: '08:45', class_id: CLASS8,  subject_id: SUB['Mathematics'], teacher_id: RAFEH_ID,   room: 'R-101' }, // A
    { day: 'Tuesday',   start: '08:00', end: '08:45', class_id: CLASS8,  subject_id: SUB['Physics'],     teacher_id: RIZWANA_ID, room: 'R-102' }, // A
    { day: 'Thursday',  start: '08:00', end: '08:45', class_id: CLASS8,  subject_id: SUB['Physics'],     teacher_id: RIZWANA_ID, room: 'R-102' }, // A
    { day: 'Monday',    start: '08:50', end: '09:35', class_id: CLASS8,  subject_id: SUB['Chemistry'],   teacher_id: SITARA_ID,  room: 'R-103' }, // B
    { day: 'Thursday',  start: '08:50', end: '09:35', class_id: CLASS8,  subject_id: SUB['Chemistry'],   teacher_id: SITARA_ID,  room: 'R-103' }, // B

    // CLASS 9: Math(Rafeh), Physics(Rizwana), Chemistry(Sitara)
    { day: 'Monday',    start: '09:40', end: '10:25', class_id: CLASS9,  subject_id: SUB['Mathematics'], teacher_id: RAFEH_ID,   room: 'R-201' }, // C
    { day: 'Wednesday', start: '09:40', end: '10:25', class_id: CLASS9,  subject_id: SUB['Mathematics'], teacher_id: RAFEH_ID,   room: 'R-201' }, // C
    { day: 'Tuesday',   start: '09:40', end: '10:25', class_id: CLASS9,  subject_id: SUB['Physics'],     teacher_id: RIZWANA_ID, room: 'R-202' }, // C
    { day: 'Thursday',  start: '09:40', end: '10:25', class_id: CLASS9,  subject_id: SUB['Physics'],     teacher_id: RIZWANA_ID, room: 'R-202' }, // C
    { day: 'Wednesday', start: '08:50', end: '09:35', class_id: CLASS9,  subject_id: SUB['Chemistry'],   teacher_id: SITARA_ID,  room: 'R-203' }, // B
    { day: 'Friday',    start: '09:40', end: '10:25', class_id: CLASS9,  subject_id: SUB['Chemistry'],   teacher_id: SITARA_ID,  room: 'R-203' }, // C

    // CLASS 10: Math(Rafeh), English(Rafeh), Physics(Rizwana), Biology(Rizwana), Chemistry(Sitara), CS(Sitara)
    { day: 'Monday',    start: '10:30', end: '11:15', class_id: CLASS10, subject_id: SUB['Mathematics'],      teacher_id: RAFEH_ID,   room: 'R-301' }, // D
    { day: 'Wednesday', start: '10:30', end: '11:15', class_id: CLASS10, subject_id: SUB['Mathematics'],      teacher_id: RAFEH_ID,   room: 'R-301' }, // D
    { day: 'Tuesday',   start: '10:30', end: '11:15', class_id: CLASS10, subject_id: SUB['English'],          teacher_id: RAFEH_ID,   room: 'R-301' }, // D
    { day: 'Friday',    start: '10:30', end: '11:15', class_id: CLASS10, subject_id: SUB['English'],          teacher_id: RAFEH_ID,   room: 'R-301' }, // D
    { day: 'Monday',    start: '11:30', end: '12:15', class_id: CLASS10, subject_id: SUB['Physics'],          teacher_id: RIZWANA_ID, room: 'R-302' }, // E
    { day: 'Wednesday', start: '11:30', end: '12:15', class_id: CLASS10, subject_id: SUB['Physics'],          teacher_id: RIZWANA_ID, room: 'R-302' }, // E
    { day: 'Tuesday',   start: '11:30', end: '12:15', class_id: CLASS10, subject_id: SUB['Biology'],          teacher_id: RIZWANA_ID, room: 'R-302' }, // E
    { day: 'Thursday',  start: '10:30', end: '11:15', class_id: CLASS10, subject_id: SUB['Chemistry'],        teacher_id: SITARA_ID,  room: 'R-303' }, // D
    { day: 'Thursday',  start: '11:30', end: '12:15', class_id: CLASS10, subject_id: SUB['Computer Science'], teacher_id: SITARA_ID,  room: 'R-304' }, // E
    { day: 'Friday',    start: '11:30', end: '12:15', class_id: CLASS10, subject_id: SUB['Computer Science'], teacher_id: SITARA_ID,  room: 'R-304' }, // E
  ];

  for (const e of timetableEntries) {
    await client.query(
      `INSERT INTO timetable (day, start_time, end_time, subject_id, room_number, class_id, teacher_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [e.day, e.start, e.end, e.subject_id, e.room, e.class_id, e.teacher_id, RAFEH_ID]
    );
  }
  console.log(`  ✓ ${timetableEntries.length} timetable entries created\n`);

  // ── STEP 8: Create student auth users + student records ───────────────────
  console.log('STEP 8: Creating students...');

  const studentDefs = [
    // Class 8 students
    { name: 'Aisha Ali',      email: 'a@aliacademy.edu',  roll: '8-001', class_id: CLASS8,  gender: 'female' },
    { name: 'Bilal Khan',     email: 'b@aliacademy.edu',  roll: '8-002', class_id: CLASS8,  gender: 'male'   },
    { name: 'Fatima Malik',   email: 'fm@aliacademy.edu', roll: '8-003', class_id: CLASS8,  gender: 'female' },
    // Class 9 students
    { name: 'Danish Ahmed',   email: 'da@aliacademy.edu', roll: '9-001', class_id: CLASS9,  gender: 'male'   },
    { name: 'Emaan Sheikh',   email: 'e@aliacademy.edu',  roll: '9-002', class_id: CLASS9,  gender: 'female' },
    { name: 'Ghazal Qureshi', email: 'g@aliacademy.edu',  roll: '9-003', class_id: CLASS9,  gender: 'female' },
    // Class 10 students
    { name: 'Hassan Raza',    email: 'h@aliacademy.edu',  roll: '10-001', class_id: CLASS10, gender: 'male'  },
    { name: 'Iram Butt',      email: 'i@aliacademy.edu',  roll: '10-002', class_id: CLASS10, gender: 'female' },
    { name: 'Junaid Farooq',  email: 'j@aliacademy.edu',  roll: '10-003', class_id: CLASS10, gender: 'male'  },
    { name: 'Kiran Naz',      email: 'k@aliacademy.edu',  roll: '10-004', class_id: CLASS10, gender: 'female' },
  ];

  const createdStudents = [];

  // Delete any existing student auth users matching our emails
  const { users: existingUsers } = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?per_page=100`,
    { headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'apikey': SERVICE_ROLE_KEY } }
  ).then(r => r.json());

  const studentEmails = new Set(studentDefs.map(s => s.email));
  for (const u of (existingUsers || [])) {
    if (studentEmails.has(u.email)) {
      await deleteAuthUser(u.id);
      console.log(`  Removed existing auth: ${u.email}`);
    }
  }

  for (const s of studentDefs) {
    try {
      const authId = await createAuthUser(s.email, '123456', s.name, 'student');

      // Insert into profiles table
      await client.query(
        `INSERT INTO profiles (id, email, full_name, role) VALUES ($1, $2, $3, 'student')`,
        [authId, s.email, s.name]
      );

      // Insert into students table (id matches auth user id)
      await client.query(
        `INSERT INTO students (id, full_name, roll_number, class_id, parent_contact, email, gender, is_deleted, has_registered, student_status, created_by)
         VALUES ($1, $2, $3, $4, '0300-0000000', $5, $6, false, true, 'active', $7)`,
        [authId, s.name, s.roll, s.class_id, s.email, s.gender, RAFEH_ID]
      );

      createdStudents.push({ ...s, id: authId });
      console.log(`  ✓ Student created: ${s.name} (${s.email})`);
    } catch (err) {
      console.error(`  ✗ Failed to create student ${s.name}: ${err.message}`);
    }
  }
  console.log();

  // ── STEP 9: Student subject enrollments ───────────────────────────────────
  console.log('STEP 9: Enrolling students in subjects...');

  const class8Subjects  = [SUB['Mathematics'], SUB['Physics'], SUB['Chemistry']];
  const class9Subjects  = [SUB['Mathematics'], SUB['Physics'], SUB['Chemistry']];
  const class10Subjects = [SUB['Mathematics'], SUB['English'], SUB['Physics'], SUB['Biology'], SUB['Chemistry'], SUB['Computer Science']];

  let sseCount = 0;
  for (const student of createdStudents) {
    let subjects = [];
    if (student.class_id === CLASS8)  subjects = class8Subjects;
    if (student.class_id === CLASS9)  subjects = class9Subjects;
    if (student.class_id === CLASS10) subjects = class10Subjects;

    for (const subjectId of subjects) {
      await client.query(
        `INSERT INTO student_subject_enrollments (student_id, class_id, subject_id, is_active, created_by)
         VALUES ($1, $2, $3, true, $4)`,
        [student.id, student.class_id, subjectId, RAFEH_ID]
      );
      sseCount++;
    }
  }
  console.log(`  ✓ ${sseCount} student-subject enrollments created\n`);

  // ── STEP 10: Attendance data (last 30 school days) ────────────────────────
  console.log('STEP 10: Creating attendance records...');

  const today = new Date();
  const schoolDays = [];
  let d = new Date(today);
  d.setDate(d.getDate() - 1);
  while (schoolDays.length < 30) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) schoolDays.push(new Date(d));
    d.setDate(d.getDate() - 1);
  }

  let attendanceCount = 0;
  for (const student of createdStudents) {
    for (const day of schoolDays) {
      const dateStr = day.toISOString().split('T')[0];
      // 80% present, 10% late, 10% absent
      const roll = Math.random();
      const status = roll < 0.8 ? 'present' : roll < 0.9 ? 'late' : 'absent';
      const arrivalTime = status === 'present' ? '08:00' : status === 'late' ? '08:20' : '08:00';
      const lateMinutes = status === 'late' ? randomBetween(5, 30) : 0;

      const teacherId = student.class_id === CLASS8  ? RAFEH_ID :
                        student.class_id === CLASS9  ? RAFEH_ID : RAFEH_ID;

      await client.query(
        `INSERT INTO attendance (student_id, class_id, date, arrival_time, status, late_minutes, marked_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [student.id, student.class_id, dateStr, arrivalTime, status, lateMinutes, teacherId]
      );
      attendanceCount++;
    }
  }
  console.log(`  ✓ ${attendanceCount} attendance records created\n`);

  // ── STEP 11: Quizzes + quiz results ───────────────────────────────────────
  console.log('STEP 11: Creating quizzes and results...');

  const quizDefs = [
    // Class 8 quizzes
    { title: 'Math Quiz 1',      class_id: CLASS8,  subject_id: SUB['Mathematics'],  date: '2026-02-01', marks: 50, teacher: RAFEH_ID },
    { title: 'Math Quiz 2',      class_id: CLASS8,  subject_id: SUB['Mathematics'],  date: '2026-02-15', marks: 50, teacher: RAFEH_ID },
    { title: 'Physics Quiz 1',   class_id: CLASS8,  subject_id: SUB['Physics'],      date: '2026-02-05', marks: 40, teacher: RIZWANA_ID },
    { title: 'Chemistry Quiz 1', class_id: CLASS8,  subject_id: SUB['Chemistry'],    date: '2026-02-10', marks: 40, teacher: SITARA_ID },

    // Class 9 quizzes
    { title: 'Math Quiz 1',      class_id: CLASS9,  subject_id: SUB['Mathematics'],  date: '2026-02-01', marks: 50, teacher: RAFEH_ID },
    { title: 'Math Quiz 2',      class_id: CLASS9,  subject_id: SUB['Mathematics'],  date: '2026-02-15', marks: 50, teacher: RAFEH_ID },
    { title: 'Physics Quiz 1',   class_id: CLASS9,  subject_id: SUB['Physics'],      date: '2026-02-05', marks: 40, teacher: RIZWANA_ID },
    { title: 'Chemistry Quiz 1', class_id: CLASS9,  subject_id: SUB['Chemistry'],    date: '2026-02-10', marks: 40, teacher: SITARA_ID },

    // Class 10 quizzes
    { title: 'Math Quiz 1',      class_id: CLASS10, subject_id: SUB['Mathematics'],  date: '2026-02-01', marks: 50, teacher: RAFEH_ID },
    { title: 'Math Quiz 2',      class_id: CLASS10, subject_id: SUB['Mathematics'],  date: '2026-02-20', marks: 50, teacher: RAFEH_ID },
    { title: 'English Quiz 1',   class_id: CLASS10, subject_id: SUB['English'],      date: '2026-02-03', marks: 40, teacher: RAFEH_ID },
    { title: 'Physics Quiz 1',   class_id: CLASS10, subject_id: SUB['Physics'],      date: '2026-02-06', marks: 40, teacher: RIZWANA_ID },
    { title: 'Biology Quiz 1',   class_id: CLASS10, subject_id: SUB['Biology'],      date: '2026-02-08', marks: 40, teacher: RIZWANA_ID },
    { title: 'Chemistry Quiz 1', class_id: CLASS10, subject_id: SUB['Chemistry'],    date: '2026-02-10', marks: 40, teacher: SITARA_ID },
    { title: 'CS Quiz 1',        class_id: CLASS10, subject_id: SUB['Computer Science'], date: '2026-02-12', marks: 30, teacher: SITARA_ID },
  ];

  const quizIds = {};
  for (const q of quizDefs) {
    const { rows } = await client.query(
      `INSERT INTO quizzes (title, subject_id, class_id, scheduled_date, total_marks, passing_marks, quiz_type, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'quiz', 'completed', $7)
       RETURNING id`,
      [q.title, q.subject_id, q.class_id, q.date, q.marks, Math.round(q.marks * 0.4), q.teacher]
    );
    const key = `${q.class_id}-${q.subject_id}`;
    if (!quizIds[key]) quizIds[key] = [];
    quizIds[key].push({ id: rows[0].id, marks: q.marks, teacher: q.teacher });
  }

  let resultCount = 0;
  for (const student of createdStudents) {
    let subjects = [];
    if (student.class_id === CLASS8)  subjects = class8Subjects;
    if (student.class_id === CLASS9)  subjects = class9Subjects;
    if (student.class_id === CLASS10) subjects = class10Subjects;

    for (const subjectId of subjects) {
      const key = `${student.class_id}-${subjectId}`;
      const studentQuizzes = quizIds[key] || [];
      for (const quiz of studentQuizzes) {
        const obtained = randomBetween(Math.round(quiz.marks * 0.4), quiz.marks);
        const percentage = Math.round((obtained / quiz.marks) * 100);
        const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' :
                      percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';

        await client.query(
          `INSERT INTO quiz_results (quiz_id, student_id, marks_obtained, total_marks, grade, is_checked, submission_status, marked_by, marked_at)
           VALUES ($1, $2, $3, $4, $5, true, 'submitted', $6, NOW())`,
          [quiz.id, student.id, obtained, quiz.marks, grade, quiz.teacher]
        );
        resultCount++;
      }
    }
  }
  console.log(`  ✓ ${quizDefs.length} quizzes + ${resultCount} quiz results created\n`);

  // ── STEP 12: Verify ───────────────────────────────────────────────────────
  console.log('STEP 12: Verification...');

  const checks = [
    { label: 'Classes',                   q: 'SELECT COUNT(*) FROM classes' },
    { label: 'Subjects',                  q: 'SELECT COUNT(*) FROM subjects' },
    { label: 'Class-subject links',        q: 'SELECT COUNT(*) FROM classes_subjects' },
    { label: 'Teacher enrollments',       q: 'SELECT COUNT(*) FROM teacher_subject_enrollments' },
    { label: 'Students',                  q: 'SELECT COUNT(*) FROM students' },
    { label: 'Student enrollments',       q: 'SELECT COUNT(*) FROM student_subject_enrollments' },
    { label: 'Timetable entries',         q: 'SELECT COUNT(*) FROM timetable' },
    { label: 'Attendance records',        q: 'SELECT COUNT(*) FROM attendance' },
    { label: 'Quizzes',                   q: 'SELECT COUNT(*) FROM quizzes' },
    { label: 'Quiz results',              q: 'SELECT COUNT(*) FROM quiz_results' },
  ];

  for (const c of checks) {
    const { rows } = await client.query(c.q);
    console.log(`  ${c.label}: ${rows[0].count}`);
  }

  console.log('\n========== SEED COMPLETE ==========\n');
  console.log('Student logins (all password: 123456):');
  for (const s of studentDefs) {
    console.log(`  ${s.email.padEnd(25)} → ${s.name} (${s.class_id === CLASS8 ? 'Class 8' : s.class_id === CLASS9 ? 'Class 9' : 'Class 10'})`);
  }
  console.log('\nTeacher logins:');
  console.log('  rafeh@aliacademy.edu          → Rafeh Siddiqui  (Math all classes + Eng10)');
  console.log('  rizwana@aliacademy.edu         → Rizwana Bibi    (Physics all classes + Bio10)');
  console.log('  sitara@aliacademy.edu          → Sitara Naz      (Chemistry all classes + CS10)');

  await client.end();
}

main().catch(e => {
  console.error('FATAL:', e);
  client.end().catch(() => {});
  process.exit(1);
});
