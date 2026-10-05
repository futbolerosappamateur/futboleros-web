-- Tabla de publicidades propias (imágenes de negocios que publican en Futboleros)
create table if not exists publicidades (
  id          uuid        primary key default gen_random_uuid(),
  slot        text        not null,          -- 'home_principal' | 'home_figurita' | 'perfil_testimonios'
  titulo      text,                          -- nombre interno para el admin
  imagen_url  text        not null,
  url_destino text,
  para_free   boolean     not null default true,
  para_plan10 boolean     not null default false,
  activa      boolean     not null default true,
  orden       int         not null default 0,
  creado_en   timestamptz not null default now()
);

-- Lectura pública (cualquier visitante puede ver las ads activas)
alter table publicidades enable row level security;
create policy "publicidades_select" on publicidades for select using (true);

-- Bucket público para las imágenes de publicidades
-- (correr esto en Supabase Storage o desde el dashboard)
-- insert into storage.buckets (id, name, public) values ('publicidades', 'publicidades', true);
