import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import { createServiceClient } from '@/lib/supabase/service'
import styles from './novedades.module.css'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Novedades — Futboleros',
  description: 'Actualizaciones, mejoras y noticias de Futboleros.',
}

export default async function Novedades() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('novedades')
    .select('id, titulo, slug, resumen, imagen_url, creado_en')
    .eq('publicado', true)
    .order('creado_en', { ascending: false })

  const lista = data ?? []

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
            {lista.length === 0 && (
              <p className={styles.empty}>Todavía no hay novedades publicadas.</p>
            )}

            <div className={styles.grid}>
              {lista.map((n: any) => {
                const fecha = new Date(n.creado_en).toLocaleDateString('es-AR', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })
                return (
                  <Link key={n.id} href={`/novedades/${n.slug}`} className={styles.card}>
                    <div className={styles.cardImg}>
                      {n.imagen_url ? (
                        <Image
                          src={n.imagen_url}
                          alt={n.titulo}
                          fill
                          className={styles.img}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.imgPlaceholder}>
                          <span className={styles.imgPlaceholderIcon}>📰</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <time className={styles.fecha}>{fecha}</time>
                      <h2 className={styles.cardTitle}>{n.titulo}</h2>
                      {n.resumen && <p className={styles.resumen}>{n.resumen}</p>}
                      <span className={styles.leerMas}>Leer más →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
