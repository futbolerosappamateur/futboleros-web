import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import { createServiceClient } from '@/lib/supabase/service'
import { FONDO_GRUPO } from '@/lib/perfil-opciones'
import { getRutasGrupos } from '@/lib/grupos'
import styles from './grupos.module.css'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Grupos',
  description: 'Equipos, ligas y peñas de toda la Argentina.',
}

type Grupo = {
  id: string
  nombre: string
  descripcion: string | null
  foto_url: string | null
  fondo_url: string | null
  creado_en: string
  miembros: number
  partidos: number
  goles: number
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
    .select('id, nombre, descripcion, foto_url, creado_en, grupo_jugadores(count)')
    .eq('activo', true)
    .eq('grupo_jugadores.activo', true)
    .eq('grupo_jugadores.estado', 'aceptado')
    .order('creado_en', { ascending: false })
    .limit(80)

  if (query) {
    sb = sb.ilike('nombre', `%${query}%`)
  }

  const { data: raw } = await sb
  const ids = (raw ?? []).map((g: any) => g.id as string)

  // Partidos y goles de cada grupo contados desde los partidos terminados, como en la app
  // (la columna grupos.partidos_jugados no se actualiza). El fondo va aparte: si la columna
  // fondo_url todavía no existe, la lista se ve igual.
  const [{ data: partidosData }, { data: fondosData }] = ids.length
    ? await Promise.all([
        supabase
          .from('partidos')
          .select('grupo_id, goles_equipo1, goles_equipo2')
          .in('grupo_id', ids)
          .eq('estado', 'finalizado')
          .limit(10000),
        supabase.from('grupos').select('id, fondo_url').in('id', ids),
      ])
    : [{ data: [] }, { data: [] }]

  const conteo: Record<string, { partidos: number; goles: number }> = {}
  for (const p of (partidosData ?? []) as any[]) {
    const c = (conteo[p.grupo_id] ??= { partidos: 0, goles: 0 })
    c.partidos++
    c.goles += (p.goles_equipo1 ?? 0) + (p.goles_equipo2 ?? 0)
  }
  const fondos = new Map(((fondosData ?? []) as any[]).map(f => [f.id as string, f.fondo_url as string | null]))
  const { porId: rutas } = await getRutasGrupos()

  const lista: Grupo[] = (raw ?? []).map((g: any) => ({
    ...g,
    fondo_url: fondos.get(g.id) ?? null,
    miembros: g.grupo_jugadores?.[0]?.count ?? 0,
    partidos: conteo[g.id]?.partidos ?? 0,
    goles: conteo[g.id]?.goles ?? 0,
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
                <Link key={g.id} href={`/grupos/${rutas.get(Number(g.id))?.ruta ?? g.id}`} className={styles.card}>
                  {/* Arriba: el fondo del grupo (el que carga el admin en la app) con la foto encima */}
                  <div
                    className={styles.visual}
                    style={{ backgroundImage: `linear-gradient(rgba(10,10,18,0.45), rgba(10,10,18,0.45)), url('${g.fondo_url || FONDO_GRUPO}')` }}
                  >
                    {g.foto_url ? (
                      <Image
                        src={g.foto_url}
                        alt={g.nombre}
                        width={96}
                        height={96}
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
                    {g.descripcion && <p className={styles.descripcion}>{g.descripcion}</p>}
                  </div>

                  <div className={styles.statsRow}>
                    <div className={styles.statMini}>
                      <span className={styles.statVal}>{g.miembros}</span>
                      <span className={styles.statLbl}>Integ.</span>
                    </div>
                    <span className={styles.statDivider} />
                    <div className={styles.statMini}>
                      <span className={styles.statVal}>{g.partidos}</span>
                      <span className={styles.statLbl}>PJ</span>
                    </div>
                    <span className={styles.statDivider} />
                    <div className={styles.statMini}>
                      <span className={styles.statVal}>{g.goles}</span>
                      <span className={styles.statLbl}>Goles</span>
                    </div>
                  </div>
                </Link>
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
