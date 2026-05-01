const fs = require('fs');
const { Client } = require('pg');

const content = fs.readFileSync('./supabase/backup/Ali-Academy.backup', 'utf8');
const lines = content.split('\n');
let inBlock = false, data = [], header = '';

for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^COPY public\.timetable /)) { inBlock = true; header = lines[i]; continue; }
  if (inBlock && lines[i] === '\\.') break;
  if (inBlock) data.push(lines[i]);
}

const match = header.match(/^COPY public\.timetable\s*\(([^)]+)\)\s*FROM stdin;/);
const columns = match[1].split(',').map(c => c.trim());

const rows = data.filter(r => r.trim()).map(row => {
  const values = row.split('\t').map(val => {
    if (val === '\\N') return 'NULL';
    val = val.replace(/\\t/g, '\t').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\\\/g, '\\');
    if (/^-?\d+(\.\d+)?$/.test(val)) return val;
    if (val === 't') return 'true';
    if (val === 'f') return 'false';
    return "'" + val.replace(/'/g, "''") + "'";
  });
  return '(' + values.join(', ') + ')';
});

const client = new Client({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.odvlzuktfdnmsoijlhaq',
  password: 'Shaheer@0107',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect().then(async () => {
  let ok = 0;
  for (const row of rows) {
    try {
      await client.query('INSERT INTO public.timetable (' + columns.join(', ') + ') VALUES ' + row);
      ok++;
    } catch(e) {
      if (!e.message.includes('duplicate') && !e.message.includes('unique')) {
        console.log('  ❌', e.message.split('\n')[0]);
      }
    }
  }
  console.log('Timetable: ' + ok + '/' + rows.length + ' rows inserted');
  await client.end();
}).catch(console.error);
