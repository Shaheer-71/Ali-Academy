const { Client } = require('pg');
const client = new Client({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.odvlzuktfdnmsoijlhaq',
  password: 'Shaheer@0107',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async () => {
  const RAFEH = '832699b1-72c2-45eb-86ca-c1edcce655fd';

  const { rows: tse } = await client.query(
    'SELECT class_id, subject_id FROM teacher_subject_enrollments WHERE teacher_id = $1',
    [RAFEH]
  );
  const classIds = [...new Set(tse.map(r => r.class_id))];
  const subjectIds = [...new Set(tse.map(r => r.subject_id))];
  console.log('Rafeh classIds:', classIds.length, '| subjectIds:', subjectIds.length);

  const { rows: sse } = await client.query(
    'SELECT student_id, class_id FROM student_subject_enrollments WHERE class_id = ANY($1) AND subject_id = ANY($2)',
    [classIds, subjectIds]
  );
  const studentIds = [...new Set(sse.map(r => r.student_id))];
  console.log('Students enrolled in Rafeh subjects:', studentIds.length);

  const { rows: students } = await client.query(
    'SELECT id, full_name, class_id FROM students WHERE id = ANY($1) AND is_deleted=false',
    [studentIds]
  );
  console.log('Student records found:', students.length);
  students.forEach(s => console.log(' -', s.full_name));

  const { rows: attendance } = await client.query(
    'SELECT student_id, status, COUNT(*) as cnt FROM attendance WHERE student_id = ANY($1) GROUP BY student_id, status LIMIT 5',
    [studentIds]
  );
  console.log('\nAttendance sample (first 5 rows):');
  attendance.forEach(r => console.log(' -', r.student_id.substring(0,8), r.status, r.cnt));

  const { rows: quizResults } = await client.query(
    'SELECT qr.student_id, qr.percentage, q.class_id FROM quiz_results qr JOIN quizzes q ON q.id = qr.quiz_id WHERE qr.student_id = ANY($1) LIMIT 5',
    [studentIds]
  );
  console.log('\nQuiz result sample (first 5 rows):');
  quizResults.forEach(r => console.log(' -', r.student_id.substring(0,8), 'pct:', r.percentage));

  await client.end();
}).catch(e => console.error(e));
