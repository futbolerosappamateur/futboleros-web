'use server'

import { randomInt } from 'node:crypto'
import { clienteAdmin } from '@/lib/supabase/admin'
import type { Resultado } from './usuarios'

export type Ganador = { id: string; nombre: string | null; apodo: string | null; domicilio: string | null; participantes: number }

// Al azar entre los jugadores con Plan 10. Sin las cuentas de administración: el panel de la app sacaba solo
// al que sorteaba y la otra podía ganar. Todavía no se guarda nada: primero se aprueba
export async function sortearGanador(): Promise<{ ok: true; ganador: Ganador } | { ok: false; error: string }> {
  const supabase = await clienteAdmin()
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, apodo, domicilio, is_admin, acceso_panel')
    .eq('es_pro', true)
    .not('nombre', 'is', null)
  if (error) return { ok: false, error: error.message }
  const participantes = ((data ?? []) as (Omit<Ganador, 'participantes'> & { is_admin: boolean | null; acceso_panel: boolean | null })[])
    .filter(p => !p.is_admin && !p.acceso_panel)
  if (!participantes.length) return { ok: false, error: 'No hay jugadores con Plan 10 para sortear.' }
  const { id, nombre, apodo, domicilio } = participantes[randomInt(participantes.length)]
  return { ok: true, ganador: { id, nombre, apodo, domicilio, participantes: participantes.length } }
}

// Guarda el sorteo y le avisa al ganador como crearNotificacion de la app: la fila en notificaciones y el push
// de Expo al celular (antes quedaba solo en la lista de avisos). alCelular: si el push salió
export async function aprobarSorteo(ganadorId: string, premio: string, mes: string): Promise<Resultado & { alCelular?: boolean }> {
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

  const titulo = `🏆 Ganaste el sorteo de ${mes.trim()}`
  const mensaje = `Tu premio es ${premio.trim()} y te llegará a tu domicilio. ¡Felicitaciones!`
  const datos = { sorteo_id: sorteo.id }
  const { error: errorAviso } = await supabase.from('notificaciones').insert({ usuario_id: ganadorId, tipo: 'sorteo', titulo, mensaje, datos })
  if (errorAviso) return { ok: false, error: `El sorteo quedó guardado, pero no se pudo avisar al ganador: ${errorAviso.message}` }

  const { data: perfil } = await supabase.from('perfiles').select('expo_push_token').eq('id', ganadorId).maybeSingle()
  if (!perfil?.expo_push_token) return { ok: true, alCelular: false }
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: perfil.expo_push_token,
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
    return { ok: true, alCelular: res.ok && respuesta?.data?.status === 'ok' }
  } catch {
    return { ok: true, alCelular: false }
  }
}
