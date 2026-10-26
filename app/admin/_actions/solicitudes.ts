'use server'

import { revalidatePath } from 'next/cache'
import { clienteAdmin } from '@/lib/supabase/admin'
import { mp } from '@/lib/plan10-servidor'
import type { Resultado } from './usuarios'

// Cerrar un pedido de arrepentimiento o de baja, con lo que se hizo (queda como constancia)
export async function cerrarSolicitud(id: string, estado: 'resuelta' | 'rechazada', nota: string): Promise<Resultado> {
  if (estado !== 'resuelta' && estado !== 'rechazada') return { ok: false, error: 'Estado no válido' }
  const supabase = await clienteAdmin()
  const { error } = await supabase
    .from('solicitudes_consumidor')
    .update({ estado, nota: nota.trim().slice(0, 2000) || null, resuelto_en: new Date().toISOString() })
    .eq('id', id)
    .eq('estado', 'pendiente')
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/solicitudes')
  return { ok: true }
}

// Lo mismo que el botón de baja con la sesión del usuario (api/mp/cancelar)
export async function darDeBajaDebitoDe(usuarioId: string): Promise<Resultado> {
  const supabase = await clienteAdmin()
  const { data: suscripcion } = await supabase
    .from('suscripciones_plan10').select('mp_preapproval_id, estado').eq('usuario_id', usuarioId).maybeSingle()
  if (!suscripcion || suscripcion.estado === 'cancelled') return { ok: false, error: 'No tiene un débito automático activo.' }
  try {
    await mp(`/preapproval/${suscripcion.mp_preapproval_id}`, { method: 'PUT', body: { status: 'cancelled' } })
  } catch (e) {
    console.error('[admin baja débito]', e)
    return { ok: false, error: 'Mercado Pago no respondió. Probá de nuevo o dalo de baja desde Mercado Pago.' }
  }
  await supabase
    .from('suscripciones_plan10')
    .update({ estado: 'cancelled', actualizado: new Date().toISOString() })
    .eq('usuario_id', usuarioId)
  revalidatePath('/admin/solicitudes')
  return { ok: true }
}

// Arrepentimiento: el Plan 10 queda sin efecto, con lo que quedaba pago. Sin borrar plan_vence, un pago nuevo
// se sumaría al período devuelto
export async function revocarPlan10(usuarioId: string): Promise<Resultado> {
  const supabase = await clienteAdmin()
  const { error } = await supabase.from('perfiles').update({ es_pro: false, plan: 0, plan_vence: null }).eq('id', usuarioId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/solicitudes')
  return { ok: true }
}
