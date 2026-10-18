import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { SITE_URL, URL_GOOGLE_PLAY } from '@/lib/sitio'
import { CABECERAS, medidaCabecera, type CabeceraMail, type NovedadMail } from '@/lib/newsletter-mail'
import ArmarMail from './ArmarMail'

export const revalidate = 0

// El mail de la newsletter: se arma acá con las secciones de la home y las últimas novedades,
// y se copia para pegarlo en el plugin Newsletter de WordPress
export default async function MailNewsletter() {
  const supabase = createServiceClient()
  const [{ data }, { data: archivos }] = await Promise.all([
    supabase
      .from('novedades')
      .select('titulo, slug, resumen, imagen_url, categoria, creado_en')
      .eq('publicado', true)
      .order('creado_en', { ascending: false })
      .limit(12),
    // Las cabeceras que ya se subieron, la más nueva primero
    supabase.storage
      .from(CABECERAS.bucket)
      .list(CABECERAS.carpeta, { limit: 50, sortBy: { column: 'created_at', order: 'desc' } }),
  ])
  const cabeceras: CabeceraMail[] = (archivos ?? []).flatMap(a => {
    const medida = medidaCabecera(a.name)
    if (!medida) return []
    const { data: publica } = supabase.storage.from(CABECERAS.bucket).getPublicUrl(`${CABECERAS.carpeta}/${a.name}`)
    return [{ url: publica.publicUrl, ...medida }]
  })

  // La fecha en hora argentina, como en /novedades: 17/10/2026
  const novedades: NovedadMail[] = ((data ?? []) as (Omit<NovedadMail, 'fecha'> & { creado_en: string })[]).map(n => ({
    titulo: n.titulo,
    slug: n.slug,
    resumen: n.resumen,
    imagen_url: n.imagen_url,
    categoria: n.categoria,
    fecha: new Date(n.creado_en).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }),
  }))

  return (
    <>
      <Link href="/admin/newsletter" style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
        ← NEWSLETTER
      </Link>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.06em', color: 'var(--text)', margin: '8px 0' }}>
        ARMAR EL MAIL
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
        Elegí qué lleva, mirá cómo queda y copiá el HTML para pegarlo en el plugin.
      </p>
      <ArmarMail novedades={novedades} cabeceras={cabeceras} sitio={SITE_URL} googlePlay={URL_GOOGLE_PLAY} />
    </>
  )
}
