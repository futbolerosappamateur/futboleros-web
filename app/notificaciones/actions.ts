'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ResultadoTestimonio = { ok: true } | { error: string }

// Aprobar o rechazar un testimonio que le dejaron, como en Testimonios.js de la app. Va con la sesión del
// usuario: solo toca los suyos y solo si siguen pendientes (si ya lo respondió en la app, no cambia nada)
export async function responderTestimonio(id: number, aprobar: boolean): Promise<ResultadoTestimonio> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Volvé a ingresar.' }
  if (!Number.isInteger(id) || id <= 0) return { error: 'No se encontró el testimonio.' }

  const { data, error } = await supabase
    .from('testimonios')
    .update({ estado: aprobar ? 'aprobado' : 'rechazado' })
    .eq('id', id)
    .eq('destinatario_id', user.id)
    .eq('estado', 'pendiente')
    .select('id')
  if (error) return { error: 'No se pudo guardar. Probá de nuevo.' }
  if (!data?.length) {
    revalidatePath('/notificaciones')   // ya lo había respondido (en la app o en otra pestaña): sale de la lista
    return { error: 'Este testimonio ya estaba respondido.' }
  }

  // El aviso no dice de qué testimonio es: cuando no queda ninguno por responder, los avisos quedan leídos
  const { count } = await supabase
    .from('testimonios')
    .select('id', { count: 'exact', head: true })
    .eq('destinatario_id', user.id)
    .eq('estado', 'pendiente')
  if (!count) {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', user.id)
      .eq('tipo', 'testimonio')
      .eq('leida', false)
  }

  // La lista de pendientes y, si lo aprobó, su perfil (los testimonios aprobados se ven ahí)
  revalidatePath('/notificaciones')
  revalidatePath('/jugadores/[slug]', 'page')
  return { ok: true }
}
