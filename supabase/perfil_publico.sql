-- Perfil público: cada jugador elige si su perfil se ve en la web sin tener cuenta.
-- Privado por defecto, como dicen los términos (4.1) y la política de privacidad (10).
-- Lo cambia el propio jugador desde Editar perfil, en la web y en la app.
alter table perfiles add column if not exists perfil_publico boolean not null default false;

-- Control (no cambia nada): quién puede leer perfiles por la API de Supabase.
-- Si alguna política de SELECT incluye a anon o a public, cualquiera con la clave pública
-- puede bajar los perfiles sin pasar por la web.
select policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'perfiles'
order by cmd, policyname;
