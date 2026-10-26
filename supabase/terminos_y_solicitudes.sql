-- Aceptación de los Términos y Condiciones y la Política de Privacidad, y pedidos de los botones de
-- arrepentimiento y de baja de la web. Correr una vez en el SQL Editor de Supabase, ANTES de subir la web
-- y la app que los usan (las dos leen y escriben estas columnas).

-- 1. Qué versión de los textos aceptó cada jugador y cuándo.
--    La casilla del registro con email viaja en los datos de la cuenta (raw_user_meta_data.terminos_version),
--    como la newsletter, porque el perfil se crea después. Quien entra con Google los acepta en una pantalla
--    aparte y la versión se guarda directo en el perfil. La fecha la pone siempre la base: desde la app o la
--    web solo se elige la versión, así nadie puede cambiar cuándo aceptó.
alter table perfiles add column if not exists terminos_version text;
alter table perfiles add column if not exists terminos_aceptados_en timestamptz;

-- Perfiles de cuentas que aceptaron al registrarse antes de correr esto. Va antes del trigger para que la
-- fecha sea la del registro y no la de hoy
update perfiles p
set terminos_version = u.raw_user_meta_data->>'terminos_version',
    terminos_aceptados_en = u.created_at
from auth.users u
where u.id = p.id
  and p.terminos_version is null
  and u.raw_user_meta_data->>'terminos_version' is not null;

create or replace function perfiles_terminos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version text;
  v_registro timestamptz;
begin
  if tg_op = 'INSERT' then
    if new.terminos_version is null then
      -- Nunca frena la creación del perfil: si no se puede leer la cuenta, queda sin aceptar
      begin
        select u.raw_user_meta_data->>'terminos_version', u.created_at
          into v_version, v_registro
          from auth.users u
         where u.id = new.id;
      exception when others then
        v_version := null;
      end;
      new.terminos_version := v_version;
      new.terminos_aceptados_en := case when v_version is not null then v_registro end;
    else
      new.terminos_aceptados_en := now();
    end if;
    return new;
  end if;

  if new.terminos_version is distinct from old.terminos_version then
    new.terminos_aceptados_en := case when new.terminos_version is not null then now() end;
  else
    new.terminos_aceptados_en := old.terminos_aceptados_en;
  end if;
  return new;
end;
$$;

drop trigger if exists perfiles_terminos on perfiles;
create trigger perfiles_terminos
  before insert or update of terminos_version, terminos_aceptados_en on perfiles
  for each row execute function perfiles_terminos();

-- 2. Pedidos de los botones de arrepentimiento y de baja. Llegan desde la web sin pedir cuenta y se atienden
--    a mano desde /admin/solicitudes. Sin políticas: solo el servidor (service role) los lee y los escribe.
create table if not exists solicitudes_consumidor (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique,   -- el código de trámite que se le muestra al que pide
  tipo        text not null check (tipo in ('arrepentimiento', 'baja')),
  nombre      text not null,
  email       text not null,
  usuario_id  uuid,                    -- la cuenta con ese email, si hay
  detalle     text,
  estado      text not null default 'pendiente' check (estado in ('pendiente', 'resuelta', 'rechazada')),
  nota        text,                    -- lo que anota el admin al cerrarla
  creado_en   timestamptz not null default now(),
  resuelto_en timestamptz
);
alter table solicitudes_consumidor enable row level security;
create index if not exists solicitudes_consumidor_email on solicitudes_consumidor (email, creado_en desc);

-- La cuenta de un email, para asociarle el pedido. Solo el servidor
create or replace function usuario_por_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
$$;
revoke execute on function usuario_por_email(text) from public, anon, authenticated;
grant execute on function usuario_por_email(text) to service_role;

-- Control (no cambia nada): perfiles con los textos aceptados y pedidos cargados
select (select count(*) from perfiles where terminos_version is not null) as aceptaron,
       (select count(*) from perfiles) as perfiles,
       (select count(*) from solicitudes_consumidor) as solicitudes;
