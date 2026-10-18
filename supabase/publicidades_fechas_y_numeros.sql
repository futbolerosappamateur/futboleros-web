-- Publicidades con fechas de inicio y fin, y con vistas y clics (2026-10-18).
-- Correr una vez en el SQL Editor de Supabase, antes de cargar fechas desde el panel admin.

-- 1. Fechas, opcionales, en hora argentina. El último día se incluye: con desde 2026-11-01 y
--    hasta 2026-11-30, el aviso se ve todo noviembre. Sin fechas, se ve mientras esté activo.
alter table publicidades add column if not exists desde date;
alter table publicidades add column if not exists hasta date;

-- 2. Vistas y clics de cada aviso, por día (hora argentina). Vista: al menos la mitad del aviso en
--    pantalla durante un segundo. Clic: abren su link. Se cuenta una de cada por visita a la página.
--    Los manda la web publicada a /api/marcas (la local no cuenta: usa esta misma base).
--    Si se borra el aviso, se borran sus números.
create table if not exists publicidades_stats (
  publicidad_id uuid    not null references publicidades(id) on delete cascade,
  dia           date    not null,
  vistas        integer not null default 0,
  clics         integer not null default 0,
  primary key (publicidad_id, dia)
);
alter table publicidades_stats enable row level security;   -- sin políticas: solo el servidor

-- 3. Suma una vista o un clic al día de hoy. La llama solo el servidor de la web
create or replace function contar_publicidad(p_id uuid, p_tipo text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into publicidades_stats (publicidad_id, dia, vistas, clics)
  values (p_id, (now() at time zone 'America/Argentina/Buenos_Aires')::date,
          (p_tipo = 'vista')::integer, (p_tipo = 'clic')::integer)
  on conflict (publicidad_id, dia) do update
    set vistas = publicidades_stats.vistas + excluded.vistas,
        clics  = publicidades_stats.clics + excluded.clics;
$$;

revoke execute on function contar_publicidad(uuid, text) from public, anon, authenticated;
grant execute on function contar_publicidad(uuid, text) to service_role;

-- 4. Totales por mes, para el panel admin. Con security_invoker vale el RLS de la tabla: solo el servidor
create or replace view publicidades_stats_mes with (security_invoker = true) as
select publicidad_id,
       date_trunc('month', dia)::date as mes,
       sum(vistas)::integer as vistas,
       sum(clics)::integer  as clics
from publicidades_stats
group by publicidad_id, date_trunc('month', dia);

-- 5. El lugar "Home — Columna figurita (alto)" ya no existe: se borra su aviso (Chehosting, sin título),
--    que no se veía en ninguna página
delete from publicidades where slot = 'home_figurita';

-- Control (no cambia nada): tiene que dar true en las cinco columnas
select
  (select count(*) from information_schema.columns
    where table_name = 'publicidades' and column_name in ('desde', 'hasta')) = 2 as fechas,
  to_regclass('public.publicidades_stats') is not null                as tabla_stats,
  to_regclass('public.publicidades_stats_mes') is not null            as totales_por_mes,
  to_regprocedure('public.contar_publicidad(uuid, text)') is not null as funcion_contar,
  not exists (select 1 from publicidades where slot = 'home_figurita') as sin_aviso_figurita;
