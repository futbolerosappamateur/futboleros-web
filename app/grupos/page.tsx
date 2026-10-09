import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import { createServiceClient } from '@/lib/supabase/service'
import { getRutasGrupos } from '@/lib/grupos'
import GruposClient, { type GrupoCard } from './GruposClient'
import styles from './grupos.module.css'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Grupos',
  description: 'Equipos, ligas y peñas de toda la Argentina.',
}

export default async function Grupos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const supabase = createServiceClient()

  // Todos los grupos activos: la búsqueda y el orden se hacen en el navegador, como en jugadores
  const { data: raw } = await supabase
    .from('grupos')
    .select('id, nombre, descripcion, foto_url, creado_en, grupo_jugadores(count)')
    .eq('activo', true)
    .eq('grupo_jugadores.activo', true)
    .eq('grupo_jugadores.estado', 'aceptado')
    .order('creado_en', { ascending: false })
    .limit(200)
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

  const lista: GrupoCard[] = (raw ?? []).map((g: any) => ({
    id: g.id,
    ruta: rutas.get(Number(g.id))?.ruta ?? String(g.id),
    nombre: g.nombre,
    descripcion: g.descripcion,
    foto_url: g.foto_url,
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
            <p className={styles.contador}>{lista.length} grupo{lista.length !== 1 ? 's' : ''}</p>
            <p className={styles.subtitle}>Equipos, ligas y peñas de toda la Argentina. Unite o creá el tuyo desde la app.</p>
          </div>
        </ParallaxHero>

        <div className={styles.body}>
          <div className={styles.inner}>
            {lista.length === 0 ? (
              <p className={styles.empty}>Aún no hay grupos registrados.</p>
            ) : (
              <GruposClient grupos={lista} initialQ={query} />
            )}

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
