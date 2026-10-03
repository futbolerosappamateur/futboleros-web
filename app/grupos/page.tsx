import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import { createServiceClient } from '@/lib/supabase/service'
import styles from './grupos.module.css'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Grupos — Futboleros',
  description: 'Equipos, ligas y peñas de toda la Argentina.',
}

type Grupo = {
  id: string
  nombre: string
  descripcion: string | null
  foto_url: string | null
  partidos_jugados: number | null
  creado_en: string
  miembros: number
}

export default async function Grupos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const supabase = createServiceClient()

  let sb = supabase
    .from('grupos')
    .select('id, nombre, descripcion, foto_url, partidos_jugados, creado_en, grupo_jugadores(count)')
    .eq('activo', true)
    .eq('grupo_jugadores.activo', true)
    .eq('grupo_jugadores.estado', 'aceptado')
    .order('creado_en', { ascending: false })
    .limit(80)

  if (query) {
    sb = sb.ilike('nombre', `%${query}%`)
  }

  const { data: raw } = await sb

  const lista: Grupo[] = (raw ?? []).map((g: any) => ({
    ...g,
    miembros: g.grupo_jugadores?.[0]?.count ?? 0,
  }))

  return (
    <>
      <Header />
      <main className={styles.page}>
        <ParallaxHero src="/fondos/grupos.webp" className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.badge}>COMUNIDAD</span>
            <h1 className={styles.title}>GRUPOS</h1>
            <p className={styles.subtitle}>Equipos, ligas y peñas de toda la Argentina. Unite o creá el tuyo desde la app.</p>

            <form method="GET" className={styles.searchForm}>
              <div className={styles.searchWrap}>
                <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  name="q"
                  type="search"
                  defaultValue={query}
                  placeholder="Buscá un grupo por nombre..."
                  className={styles.searchInput}
                  autoComplete="off"
                />
              </div>
              <button type="submit" className={styles.searchBtn}>Buscar</button>
            </form>
          </div>
        </ParallaxHero>

        <div className={styles.body}>
          <div className={styles.inner}>
            {query && (
              <p className={styles.resultCount}>
                {lista.length > 0
                  ? `${lista.length} resultado${lista.length !== 1 ? 's' : ''} para "${query}"`
                  : `Sin resultados para "${query}"`}
                {' · '}
                <Link href="/grupos" className={styles.clearLink}>Ver todos</Link>
              </p>
            )}

            {lista.length === 0 && !query && (
              <p className={styles.empty}>Aún no hay grupos registrados.</p>
            )}

            <div className={styles.grid}>
              {lista.map(g => (
                <div key={g.id} className={styles.card}>
                  <div className={styles.fotoWrap}>
                    {g.foto_url ? (
                      <Image
                        src={g.foto_url}
                        alt={g.nombre}
                        width={80}
                        height={80}
                        className={styles.foto}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.fotoPlaceholder}>
                        <span>{g.nombre?.charAt(0)?.toUpperCase() ?? '?'}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.info}>
                    <p className={styles.nombre}>{g.nombre}</p>
                    {g.descripcion && (
                      <p className={styles.descripcion}>{g.descripcion}</p>
                    )}
                    <div className={styles.meta}>
                      {g.miembros > 0 && (
                        <span className={styles.metaItem}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                          </svg>
                          {g.miembros}
                        </span>
                      )}
                      {(g.partidos_jugados ?? 0) > 0 && (
                        <span className={styles.metaItem}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          {g.partidos_jugados} partidos
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.cta}>
              <p className={styles.ctaText}>¿Tenés tu grupo de fútbol?</p>
              <Link href="/registro" className={styles.ctaBtn}>
                Crear grupo gratis
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
