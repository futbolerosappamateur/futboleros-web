import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BackLink from '../../components/BackLink'
import { createServiceClient } from '@/lib/supabase/service'
import styles from './novedad.module.css'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('novedades')
    .select('titulo, resumen')
    .eq('slug', slug)
    .eq('publicado', true)
    .maybeSingle()
  if (!data) return {}
  return { title: data.titulo, description: data.resumen }
}

function renderContenido(texto: string) {
  return texto.split(/\n\n+/).map((parrafo, i) => {
    const lines = parrafo.split('\n').map((line, j) => (
      j < parrafo.split('\n').length - 1
        ? <span key={j}>{line}<br /></span>
        : <span key={j}>{line}</span>
    ))
    return <p key={i} className={styles.parrafo}>{lines}</p>
  })
}

export default async function NovedadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data: novedad } = await supabase
    .from('novedades')
    // '*': trae la categoría si la columna ya existe, sin fallar si todavía no
    .select('*')
    .eq('slug', slug)
    .eq('publicado', true)
    .maybeSingle()

  if (!novedad) notFound()

  const fecha = new Date(novedad.creado_en).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires'
  })

  return (
    <>
      <Header />
      <main className={styles.page}>

        {/* Cover */}
        {novedad.imagen_url && (
          <div className={styles.cover}>
            <Image
              src={novedad.imagen_url}
              alt={novedad.titulo}
              fill
              className={styles.coverImg}
              priority
              unoptimized
            />
            <div className={styles.coverOverlay} />
          </div>
        )}

        <div className={styles.body}>
          <div className={styles.inner}>
            <BackLink href="/novedades" className={styles.back}>Novedades</BackLink>

            <article className={styles.article}>
              <p className={styles.meta}>
                {novedad.categoria && <span className={styles.categoria}>{novedad.categoria}</span>}
                <time className={styles.fecha}>{fecha}</time>
              </p>
              <h1 className={styles.titulo}>{novedad.titulo}</h1>
              {novedad.resumen && <p className={styles.resumen}>{novedad.resumen}</p>}

              {novedad.contenido && (
                <div className={styles.contenido}>
                  {renderContenido(novedad.contenido)}
                </div>
              )}
            </article>

            <div className={styles.footer}>
              <BackLink href="/novedades" className={styles.back}>Ver todas las novedades</BackLink>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
