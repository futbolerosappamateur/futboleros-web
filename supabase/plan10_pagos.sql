-- Plan 10 con Mercado Pago: pagos acreditados, débito automático, links de pago desde la app,
-- vencimiento y protección de las columnas del plan. Correr una vez en el SQL Editor de Supabase.

-- 1. Hasta cuándo está pago el plan (plan y plan_vence ya existían desde agosto)
alter table perfiles add column if not exists plan integer default 0;
alter table perfiles add column if not exists plan_vence timestamptz;

-- 2. Pagos acreditados: uno por pago de Mercado Pago, así el mismo aviso nunca acredita dos veces
create table if not exists pagos_plan10 (
  mp_payment_id text primary key,
  usuario_id    uuid not null,
  tipo          text not null check (tipo in ('mensual', 'anual')),
  monto         numeric not null,
  vence         timestamptz,
  created_at    timestamptz not null default now()
);
alter table pagos_plan10 enable row level security;   -- sin políticas: solo el servidor

-- 3. Débito automático de cada usuario (para mostrarlo en /pagar y poder darlo de baja)
create table if not exists suscripciones_plan10 (
  usuario_id        uuid primary key,
  mp_preapproval_id text not null,
  estado            text not null,   -- pending / authorized / paused / cancelled
  actualizado       timestamptz not null default now()
);
alter table suscripciones_plan10 enable row level security;   -- sin políticas: solo el servidor

-- 4. Links de pago desde la app: la app pide un código con su sesión y abre la web con él (vale 30 minutos)
create table if not exists pago_codigos (
  codigo     text primary key,
  usuario_id uuid not null,
  expira     timestamptz not null default now() + interval '30 minutes'
);
alter table pago_codigos enable row level security;   -- sin políticas: solo el servidor

-- 5. Acreditar un pago: lo registra y extiende el plan desde lo que le quedaba (o desde hoy)
create or replace function acreditar_plan10(p_payment_id text, p_usuario uuid, p_tipo text, p_monto numeric)
returns timestamptz
language plpgsql
set search_path = public
as $$
declare
  v_vence timestamptz;
begin
  insert into pagos_plan10 (mp_payment_id, usuario_id, tipo, monto)
  values (p_payment_id, p_usuario, p_tipo, p_monto)
  on conflict (mp_payment_id) do nothing;
  if not found then
    return null;   -- ese pago ya estaba acreditado
  end if;

  update perfiles
     set es_pro = true,
         plan = 10,
         plan_vence = greatest(coalesce(plan_vence, now()), now())
                      + case when p_tipo = 'anual' then interval '12 months' else interval '1 month' end
   where id = p_usuario
  returning plan_vence into v_vence;

  update pagos_plan10 set vence = v_vence where mp_payment_id = p_payment_id;
  return v_vence;
end;
$$;
revoke execute on function acreditar_plan10(text, uuid, text, numeric) from public, anon, authenticated;

-- 6. Que nadie se dé Plan 10 ni se haga admin solo: la política de perfiles deja editar cualquier columna
--    de la fila propia. Desde la app y la web (roles authenticated/anon) estas columnas quedan como estaban,
--    salvo para los admins; el servidor (service_role), el SQL Editor y el cron pueden cambiarlas.
--    La versión vigente (que suma acceso_panel) está en futboleros/supabase/acceso_panel.sql: no volver a correr esta.
create or replace function proteger_plan10()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') or es_admin_actual() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.es_pro := false;
    new.plan := 0;
    new.plan_vence := null;
    new.is_admin := false;
  else
    new.es_pro := old.es_pro;
    new.plan := old.plan;
    new.plan_vence := old.plan_vence;
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;
drop trigger if exists proteger_plan10 on perfiles;
create trigger proteger_plan10 before insert or update on perfiles
  for each row execute function proteger_plan10();

-- 7. Vencimiento: cada hora se apaga el Plan 10 pago que venció hace más de 3 días (margen para los
--    reintentos del débito). El que se da a mano desde el AdminPanel no tiene plan_vence y no se toca.
create extension if not exists pg_cron;
select cron.schedule('vencer-plan10', '0 * * * *', $$
  update perfiles set es_pro = false, plan = 0, plan_vence = null
   where es_pro and plan_vence < now() - interval '3 days';
  delete from pago_codigos where expira < now() - interval '1 day';
$$);
