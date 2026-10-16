import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/service'
import { getRutasGrupos } from '@/lib/grupos'
import { SITE_URL } from '@/lib/sitio'

// /sitemap.xml: las páginas fijas, los perfiles públicos, los grupos activos y las novedades publicadas.
// Se vuelve a armar cada hora, así entran los perfiles que se hacen públicos y los grupos nuevos
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()
  const [{ data: perfiles }, { data: novedades }, { porId }] = await Promise.all([
    // Los privados no: quien entra sin cuenta (y Google) no los puede ver
    supabase.from('perfiles').select('id, username').eq('perfil_publico', true).not('nombre', 'is', null).neq('nombre', ''),
    supabase.from('novedades').select('slug, creado_en').eq('publicado', true),
    getRutasGrupos(),
  ])

  const fijas = ['', '/jugadores', '/grupos', '/novedades', '/plan10', '/contacto', '/terminos', '/privacidad']
  return [
    ...fijas.map(ruta => ({ url: `${SITE_URL}${ruta}` })),
    ...((perfiles ?? []) as { id: string; username: string | null }[])
      .map(p => ({ url: `${SITE_URL}/jugadores/${encodeURIComponent(p.username ?? p.id)}` })),
    ...[...porId.values()].map(g => ({ url: `${SITE_URL}/grupos/${g.ruta}` })),
    ...((novedades ?? []) as { slug: string | null; creado_en: string }[])
      .filter(n => n.slug)
      .map(n => ({ url: `${SITE_URL}/novedades/${n.slug}`, lastModified: n.creado_en })),
  ]
}
