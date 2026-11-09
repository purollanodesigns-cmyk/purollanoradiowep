import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = "https://paasocggyskhfatzhhwq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYXNvY2dneXNraGZhdHpoaHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzcwNzIsImV4cCI6MjA5OTQxMzA3Mn0.xn7DOJOv6SQNsZ1mrQXaMHLEZDHNA5X5_S0BRMRp0aw";

const tables = [
  'announcements',
  'comments',
  'profiles',
  'push_tokens',
  'push_subscriptions',
  'push_state',
  'user_roles',
  'recommended_videos',
  'site_visits',
  'visit_events'
];

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};

const outputDir = path.resolve('database_backup');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let allSqlInserts = `-- Supabase Data Backup\n-- Generated on ${new Date().toISOString()}\n\n`;

for (const table of tables) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers });
    if (!res.ok) {
      console.log(`[${table}] HTTP ${res.status}: ${res.statusText}`);
      const errText = await res.text();
      fs.writeFileSync(path.join(outputDir, `${table}.error.json`), JSON.stringify({ status: res.status, error: errText }, null, 2));
      continue;
    }
    const data = await res.json();
    console.log(`[${table}] Descargados ${data.length} registros.`);
    fs.writeFileSync(path.join(outputDir, `${table}.json`), JSON.stringify(data, null, 2));

    if (Array.isArray(data) && data.length > 0) {
      allSqlInserts += `-- Table: ${table} (${data.length} records)\n`;
      for (const row of data) {
        const columns = Object.keys(row);
        const values = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number' || typeof val === 'boolean') return `${val}`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        allSqlInserts += `INSERT INTO public.${table} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      allSqlInserts += '\n';
    }
  } catch (err) {
    console.error(`[${table}] Error al descargar:`, err.message);
  }
}

fs.writeFileSync(path.join(outputDir, 'backup_data.sql'), allSqlInserts, 'utf-8');
console.log('Respaldo de base de datos finalizado con éxito.');
