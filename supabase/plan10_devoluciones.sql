-- Devoluciones y contracargos del Plan 10: un pago devuelto (desde Mercado Pago o con el botón de
-- /admin/solicitudes) o desconocido con la tarjeta le saca al plan el período que había sumado.
-- Correr una vez en el SQL Editor de Supabase, ANTES de subir la web que lo usa (el panel de solicitudes
-- lee la columna nueva).

-- 1. Cuándo se descontó cada pago: así el mismo aviso nunca descuenta dos veces
alter table pagos_plan10 add column if not exists revertido_en timestamptz;

-- 2. Descontar un pago: le resta su mes (o su año) al vencimiento. Si ya no le queda nada pago, la cuenta
--    vuelve al plan gratuito en el momento, sin los 3 días de margen del vencimiento. El Plan 10 dado a mano
--    (sin plan_vence) no se toca. Devuelve false si el pago no estaba acreditado o ya se había descontado.
create or replace function revertir_pago_plan10(p_payment_id text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_usuario uuid;
  v_tipo text;
begin
  update pagos_plan10 set revertido_en = now()
   where mp_payment_id = p_payment_id and revertido_en is null
  returning usuario_id, tipo into v_usuario, v_tipo;
  if not found then
    return false;
  end if;

  update perfiles
     set plan_vence = plan_vence - case when v_tipo = 'anual' then interval '12 months' else interval '1 month' end
   where id = v_usuario and plan_vence is not null;

  update perfiles
     set es_pro = false, plan = 0, plan_vence = null
   where id = v_usuario and plan_vence is not null and plan_vence <= now();
  return true;
end;
$$;
revoke execute on function revertir_pago_plan10(text) from public, anon, authenticated;
grant execute on function revertir_pago_plan10(text) to service_role;

-- Control (no cambia nada): pagos acreditados y cuántos se descontaron
select count(*) as pagos, count(revertido_en) as descontados from pagos_plan10;
