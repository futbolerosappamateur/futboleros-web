'use server'

import { createClient } from '@/lib/supabase/server'
import { TERMINOS_VERSION } from '@/lib/terminos'

// Guarda la versión aceptada con la sesión del usuario; la fecha la pone la base (trigger perfiles_terminos)
export async function aceptarTerminos(): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión venció. Volvé a ingresar.' }

  const { data, error } = await supabase
    .from('perfiles').update({ terminos_version: TERMINOS_VERSION }).eq('id', user.id).select('id')
  if (error) return { error: 'No se pudo guardar. Probá de nuevo.' }
  if (data.length) return { ok: true }

  // Sin perfil todavía (una cuenta de email que nunca lo completó): se crea como al entrar con Google
  const { error: errorAlta } = await supabase.from('perfiles').insert({
    id: user.id,
    nombre: user.user_metadata?.nombre_completo || user.user_metadata?.nombre || user.user_metadata?.full_name || '',
    siguiendo: [],
    disponible_invitaciones: true,
    terminos_version: TERMINOS_VERSION,
  })
  return errorAlta ? { error: 'No se pudo guardar. Probá de nuevo.' } : { ok: true }
}
