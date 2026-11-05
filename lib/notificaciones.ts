import type { SupabaseClient } from '@supabase/supabase-js'

// Avisos de la campanita de la web: los que tienen algo para ver o hacer acá. Quedan afuera los de partidos
// y convocatorias (en la web no hay pantallas de partidos), los de chat (ya los cuenta el globito) y las
// invitaciones y solicitudes para entrar a un grupo, que se responden desde la app
export const TIPOS_WEB = [
  'seguidor',             // X empezó a seguirte
  'testimonio',           // te dejaron un testimonio para aprobar
  'sorteo',               // ganaste el sorteo del mes
  'admin_mensaje',        // mensaje de Futboleros
  'solicitud_aceptada',   // te aceptaron en un grupo, o aceptaron tu invitación
  'solicitud_rechazada',  // lo mismo, rechazado
  'salida_grupo',         // alguien salió de tu grupo
]

// La campanita y la página avisan con este evento cuando marcan avisos como leídos, así el número del
// encabezado baja al momento y la otra se actualiza
export const EVENTO_NOTIF_LEIDAS = 'futboleros:notificaciones-leidas'

// Un aviso ya listo para mostrar (lo arma lib/notificaciones-servidor.ts)
export type Aviso = {
  id: number
  tipo: string
  titulo: string
  mensaje: string
  leida: boolean
  creado_en: string
  cuando: string    // "hace 5 min", armado en el servidor
  icono: string
  foto?: string     // la del que te sigue
  href?: string     // a dónde lleva; sin link, tocarlo solo lo marca leído
}

// Un testimonio que le dejaron y espera que lo apruebe o lo rechace
export type Pendiente = {
  id: number
  texto: string
  fecha: string
  autor: string
  foto?: string
  href?: string
}

// Avisos de la web sin leer (la misma tabla que la campanita de la app, solo los tipos de arriba)
export async function contarNotificaciones(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', userId)
    .eq('leida', false)
    .in('tipo', TIPOS_WEB)
  return count ?? 0
}
