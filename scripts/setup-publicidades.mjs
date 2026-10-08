// Ejecutar desde la raíz del proyecto: node scripts/setup-publicidades.mjs
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Leer .env.local
const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map((p, i) => i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim()))
)

const URL  = env.NEXT_PUBLIC_SUPABASE_URL
const KEY  = env.SUPABASE_SERVICE_ROLE_KEY
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

// 1. Crear tabla
const sql = `
  create table if not exists publicidades (
    id          uuid        primary key default gen_random_uuid(),
    slot        text        not null,
    titulo      text,
    imagen_url  text        not null,
    url_destino text,
    para_free   boolean     not null default true,
    para_plan10 boolean     not null default false,
    activa      boolean     not null default true,
    orden       int         not null default 0,
    creado_en   timestamptz not null default now()
  );
  alter table publicidades enable row level security;
  do $$ begin
    if not exists (
      select 1 from pg_policies where tablename = 'publicidades' and policyname = 'publicidades_select'
    ) then
      create policy "publicidades_select" on publicidades for select using (true);
    end if;
  end $$;
`

const sqlRes = await fetch(`${URL}/rest/v1/rpc/query`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ query: sql }),
}).then(r => r.json())

if (sqlRes.error || sqlRes.message) {
  // Intentar con el endpoint de Management API
  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${URL.split('.')[0].split('//')[1]}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  }).then(r => r.json())
  console.log('Tabla (mgmt):', JSON.stringify(mgmtRes))
} else {
  console.log('Tabla: OK')
}

// 2. Crear bucket marcas (no "publicidades": los bloqueadores de anuncios bloquean esas URLs)
const bucketRes = await fetch(`${URL}/storage/v1/bucket`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ id: 'marcas', name: 'marcas', public: true }),
}).then(r => r.json())

if (bucketRes.error) {
  console.log('Bucket:', bucketRes.error === 'The resource already exists' ? 'ya existe (OK)' : bucketRes.error)
} else {
  console.log('Bucket: creado OK')
}
