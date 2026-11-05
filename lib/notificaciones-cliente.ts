import { createClient } from '@/lib/supabase/client'
import { EVENTO_NOTIF_LEIDAS, TIPOS_WEB, type Aviso } from '@/lib/notificaciones'

// Marcar avisos como leídos desde el navegador (campanita y página), con la sesión del usuario como la app.
// Solo se usa en componentes del navegador.

// Lo que se marcó leído en esta visita al sitio. Sirve para que la campanita y la página coincidan y para
// que, al volver con "atrás" (Next muestra la página que tenía guardada), no aparezcan otra vez como nuevos
const leidas = new Set<number>()
let todasHasta = 0   // "Marcar todas": lo que llegó hasta ese momento quedó leído

export const yaLeida = (a: Pick<Aviso, 'id' | 'leida' | 'creado_en'>) =>
  a.leida || leidas.has(a.id) || new Date(a.creado_en).getTime() <= todasHasta

const avisar = () => window.dispatchEvent(new Event(EVENTO_NOTIF_LEIDAS))

export function marcarLeida(userId: string, id: number) {
  leidas.add(id)
  avisar()   // al momento, para que se apague en pantalla
  createClient().from('notificaciones').update({ leida: true }).eq('id', id).eq('usuario_id', userId)
    .then(avisar)   // y de nuevo cuando quedó guardado, para que el número del encabezado se actualice
}

// Todas las de la web, también las que no se ven en la lista; las de partidos quedan para la app.
// `ids`: los que están en pantalla (por si el reloj de la compu está atrasado)
export function marcarTodas(userId: string, ids: number[]) {
  ids.forEach(id => leidas.add(id))
  todasHasta = Date.now()
  avisar()
  createClient().from('notificaciones').update({ leida: true })
    .eq('usuario_id', userId).eq('leida', false).in('tipo', TIPOS_WEB)
    .then(avisar)
}
