import type { Metadata } from 'next'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import { createServiceClient } from '@/lib/supabase/service'
import JugadoresClient, { type JugadorConStats } from './JugadoresClient'
import styles from './jugadores.module.css'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Jugadores',
  description: 'Encontrá jugadores, mirá sus figuritas y estadísticas.',
}

type RatingRow = {
  usuario_id: string
  partidos_jugados: number | null
  total_goles: number | null
  total_asistencias: number | null
  partidos_ganados: number | null
  rating: number | string | null
}

export default async function Jugadores({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const supabase = createServiceClient()

  const { data: jugadores } = await supabase
    .from('perfiles')
    .select('id, nombre, apodo, username, avatar_url, imagen_ia, es_pro')
    .not('nombre', 'is', null)
    .neq('nombre', '')
    .order('nombre', { ascending: true })
    .limit(200)

  const lista = jugadores ?? []
  const ids = lista.map((j: { id: string }) => j.id)

  // Mismos números que la página del jugador y la app: salen de ratings (una fila por grupo)
  // y se suman como en get_stats_globales
  let ratingRows: RatingRow[] = []
  if (ids.length) {
    const { data } = await supabase
      .from('ratings')
      .select('usuario_id, partidos_jugados, total_goles, total_asistencias, partidos_ganados, rating')
      .in('usuario_id', ids)
      .limit(10000)
    ratingRows = (data ?? []) as RatingRow[]
  }

  type Stats = { partidos: number; goles: number; asistencias: number; ganados: number; ratingSum: number; conRating: number; filas: number }
  const statsMap: Record<string, Stats> = {}
  for (const row of ratingRows) {
    const s = (statsMap[row.usuario_id] ??= { partidos: 0, goles: 0, asistencias: 0, ganados: 0, ratingSum: 0, conRating: 0, filas: 0 })
    s.partidos += row.partidos_jugados ?? 0
    s.goles += row.total_goles ?? 0
    s.asistencias += row.total_asistencias ?? 0
    s.ganados += row.partidos_ganados ?? 0
    s.filas++
    if (row.rating != null) {
      s.ratingSum += Number(row.rating)
      s.conRating++
    }
  }

  // Rating global como get_stats_globales: SUM(rating) / COUNT(*) / 10 (ratings guarda la nota × 10),
  // y 5.0 si nunca tuvo nota; la página del jugador lo muestra solo si jugó algún partido
  const ratingGlobal = (s: Stats) =>
    s.partidos > 0 ? (s.conRating > 0 ? s.ratingSum / s.filas / 10 : 5) : null

  const jugadoresConStats: JugadorConStats[] = lista.map((j: any) => ({
    id: j.id,
    nombre: j.nombre,
    apodo: j.apodo,
    username: j.username,
    avatar_url: j.avatar_url,
    imagen_ia: j.imagen_ia,
    es_pro: j.es_pro ?? false,
    stats: statsMap[j.id]
      ? {
          partidos: statsMap[j.id].partidos,
          goles: statsMap[j.id].goles,
          asistencias: statsMap[j.id].asistencias,
          ganados: statsMap[j.id].ganados,
          rating: ratingGlobal(statsMap[j.id]),
        }
      : { partidos: 0, goles: 0, asistencias: 0, ganados: 0, rating: null },
  }))

  return (
    <>
      <Header />
      <main className={styles.page}>
        <ParallaxHero src="/fondos/jugadores.webp" className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.badge}>COMUNIDAD</span>
            <h1 className={styles.title}>JUGADORES</h1>
            <p className={styles.subtitle}>Encontrá jugadores, mirá sus figuritas y estadísticas.</p>
          </div>
        </ParallaxHero>
        <JugadoresClient jugadores={jugadoresConStats} initialQ={query} />
      </main>
      <Footer />
    </>
  )
}
