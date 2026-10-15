-- Newsletter: cada jugador elige si recibe por email las novedades y promociones de Futboleros.
-- Los envíos salen de un WordPress con el plugin Newsletter: la lista se baja en CSV desde el panel
-- admin de la web (/admin/newsletter) y se importa en el plugin.
--
-- perfiles.newsletter: null = todavía no eligió (las cuentas de antes: no recibe), true = sí, false = no.
-- La casilla del registro (app y web) viaja en los datos de la cuenta (raw_user_meta_data.newsletter)
-- porque el perfil se crea después: la app al primer ingreso, la web al entrar con Google o al guardar
-- el perfil. Si el perfil se crea sin valor, el trigger copia lo que marcó al registrarse; un valor
-- explícito (el switch de Editar perfil) se respeta siempre.
alter table perfiles add column if not exists newsletter boolean;
-- Cuándo se activó o se apagó por última vez: con esto se arma la lista de bajas
alter table perfiles add column if not exists newsletter_actualizado timestamptz;

-- Cuentas borradas que recibían la newsletter, para darlas de baja en el plugin.
-- Sin políticas: solo la lee el service role (el panel admin).
create table if not exists newsletter_bajas (
  email text primary key,
  fecha timestamptz not null default now()
);
alter table newsletter_bajas enable row level security;

-- Perfiles creados antes de correr esto por quienes marcaron la casilla al registrarse
update perfiles p
set newsletter = true, newsletter_actualizado = now()
from auth.users u
where u.id = p.id
  and p.newsletter is null
  and (u.raw_user_meta_data->>'newsletter') = 'true';

-- Nunca frena un ingreso ni un borrado de cuenta: si algo falla, sigue sin tocar la newsletter
create or replace function perfiles_newsletter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.newsletter is null then
      begin
        new.newsletter := exists (
          select 1 from auth.users u
          where u.id = new.id and (u.raw_user_meta_data->>'newsletter') = 'true'
        );
      exception when others then
        new.newsletter := null;
      end;
    end if;
    if new.newsletter then
      new.newsletter_actualizado := now();
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if coalesce(new.newsletter, false) <> coalesce(old.newsletter, false) then
      new.newsletter_actualizado := now();
    end if;
    return new;
  end if;

  -- DELETE: eliminar-cuenta borra el perfil antes que la cuenta, así que el email todavía está
  if coalesce(old.newsletter, false) or old.newsletter_actualizado is not null then
    begin
      insert into public.newsletter_bajas (email)
      select u.email from auth.users u where u.id = old.id and u.email is not null
      on conflict (email) do update set fecha = now();
    exception when others then
      null;
    end;
  end if;
  return old;
end;
$$;

drop trigger if exists perfiles_newsletter on perfiles;
create trigger perfiles_newsletter
  before insert or update of newsletter or delete on perfiles
  for each row execute function perfiles_newsletter();

-- Lista para el panel admin. suscripto = true: tiene que estar en el plugin. false: se dio de baja
-- desde la app o la web (cuenta_borrada = false) o borró la cuenta (true). Solo emails confirmados.
-- Sin perfil o sin elección en el perfil, vale lo que marcó al registrarse.
create or replace function newsletter_lista()
returns table (email text, nombre text, suscripto boolean, fecha timestamptz, cuenta_borrada boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text,
         coalesce(nullif(trim(p.nombre), ''), u.raw_user_meta_data->>'nombre',
                  u.raw_user_meta_data->>'nombre_completo', u.raw_user_meta_data->>'full_name', ''),
         coalesce(p.newsletter, (u.raw_user_meta_data->>'newsletter') = 'true', false),
         coalesce(p.newsletter_actualizado, u.created_at),
         false
  from auth.users u
  left join public.perfiles p on p.id = u.id
  where u.email is not null
    and u.email_confirmed_at is not null
    and (coalesce(p.newsletter, (u.raw_user_meta_data->>'newsletter') = 'true', false)
         or p.newsletter_actualizado is not null)
  union all
  select b.email, '', false, b.fecha, true
  from public.newsletter_bajas b
  where not exists (select 1 from auth.users u where lower(u.email) = lower(b.email))
  order by 4 desc;
$$;

revoke execute on function newsletter_lista() from public, anon, authenticated;
grant execute on function newsletter_lista() to service_role;

-- Control (no cambia nada): cuántos hay en cada lista
select suscripto, cuenta_borrada, count(*) from newsletter_lista() group by 1, 2 order by 1 desc, 2;
