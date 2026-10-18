'use server'

import { clienteAdmin } from '@/lib/supabase/admin'
import type { Resultado } from './usuarios'

export type GrupoAdmin = {
  id: number
  nombre: string | null
  descripcion: string | null
  activo: boolean | null
  creado_en: string | null
  miembros: number
}

const limpiar = (texto: string) => texto.replace(/[,()%*\\]/g, ' ').trim()

// Sin texto, los últimos creados. Están todos, también los inactivos (los eliminados)
export async function buscarGrupos(texto: string): Promise<GrupoAdmin[]> {
  const supabase = await clienteAdmin()
  const q = limpiar(texto)
  let consulta = supabase.from('grupos').select('id, nombre, descripcion, activo, creado_en')
  if (q.length >= 2) consulta = consulta.ilike('nombre', `%${q}%`)
  const { data } = await consulta.order('creado_en', { ascending: false, nullsFirst: false }).limit(20)
  const grupos = (data ?? []) as Omit<GrupoAdmin, 'miembros'>[]
  if (!grupos.length) return []

  // Miembros: los activos que aceptaron, los mismos que reciben el Plan 10 del grupo
  const { data: filas } = await supabase
    .from('grupo_jugadores')
    .select('grupo_id')
    .in('grupo_id', grupos.map(g => g.id))
    .eq('activo', true)
    .eq('estado', 'aceptado')
  const cuenta = new Map<number, number>()
  for (const f of (filas ?? []) as { grupo_id: number }[]) cuenta.set(f.grupo_id, (cuenta.get(f.grupo_id) ?? 0) + 1)
  return grupos.map(g => ({ ...g, miembros: cuenta.get(g.id) ?? 0 }))
}

// Plan 10 a todos los miembros, como en el panel de la app (sin vencimiento)
export async function darPlan10AlGrupo(id: number): Promise<Resultado & { cantidad?: number }> {
  const supabase = await clienteAdmin()
  const { data: miembros } = await supabase
    .from('grupo_jugadores')
    .select('usuario_id')
    .eq('grupo_id', id)
    .eq('activo', true)
    .eq('estado', 'aceptado')
  const ids = [...new Set(((miembros ?? []) as { usuario_id: string }[]).map(m => m.usuario_id))]
  if (!ids.length) return { ok: false, error: 'El grupo no tiene miembros activos.' }
  const { error } = await supabase.from('perfiles').update({ es_pro: true }).in('id', ids)
  return error ? { ok: false, error: error.message } : { ok: true, cantidad: ids.length }
}

// Como en la app: queda inactivo (no se borra), así no se pierden sus partidos ni las estadísticas
export async function eliminarGrupo(id: number): Promise<Resultado> {
  const supabase = await clienteAdmin()
  const { error } = await supabase.from('grupos').update({ activo: false }).eq('id', id)
  return error ? { ok: false, error: error.message } : { ok: true }
}
