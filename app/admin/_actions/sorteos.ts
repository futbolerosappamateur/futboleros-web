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

// Guarda el sorteo y le avisa al ganador con la misma notificación que manda la app
export async function aprobarSorteo(ganadorId: string, premio: string, mes: string): Promise<Resultado> {
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
  const { error: errorAviso } = await supabase.from('notificaciones').insert({
    usuario_id: ganadorId,
    tipo: 'sorteo',
    titulo: `🏆 Ganaste el sorteo de ${mes.trim()}`,
    mensaje: `Tu premio es ${premio.trim()} y te llegará a tu domicilio. ¡Felicitaciones!`,
    datos: { sorteo_id: sorteo.id },
  })
  return errorAviso ? { ok: false, error: `El sorteo quedó guardado, pero no se pudo avisar al ganador: ${errorAviso.message}` } : { ok: true }
}
