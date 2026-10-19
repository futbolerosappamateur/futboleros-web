'use server'

import { randomInt } from 'node:crypto'
import { clienteAdmin } from '@/lib/supabase/admin'
import type { Resultado } from './usuarios'

export type Ganador = { id: string; nombre: string | null; apodo: string | null; domicilio: string | null; participantes: number }

// Al azar entre los jugadores con Plan 10. Sin las cuentas de administración: el panel de la app sacaba solo
// al que sorteaba y la otra podía ganar. Todavía no se guarda nada: primero se aprueba
export async function sortearGanador(): Promise<{ ok: true; ganador: Ganador } | { ok: false; error: string }> {
  const supabase = await clienteAdmin()
  // De a páginas: Supabase corta en 1000 filas sin avisar, y con más Plan 10 los que quedaban afuera nunca ganaban
  type Fila = Omit<Ganador, 'participantes'> & { is_admin: boolean | null; acceso_panel: boolean | null }
  const filas: Fila[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, nombre, apodo, domicilio, is_admin, acceso_panel')
      .eq('es_pro', true)
      .not('nombre', 'is', null)
      .order('id')
      .range(desde, desde + 999)
    if (error) return { ok: false, error: error.message }
    filas.push(...((data ?? []) as Fila[]))
    if (!data || data.length < 1000) break
  }
  const participantes = filas.filter(p => !p.is_admin && !p.acceso_panel)
  if (!participantes.length) return { ok: false, error: 'No hay jugadores con Plan 10 para sortear.' }
  const { id, nombre, apodo, domicilio } = participantes[randomInt(participantes.length)]
  return { ok: true, ganador: { id, nombre, apodo, domicilio, participantes: participantes.length } }
}

// Guarda el sorteo y le avisa al ganador como crearNotificacion de la app: la fila en notificaciones y el push
// de Expo al celular (antes quedaba solo en la lista de avisos). Si no tiene domicilio, el aviso se lo pide y
// lleva falta_domicilio: la app lo abre en Editar perfil, en ese campo. alCelular: si el push salió
export async function aprobarSorteo(ganadorId: string, premio: string, mes: string): Promise<Resultado & { alCelular?: boolean; faltaDomicilio?: boolean }> {
  const supabase = await clienteAdmin()
  if (!premio.trim() || !mes.trim()) return { ok: false, error: 'Completá el premio y el mes.' }
  const { data: sorteo, error } = await supabase
    .from('sorteos')
    .insert({
      nombre_premio: premio.trim(),
      descripcion_mes: mes.trim(),
      ganador_id: ganadorId,
      estado: 'aprobado',
      aprobado_en: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }

  // El domicilio nunca va en el aviso: se ve en la pantalla bloqueada del celular
  const { data: perfil } = await supabase.from('perfiles').select('domicilio').eq('id', ganadorId).maybeSingle()
  const faltaDomicilio = !perfil?.domicilio?.trim()
  const titulo = `🏆 Ganaste el sorteo de ${mes.trim()}`
  const mensaje = faltaDomicilio
    ? `Tu premio es ${premio.trim()}. Para mandártelo, cargá tu domicilio en Editar perfil. ¡Felicitaciones!`
    : `Tu premio es ${premio.trim()} y te llegará a tu domicilio. ¡Felicitaciones!`
  const datos = faltaDomicilio ? { sorteo_id: sorteo.id, falta_domicilio: true } : { sorteo_id: sorteo.id }
  const { error: errorAviso } = await supabase.from('notificaciones').insert({ usuario_id: ganadorId, tipo: 'sorteo', titulo, mensaje, datos })
  if (errorAviso) return { ok: false, error: `El sorteo quedó guardado, pero no se pudo avisar al ganador: ${errorAviso.message}` }

  // El token de Expo está en push_tokens desde el 19/10: en perfiles lo podían leer los compañeros de grupo
  // (supabase/push_servidor.sql de la app). Si esa tabla todavía no está, se lee de perfiles como antes
  const { data: fila, error: errorToken } = await supabase.from('push_tokens').select('token').eq('usuario_id', ganadorId).maybeSingle()
  let token: string | null = fila?.token ?? null
  if (errorToken) {
    const { data: viejo } = await supabase.from('perfiles').select('expo_push_token').eq('id', ganadorId).maybeSingle()
    token = viejo?.expo_push_token ?? null
  }
  if (!token) return { ok: true, alCelular: false, faltaDomicilio }
  // Con la seguridad de push activada, Expo pide la clave de acceso (EXPO_ACCESS_TOKEN)
  const claveExpo = process.env.EXPO_ACCESS_TOKEN
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(claveExpo ? { Authorization: `Bearer ${claveExpo}` } : {}) },
      body: JSON.stringify({
        to: token,
        title: titulo,
        body: mensaje,
        data: { tipo: 'sorteo', ...datos },
        sound: 'default',
        channelId: 'default',
        color: '#0c4344',
      }),
    })
    // Expo contesta 200 aunque el celular ya no exista: el estado de cada aviso viene en data.status
    const respuesta = await res.json().catch(() => null)
    return { ok: true, alCelular: res.ok && respuesta?.data?.status === 'ok', faltaDomicilio }
  } catch {
    return { ok: true, alCelular: false, faltaDomicilio }
  }
}
