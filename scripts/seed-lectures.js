// scripts/seed-lectures.js
// Seeds lecture data (max 2 per subject per class) + lecture_access records.
// Safe to run multiple times — clears existing lectures first.

const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.odvlzuktfdnmsoijlhaq',
  password: 'Shaheer@0107',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

// Public sample PDF — used as placeholder file for all lectures
const SAMPLE_PDF_URL  = 'https://www.africau.edu/images/default/sample.pdf';
const SAMPLE_PDF_NAME = 'lecture_notes.pdf';
const SAMPLE_PDF_TYPE = 'application/pdf';

// Real YouTube lecture links (public, educational)
const YT = {
  math:    'https://www.youtube.com/watch?v=OmJ-4B-mS-Y',   // Khan Academy algebra
  english: 'https://www.youtube.com/watch?v=1wnBBbB0eqo',   // Essay writing
  physics: 'https://www.youtube.com/watch?v=ZM8ECpBuQYE',   // Newton's laws
  biology: 'https://www.youtube.com/watch?v=8IlzKri08kk',   // Cell structure
  chem:    'https://www.youtube.com/watch?v=FSyAehMdpyI',   // Atomic structure
  cs:      'https://www.youtube.com/watch?v=zOjov-2OZ0E',   // Programming basics
};

async function main() {
  await client.connect();
  console.log('\n========== LECTURE SEED ==========\n');

  // ── 1. Fetch existing IDs ──────────────────────────────────────────────────
  const { rows: classRows }   = await client.query(`SELECT id, name FROM classes ORDER BY name`);
  const { rows: subjectRows } = await client.query(`SELECT id, name FROM subjects ORDER BY name`);
  const { rows: teacherRows } = await client.query(`SELECT id, email FROM profiles WHERE role = 'teacher'`);

  if (!classRows.length || !subjectRows.length || !teacherRows.length) {
    console.error('❌ No classes/subjects/teachers found. Run seed-database.js first.');
    process.exit(1);
  }

  const C = {};  // class name → id
  for (const r of classRows) C[r.name] = r.id;

  const S = {};  // subject name → id
  for (const r of subjectRows) S[r.name] = r.id;

  const T = {};  // email → id
  for (const r of teacherRows) T[r.email] = r.id;

  console.log('Classes:',  Object.keys(C).join(', '));
  console.log('Subjects:', Object.keys(S).join(', '));
  console.log('Teachers:', Object.keys(T).join(', '));
  console.log();

  const RAFEH   = T['rafeh@aliacademy.edu'];
  const RIZWANA = T['rizwana@aliacademy.edu'];
  const SITARA  = T['sitara@aliacademy.edu'];

  // ── 2. Clear existing lectures (cascade deletes lecture_access + lecture_views) ──
  console.log('Clearing existing lectures...');
  await client.query(`DELETE FROM lecture_access`);
  await client.query(`DELETE FROM lecture_views`);
  await client.query(`DELETE FROM lectures`);
  console.log('  ✓ Cleared\n');

  // ── 3. Define lecture data ─────────────────────────────────────────────────
  // Format: [title, description, youtube_link, class_name, subject_name, teacher_email]
  const lectureDefs = [
    // ── Mathematics ───────────────────────────────────────────────────────────
    ['Introduction to Algebra',    'Variables, expressions and basic equations.',         YT.math,    'Class 8',  'Mathematics', 'rafeh@aliacademy.edu'],
    ['Linear Equations',           'Solving single-variable linear equations step by step.', YT.math,  'Class 8',  'Mathematics', 'rafeh@aliacademy.edu'],

    ['Quadratic Equations',        'Factoring and the quadratic formula.',                YT.math,    'Class 9',  'Mathematics', 'rafeh@aliacademy.edu'],
    ['Polynomials',                'Degree, terms and operations on polynomials.',         YT.math,    'Class 9',  'Mathematics', 'rafeh@aliacademy.edu'],

    ['Trigonometry Basics',        'Sine, cosine, tangent and the unit circle.',           YT.math,    'Class 10', 'Mathematics', 'rafeh@aliacademy.edu'],
    ['Coordinate Geometry',        'Distance formula, mid-point and slope of a line.',     YT.math,    'Class 10', 'Mathematics', 'rafeh@aliacademy.edu'],

    // ── English ───────────────────────────────────────────────────────────────
    ['Essay Writing Fundamentals', 'Structure of an academic essay: intro, body, conclusion.', YT.english, 'Class 10', 'English', 'rafeh@aliacademy.edu'],
    ['Grammar & Punctuation',      'Common grammar rules and punctuation usage.',          YT.english,  'Class 10', 'English', 'rafeh@aliacademy.edu'],

    // ── Physics ───────────────────────────────────────────────────────────────
    ['Laws of Motion',             "Newton's three laws with real-world examples.",        YT.physics, 'Class 8',  'Physics', 'rizwana@aliacademy.edu'],
    ['Gravitational Force',        'Universal gravitation and free fall.',                 YT.physics, 'Class 8',  'Physics', 'rizwana@aliacademy.edu'],

    ['Electricity Basics',         'Charge, current, voltage and Ohm\'s law.',            YT.physics, 'Class 9',  'Physics', 'rizwana@aliacademy.edu'],
    ['Magnetic Fields',            'Magnetic flux, field lines and electromagnets.',       YT.physics, 'Class 9',  'Physics', 'rizwana@aliacademy.edu'],

    ['Wave Optics',                'Interference, diffraction and polarisation.',          YT.physics, 'Class 10', 'Physics', 'rizwana@aliacademy.edu'],
    ['Nuclear Physics',            'Radioactivity, fission and fusion.',                   YT.physics, 'Class 10', 'Physics', 'rizwana@aliacademy.edu'],

    // ── Biology ───────────────────────────────────────────────────────────────
    ['Cell Structure & Function',  'Organelles, membrane and cell theory.',                YT.biology, 'Class 10', 'Biology', 'rizwana@aliacademy.edu'],
    ['Introduction to Genetics',   'DNA, genes, chromosomes and Mendelian inheritance.',  YT.biology, 'Class 10', 'Biology', 'rizwana@aliacademy.edu'],

    // ── Chemistry ─────────────────────────────────────────────────────────────
    ['Atomic Structure',           'Protons, neutrons, electrons and electron shells.',    YT.chem,    'Class 8',  'Chemistry', 'sitara@aliacademy.edu'],
    ['Chemical Bonding',           'Ionic, covalent and metallic bonds explained.',        YT.chem,    'Class 8',  'Chemistry', 'sitara@aliacademy.edu'],

    ['Acids, Bases & Salts',       'pH scale, neutralisation and common reactions.',       YT.chem,    'Class 9',  'Chemistry', 'sitara@aliacademy.edu'],
    ['Chemical Thermodynamics',    'Enthalpy, entropy and Gibbs free energy.',             YT.chem,    'Class 9',  'Chemistry', 'sitara@aliacademy.edu'],

    ['Organic Chemistry Intro',    'Hydrocarbons, functional groups and IUPAC naming.',    YT.chem,    'Class 10', 'Chemistry', 'sitara@aliacademy.edu'],
    ['Electrochemistry',           'Electrolysis, galvanic cells and electrode reactions.',YT.chem,    'Class 10', 'Chemistry', 'sitara@aliacademy.edu'],

    // ── Computer Science ──────────────────────────────────────────────────────
    ['Programming Fundamentals',   'Variables, data types, loops and conditionals.',      YT.cs,      'Class 10', 'Computer Science', 'sitara@aliacademy.edu'],
    ['Introduction to Data Structures', 'Arrays, linked lists, stacks and queues.',      YT.cs,      'Class 10', 'Computer Science', 'sitara@aliacademy.edu'],
  ];

  // ── 4. Insert lectures + lecture_access ───────────────────────────────────
  console.log(`Inserting ${lectureDefs.length} lectures...`);
  let inserted = 0;
  const errors = [];

  for (const [title, description, ytLink, className, subjectName, teacherEmail] of lectureDefs) {
    const classId   = C[className];
    const subjectId = S[subjectName];
    const teacherId = T[teacherEmail];

    if (!classId || !subjectId || !teacherId) {
      errors.push(`  ✗ Missing ref for: "${title}" (class=${className}, subject=${subjectName}, teacher=${teacherEmail})`);
      continue;
    }

    try {
      // Insert lecture
      const { rows } = await client.query(`
        INSERT INTO lectures
          (title, description, file_url, file_name, file_type, youtube_link,
           class_id, subject_id, uploaded_by, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
        RETURNING id
      `, [title, description, SAMPLE_PDF_URL, SAMPLE_PDF_NAME, SAMPLE_PDF_TYPE,
          ytLink, classId, subjectId, teacherId]);

      const lectureId = rows[0].id;

      // Insert class-level lecture_access
      await client.query(`
        INSERT INTO lecture_access (lecture_id, class_id, access_type, granted_by)
        VALUES ($1, $2, 'class', $3)
      `, [lectureId, classId, teacherId]);

      console.log(`  ✓ [${className} / ${subjectName}] ${title}`);
      inserted++;
    } catch (err) {
      errors.push(`  ✗ Failed: "${title}" — ${err.message}`);
    }
  }

  console.log(`\n========== DONE ==========`);
  console.log(`  Inserted : ${inserted} lectures`);
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
