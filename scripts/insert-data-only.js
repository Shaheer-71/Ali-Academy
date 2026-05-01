const fs = require('fs');
const { Client } = require('pg');

const BACKUP_FILE = './supabase/backup/Ali-Academy.backup';

function extractCopyBlocks(backupContent) {
  const lines = backupContent.split('\n');
  const copyBlocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.match(/^COPY public\./)) {
      const dataLines = [];
      i++;
      while (i < lines.length && lines[i] !== '\\.') {
        dataLines.push(lines[i]);
        i++;
      }
      if (dataLines.length > 0) {
        copyBlocks.push({ header: line, data: dataLines });
      }
    }
    i++;
  }
  return copyBlocks;
}

function copyToInsert(header, dataLines) {
  const match = header.match(/^COPY public\.(\w+)\s*\(([^)]+)\)\s*FROM stdin;/);
  if (!match) return null;

  const tableName = match[1];
  const columns = match[2].split(',').map(c => c.trim());

  const inserts = [];
  for (const row of dataLines) {
    if (!row.trim()) continue;
    const values = row.split('\t').map(val => {
      if (val === '\\N') return 'NULL';
      val = val.replace(/\\t/g, '\t').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\\\/g, '\\');
      if (/^-?\d+(\.\d+)?$/.test(val)) return val;
      if (val === 't') return 'true';
      if (val === 'f') return 'false';
      return `'${val.replace(/'/g, "''")}'`;
    });
    inserts.push(`(${values.join(', ')})`);
  }

  if (inserts.length === 0) return null;

  const batchSize = 50;
  const statements = [];
  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize);
    statements.push(`INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES\n  ${batch.join(',\n  ')}\n  ON CONFLICT DO NOTHING;`);
  }
  return { tableName, statements };
}

async function insertData() {
  console.log('📖 Reading backup...');
  const content = fs.readFileSync(BACKUP_FILE, 'utf8');
  const blocks = extractCopyBlocks(content);
  console.log(`✅ Found ${blocks.length} tables with data`);

  console.log('\n🔌 Connecting...');
  const client = new Client({
    host: 'aws-1-ap-northeast-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.odvlzuktfdnmsoijlhaq',
    password: 'Shaheer@0107',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected!\n📦 Inserting data...\n');

  // Insert in dependency order
  const ORDER = ['profiles', 'classes', 'subjects', 'students', 'classes_subjects',
                 'lectures', 'lecture_access', 'lecture_views', 'attendance',
                 'attendance_sessions', 'quizzes', 'quiz_results',
                 'diary_assignments', 'timetable'];

  const blockMap = {};
  for (const b of blocks) {
    const m = b.header.match(/COPY public\.(\w+)/);
    if (m) blockMap[m[1]] = b;
  }

  for (const tableName of ORDER) {
    const block = blockMap[tableName];
    if (!block) { console.log(`  ⏭️  ${tableName}: no data`); continue; }

    const result = copyToInsert(block.header, block.data);
    if (!result) { console.log(`  ⏭️  ${tableName}: parse failed`); continue; }

    let ok = 0;
    for (const stmt of result.statements) {
      try {
        await client.query(stmt);
        ok += block.data.length;
      } catch (err) {
        console.log(`  ❌ ${tableName}: ${err.message}`);
      }
    }
    console.log(`  ✅ ${tableName}: ${block.data.length} rows`);
  }

  await client.end();
  console.log('\n🎉 Data restore complete!');
}

insertData().catch(console.error);
