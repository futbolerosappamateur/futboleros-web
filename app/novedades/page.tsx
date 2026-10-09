import type { Metadata } from 'next'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import { createServiceClient } from '@/lib/supabase/service'
import NovedadesClient, { type NovedadItem } from './NovedadesClient'
import styles from './novedades.module.css'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Novedades',
  description: 'Actualizaciones, mejoras y noticias de Futboleros.',
}

const TZ = 'America/Argentina/Buenos_Aires'

export default async function Novedades() {
  const supabase = createServiceClient()
  const [{ data }, { data: categoriasData }] = await Promise.all([
    supabase
      .from('novedades')
      .select('id, titulo, slug, resumen, imagen_url, creado_en')
      .eq('publicado', true)
      .order('creado_en', { ascending: false }),
    // Aparte: si la columna categoria todavía no existe, la página se ve igual (sin filtro de categoría)
    supabase.from('novedades').select('id, categoria').eq('publicado', true),
  ])
  const categoriaDe = new Map(((categoriasData ?? []) as any[]).map(c => [c.id, c.categoria as string | null]))

  // Fechas armadas acá, en hora argentina: en el navegador podrían dar otro día y no coincidir con el servidor
  const lista: NovedadItem[] = (data ?? []).map((n: any) => {
    const d = new Date(n.creado_en)
    const mesLabel = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: TZ })
    return {
      id: n.id,
      titulo: n.titulo,
      slug: n.slug,
      resumen: n.resumen,
      imagen_url: n.imagen_url,
      categoria: categoriaDe.get(n.id) ?? null,
      fecha: d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }),
      mes: d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', timeZone: TZ }),   // "2026-09"
      mesLabel: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1),
    }
  })

  return (
    <>
      <Header />
      <main className={styles.page}>
        <ParallaxHero src="/fondos/novedades.webp" className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.badge}>BLOG</span>
            <h1 className={styles.title}>NOVEDADES</h1>
            <p className={styles.subtitle}>Actualizaciones, mejoras y noticias de Futboleros.</p>
          </div>
        </ParallaxHero>

        <div className={styles.body}>
          <div className={styles.inner}>
            {lista.length === 0 ? (
              <p className={styles.empty}>Todavía no hay novedades publicadas.</p>
            ) : (
              <NovedadesClient novedades={lista} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
