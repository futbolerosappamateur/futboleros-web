import type { Metadata } from 'next'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import { createServiceClient } from '@/lib/supabase/service'
import JugadoresClient, { type JugadorConStats } from './JugadoresClient'
import styles from './jugadores.module.css'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Jugadores — Futboleros',
  description: 'Encontrá jugadores, mirá sus figuritas y estadísticas.',
}

type EstadisticaRow = {
  usuario_id: string
  goles: number | null
  asistencias: number | null
  resultado: string | null
  nota_admin: number | null
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

  let statsRows: EstadisticaRow[] = []
  if (ids.length) {
    const { data } = await supabase
      .from('estadisticas')
      .select('usuario_id, goles, asistencias, resultado, nota_admin')
      .in('usuario_id', ids)
      .limit(10000)
    statsRows = (data ?? []) as EstadisticaRow[]
  }

  type Stats = { partidos: number; goles: number; asistencias: number; ganados: number; ratingSum: number; ratingCount: number }
  const statsMap: Record<string, Stats> = {}
  for (const row of statsRows) {
    if (!statsMap[row.usuario_id]) {
      statsMap[row.usuario_id] = { partidos: 0, goles: 0, asistencias: 0, ganados: 0, ratingSum: 0, ratingCount: 0 }
    }
    statsMap[row.usuario_id].partidos++
    statsMap[row.usuario_id].goles += row.goles ?? 0
    statsMap[row.usuario_id].asistencias += row.asistencias ?? 0
    if (row.resultado === 'ganado') statsMap[row.usuario_id].ganados++
    if (row.nota_admin != null) {
      statsMap[row.usuario_id].ratingSum += Number(row.nota_admin)
      statsMap[row.usuario_id].ratingCount++
    }
  }

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
          rating: statsMap[j.id].ratingCount > 0 ? statsMap[j.id].ratingSum / statsMap[j.id].ratingCount : null,
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
