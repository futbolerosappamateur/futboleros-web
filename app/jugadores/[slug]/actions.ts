'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ResultadoSeguir = { siguiendo: boolean } | { error: string }

// Seguir o dejar de seguir a un jugador desde su página, con las mismas funciones de la base que la app
// (VerPerfil y Contactos). Al empezar a seguirlo le llega el mismo aviso que manda la app; va con la sesión
// del usuario para que la base le mande también el push (con service role no sale)
export async function cambiarSeguir(perfilId: string, seguir: boolean): Promise<ResultadoSeguir> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Volvé a ingresar.' }
  if (!UUID_RE.test(perfilId) || perfilId === user.id) return { error: 'No se pudo seguir a este jugador.' }

  // Con service: las políticas de perfiles solo dejan ver a los del mismo grupo
  const { data: otro } = await createServiceClient().from('perfiles').select('id').eq('id', perfilId).maybeSingle()
  if (!otro) return { error: 'Este jugador ya no está en Futboleros.' }

  // Si ya estaba así (doble clic, otra pestaña) no se toca nada ni se avisa dos veces
  const { data: yo } = await supabase.from('perfiles').select('nombre, siguiendo').eq('id', user.id).maybeSingle()
  const loSigo = ((yo?.siguiendo ?? []) as string[]).includes(perfilId)

  if (seguir && !loSigo) {
    const { error } = await supabase.rpc('seguir_usuario', { p_follower_id: user.id, p_followed_id: perfilId })
    if (error) return { error: 'No se pudo seguir a este jugador. Probá de nuevo.' }
    await supabase.from('notificaciones').insert({
      usuario_id: perfilId,
      tipo: 'seguidor',
      titulo: 'Nuevo seguidor',
      mensaje: `${yo?.nombre || 'Alguien'} empezó a seguirte`,
      datos: { seguidor_id: user.id },
    })
  } else if (!seguir && loSigo) {
    const { error } = await supabase.rpc('dejar_de_seguir', { p_follower_id: user.id, p_followed_id: perfilId })
    if (error) return { error: 'No se pudo dejar de seguir. Probá de nuevo.' }
  }

  // Vuelve a armar la página con el botón y el contador de seguidores al día
  revalidatePath('/jugadores/[slug]', 'page')
  return { siguiendo: seguir }
}
