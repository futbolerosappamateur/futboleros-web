import type { SupabaseClient } from '@supabase/supabase-js'

// El chat avisa con este evento cuando marca mensajes como leídos, así el contador del encabezado
// baja al momento y no recién en la próxima consulta
export const EVENTO_CHAT_LEIDO = 'futboleros:chat-leido'

// Mensajes sin leer que le mandaron al usuario en todas sus conversaciones (la misma cuenta que la app)
export async function contarNoLeidos(supabase: SupabaseClient, userId: string) {
  const { data: convs } = await supabase
    .from('conversaciones')
    .select('id')
    .or(`usuario1_id.eq.${userId},usuario2_id.eq.${userId}`)
  if (!convs?.length) return 0
  const { count } = await supabase
    .from('mensajes')
    .select('*', { count: 'exact', head: true })
    .in('conversacion_id', convs.map(c => c.id))
    .eq('leido', false)
    .neq('sender_id', userId)
  return count ?? 0
}
