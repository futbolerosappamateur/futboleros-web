import { cache } from 'react'
import { createServiceClient } from '@/lib/supabase/service'

// "Los Viejos Chotos" → "los-viejos-chotos" (sin tildes, símbolos ni emojis)
export function slugGrupo(nombre: string | null | undefined) {
  const slug = (nombre ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'grupo'
}

// Dirección de cada grupo activo, sacada del nombre. El nombre no es único: si dos grupos se llaman
// igual, el más antiguo se queda con la dirección limpia y los demás llevan su número (los-pibes-12).
export const getRutasGrupos = cache(async () => {
  const supabase = createServiceClient()
  const { data } = await supabase.from('grupos').select('id, nombre').eq('activo', true).order('id', { ascending: true })
  const masAntiguo = new Map<string, number>()                        // slug → id del grupo más antiguo con ese slug
  const porId = new Map<number, { slug: string; ruta: string }>()     // id → slug y dirección
  for (const g of (data ?? []) as { id: number; nombre: string | null }[]) {
    const slug = slugGrupo(g.nombre)
    const primero = !masAntiguo.has(slug)
    if (primero) masAntiguo.set(slug, g.id)
    porId.set(g.id, { slug, ruta: primero ? slug : `${slug}-${g.id}` })
  }
  return { masAntiguo, porId }
})

// Qué grupo es una dirección: la limpia (los-viejos-chotos), la que lleva el número (los-pibes-12)
// o el número solo, como eran los links antes (/grupos/1)
export async function resolverGrupo(param: string): Promise<{ id: number; ruta: string } | null> {
  const { masAntiguo, porId } = await getRutasGrupos()
  const p = param.toLowerCase()
  let id: number | undefined
  if (/^\d+$/.test(p)) id = Number(p)
  else if (masAntiguo.has(p)) id = masAntiguo.get(p)
  else {
    const m = p.match(/^(.+)-(\d+)$/)
    if (m && porId.get(Number(m[2]))?.slug === m[1]) id = Number(m[2])
  }
  const grupo = id != null ? porId.get(id) : undefined
  return id != null && grupo ? { id, ruta: grupo.ruta } : null
}
