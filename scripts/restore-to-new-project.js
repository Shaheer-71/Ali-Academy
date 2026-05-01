const fs = require('fs');
const { Client } = require('pg');

const BACKUP_FILE = './supabase/backup/Ali-Academy.backup';

const DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com';
const DB_USER = 'postgres.odvlzuktfdnmsoijlhaq';
const DB_PASSWORD = 'Shaheer@0107';

const SYSTEM_SCHEMAS = ['auth', 'extensions', 'graphql', 'graphql_public', 'pgbouncer', 'realtime', 'storage', '_realtime', 'supabase_functions'];

function parseBackup(backupContent) {
  const lines = backupContent.split('\n');
  const ddlStatements = [];
  const copyBlocks = [];

  let i = 0;
  let currentSchema = null;

  while (i < lines.length) {
    const line = lines[i];

    // Detect section header
    const sectionMatch = line.match(/^-- Name: (.+?); Type: (.+?); Schema: (.+?); Owner:/);
    if (sectionMatch) {
      currentSchema = sectionMatch[3].trim();
    }

    // Handle COPY blocks for public schema
    if (line.match(/^COPY public\./)) {
      const copyHeader = line;
      const dataLines = [];
      i++;
      while (i < lines.length && lines[i] !== '\\.') {
        dataLines.push(lines[i]);
        i++;
      }
      // Only include non-empty COPY blocks
      if (dataLines.length > 0) {
        copyBlocks.push({ header: copyHeader, data: dataLines });
      }
      i++;
      continue;
    }

    // Collect DDL for public schema (skip system schemas)
    if (currentSchema === 'public') {
      // Skip OWNER TO and GRANT lines that reference system roles we don't control
      if (line.match(/^ALTER .+ OWNER TO (supabase_admin|supabase_auth_admin|supabase_storage_admin|authenticator)/)) {
        i++;
        continue;
      }
      ddlStatements.push(line);
    }

    i++;
  }

  return { ddlStatements, copyBlocks };
}

function copyToInsert(copyHeader, dataLines) {
  // Parse: COPY public.tablename (col1, col2, col3) FROM stdin;
  const match = copyHeader.match(/^COPY public\.(\w+)\s*\(([^)]+)\)\s*FROM stdin;/);
  if (!match) return null;

  const tableName = match[1];
  const columns = match[2].split(',').map(c => c.trim());

  const inserts = [];
  for (const row of dataLines) {
    if (!row.trim()) continue;

    const values = row.split('\t').map((val, idx) => {
      if (val === '\\N') return 'NULL';

      // Unescape postgres COPY format
      val = val
        .replace(/\\t/g, '\t')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\');

      // Check if it's a number
      if (/^-?\d+(\.\d+)?$/.test(val)) return val;
      // Check if boolean
      if (val === 't') return 'true';
      if (val === 'f') return 'false';

      // Escape single quotes and wrap in quotes
      val = val.replace(/'/g, "''");
      return `'${val}'`;
    });

    inserts.push(`(${values.join(', ')})`);
  }

  if (inserts.length === 0) return null;

  // Insert in batches of 100 rows to avoid huge statements
  const batchSize = 100;
  const statements = [];
  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize);
    statements.push(
      `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES\n  ${batch.join(',\n  ')}\n  ON CONFLICT DO NOTHING;`
    );
  }
  return statements;
}

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    // Detect dollar-quoted strings ($$...$$  or $tag$...$tag$)
    if (!inDollarQuote) {
      const dollarMatch = sql.slice(i).match(/^\$([^$]*)\$/);
      if (dollarMatch) {
        dollarTag = dollarMatch[0];
        inDollarQuote = true;
        current += dollarTag;
        i += dollarTag.length;
        continue;
      }
    } else {
      if (sql.slice(i).startsWith(dollarTag)) {
        inDollarQuote = false;
        current += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }

    const ch = sql[i];
    current += ch;

    if (!inDollarQuote && ch === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 1) {
        statements.push(trimmed);
      }
      current = '';
    }

    i++;
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

async function restoreToNewProject() {
  console.log('📖 Reading backup file...');
  const backupContent = fs.readFileSync(BACKUP_FILE, 'utf8');
  const totalLines = backupContent.split('\n').length;
  console.log(`✅ Read ${totalLines} lines`);

  console.log('\n🔍 Parsing backup...');
  const { ddlStatements, copyBlocks } = parseBackup(backupContent);
  console.log(`✅ Found ${ddlStatements.length} DDL lines and ${copyBlocks.length} COPY blocks`);

  // Convert COPY to INSERT
  console.log('\n🔄 Converting COPY blocks to INSERT statements...');
  const insertStatements = [];
  for (const block of copyBlocks) {
    const stmts = copyToInsert(block.header, block.data);
    if (stmts) {
      insertStatements.push(...stmts);
      const match = block.header.match(/COPY public\.(\w+)/);
      console.log(`  ✅ ${match[1]}: ${block.data.length} rows`);
    }
  }

  // Build final SQL
  const ddlSQL = ddlStatements.join('\n');
  const dataSQL = insertStatements.join('\n\n');

  // Save for inspection
  fs.writeFileSync('./scripts/extracted-schema.sql', ddlSQL);
  fs.writeFileSync('./scripts/extracted-data.sql', dataSQL);
  console.log('\n💾 Saved extracted SQL to scripts/extracted-schema.sql and scripts/extracted-data.sql');

  // Connect to Ali-Academy-1.0
  console.log('\n🔌 Connecting to Ali-Academy-1.0...');
  const client = new Client({
    host: DB_HOST,
    port: 5432,
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected!');

    // Step 1: Apply schema statement by statement
    console.log('\n📋 Applying schema (DDL)...');
    const statements = splitStatements(ddlSQL);
    console.log(`  Running ${statements.length} DDL statements...`);
    let ddlOk = 0, ddlFail = 0;
    for (const stmt of statements) {
      if (!stmt.trim()) continue;
      try {
        await client.query(stmt);
        ddlOk++;
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          ddlOk++;
        } else {
          ddlFail++;
          console.error(`  ⚠️  ${err.message.split('\n')[0]}`);
        }
      }
    }
    console.log(`✅ Schema done: ${ddlOk} ok, ${ddlFail} failed`);

    // Step 2: Insert data table by table
    console.log('\n📦 Inserting data...');
    for (const stmt of insertStatements) {
      const tableMatch = stmt.match(/INSERT INTO public\.(\w+)/);
      const tableName = tableMatch ? tableMatch[1] : 'unknown';
      try {
        await client.query(stmt);
        process.stdout.write(`  ✅ ${tableName}\n`);
      } catch (err) {
        console.error(`  ❌ ${tableName}: ${err.message}`);
      }
    }

    console.log('\n🎉 Restore complete!');

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

restoreToNewProject().catch(console.error);
