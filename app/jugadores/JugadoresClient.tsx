'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatoRating } from '@/lib/formato'
import styles from './jugadores.module.css'

export type JugadorConStats = {
  id: string
  nombre: string
  apodo: string | null
  username: string | null
  avatar_url: string | null
  imagen_ia: string | null
  es_pro: boolean
  stats: {
    partidos: number
    goles: number
    asistencias: number
    ganados: number
    rating: number | null
  }
}

type Sort = 'nombre' | 'partidos' | 'goles' | 'asistencias' | 'rating'
type View = 'grid' | 'list'

export default function JugadoresClient({
  jugadores,
  initialQ,
}: {
  jugadores: JugadorConStats[]
  initialQ: string
}) {
  const [q, setQ] = useState(initialQ)
  const [sort, setSort] = useState<Sort>('nombre')
  const [view, setView] = useState<View>('grid')

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim()
    let arr = term
      ? jugadores.filter(
          j =>
            j.nombre.toLowerCase().includes(term) ||
            (j.apodo?.toLowerCase().includes(term) ?? false) ||
            (j.username?.toLowerCase().includes(term) ?? false)
        )
      : [...jugadores]

    arr.sort((a, b) => {
      if (sort === 'nombre') return a.nombre.localeCompare(b.nombre, 'es')
      if (sort === 'partidos') return b.stats.partidos - a.stats.partidos
      if (sort === 'goles') return b.stats.goles - a.stats.goles
      if (sort === 'asistencias') return b.stats.asistencias - a.stats.asistencias
      if (sort === 'rating') return (b.stats.rating ?? -1) - (a.stats.rating ?? -1)
      return 0
    })

    return arr
  }, [jugadores, q, sort])

  return (
    <div className={styles.body}>
      <div className={styles.inner}>

        {/* ── Controls ── */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar jugador..."
              className={styles.searchInput}
              autoComplete="off"
            />
          </div>
          <div className={styles.controlsRight}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as Sort)}
              className={styles.sortSelect}
            >
              <option value="nombre">A → Z</option>
              <option value="partidos">Más partidos</option>
              <option value="goles">Más goles</option>
              <option value="asistencias">Más asistencias</option>
              <option value="rating">Por rating</option>
            </select>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`}
                onClick={() => setView('grid')}
                aria-label="Vista cuadrícula"
              >
                <GridIcon />
              </button>
              <button
                className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
                onClick={() => setView('list')}
                aria-label="Vista lista"
              >
                <ListIcon />
              </button>
            </div>
          </div>
        </div>

        {/* El total va en el encabezado; acá solo cuántos coinciden con la búsqueda */}
        {q.trim() && (
          <p className={styles.resultCount}>
            {filtered.length} jugador{filtered.length !== 1 ? 'es' : ''}
            {' para '}
            <span className={styles.qLabel}>"{q}"</span>
            {' · '}
            <button onClick={() => setQ('')} className={styles.clearBtn}>Ver todos</button>
          </p>
        )}

        {filtered.length === 0 && (
          <p className={styles.empty}>No se encontraron jugadores.</p>
        )}

        {view === 'grid' ? (
          <div className={styles.grid}>
            {filtered.map(j => <JugadorCard key={j.id} j={j} />)}
          </div>
        ) : (
          <div className={styles.listView}>
            {filtered.map(j => <JugadorRow key={j.id} j={j} />)}
          </div>
        )}

      </div>
    </div>
  )
}

/* ── Card ─────────────────────────────────────── */

function JugadorCard({ j }: { j: JugadorConStats }) {
  const avatarBg = useDominantColor(j.imagen_ia ? null : j.avatar_url)

  return (
    <Link href={`/jugadores/${j.username ?? j.id}`} className={styles.card}>
      {/* Visual: figurita photo or avatar */}
      <div
        className={styles.visual}
        style={!j.imagen_ia ? { background: avatarBg } : undefined}
      >
        {j.imagen_ia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={j.imagen_ia}
            alt={j.nombre}
            className={styles.figuritaImg}
            loading="lazy"
          />
        ) : j.avatar_url ? (
          <Image
            src={j.avatar_url}
            alt={j.nombre}
            width={120}
            height={120}
            className={styles.avatarImg}
            unoptimized
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <span>{j.nombre?.charAt(0)?.toUpperCase() ?? '?'}</span>
          </div>
        )}
      </div>

      {/* Name */}
      <div className={styles.cardInfo}>
        <div className={styles.nombreRow}>
          <p className={styles.nombre}>{j.nombre}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {j.es_pro && <img src="/ic-10.webp" alt="Plan 10" className={styles.plan10Icon} />}
        </div>
        {j.apodo
          ? <p className={styles.apodo}>"{j.apodo}"</p>
          : j.username
            ? <p className={styles.username}>@{j.username}</p>
            : null
        }
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statMini}>
          <span className={styles.statVal}>{j.stats.partidos}</span>
          <span className={styles.statLbl}>PJ</span>
        </div>
        <span className={styles.statDivider} />
        <div className={styles.statMini}>
          <span className={styles.statVal}>{j.stats.goles}</span>
          <span className={styles.statLbl}>G</span>
        </div>
        <span className={styles.statDivider} />
        <div className={styles.statMini}>
          <span className={styles.statVal}>{j.stats.asistencias}</span>
          <span className={styles.statLbl}>A</span>
        </div>
        <span className={styles.statDivider} />
        <div className={styles.statMini}>
          <span className={styles.statVal}>{j.stats.rating != null ? formatoRating(j.stats.rating) : '—'}</span>
          <span className={styles.statLbl}>RAT</span>
        </div>
      </div>
    </Link>
  )
}

/* ── Row (list view) ──────────────────────────── */

function JugadorRow({ j }: { j: JugadorConStats }) {
  return (
    <Link href={`/jugadores/${j.username ?? j.id}`} className={styles.listRow}>
      <div className={styles.listThumb}>
        {j.avatar_url ? (
          <Image
            src={j.avatar_url}
            alt={j.nombre}
            width={48}
            height={48}
            className={styles.listAvatar}
            unoptimized
          />
        ) : (
          <div className={styles.listAvatarPh}>
            {j.nombre?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
        )}
        {j.imagen_ia && <span className={styles.figBadge} title="Tiene figurita">★</span>}
      </div>
      <div className={styles.listInfo}>
        <span className={styles.listNombre}>
          {j.nombre}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {j.es_pro && <img src="/ic-10.webp" alt="Plan 10" className={styles.plan10IconRow} />}
        </span>
        {(j.apodo || j.username) && (
          <span className={styles.listSub}>
            {j.apodo ? `"${j.apodo}"` : ''}{j.apodo && j.username ? ' · ' : ''}{j.username ? `@${j.username}` : ''}
          </span>
        )}
      </div>
      <div className={styles.listStats}>
        <span className={styles.listStat}><b>{j.stats.partidos}</b><span className={styles.listStatLbl}>PJ</span></span>
        <span className={styles.listStat}><b>{j.stats.goles}</b><span className={styles.listStatLbl}>G</span></span>
        <span className={styles.listStat}><b>{j.stats.asistencias}</b><span className={styles.listStatLbl}>A</span></span>
        <span className={styles.listStat}><b>{j.stats.rating != null ? formatoRating(j.stats.rating) : '—'}</b><span className={styles.listStatLbl}>RAT</span></span>
      </div>
    </Link>
  )
}

/* ── Dominant colour from avatar ─────────────── */

function useDominantColor(src: string | null): string {
  const [gradient, setGradient] = useState('linear-gradient(to bottom, #222218, #12120e)')
  useEffect(() => {
    if (!src) return
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 40
        canvas.height = 40
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, 40, 40)
        const d = ctx.getImageData(0, 0, 40, 40).data
        let r = 0, g = 0, b = 0, n = 0
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue
          const lum = (d[i] + d[i + 1] + d[i + 2]) / 3
          if (lum < 20 || lum > 235) continue
          r += d[i]; g += d[i + 1]; b += d[i + 2]; n++
        }
        if (!n) return
        const rA = r / n, gA = g / n, bA = b / n
        const dark = `rgb(${Math.round(rA * 0.42)},${Math.round(gA * 0.42)},${Math.round(bA * 0.42)})`
        const light = `rgb(${Math.round(rA * 0.70)},${Math.round(gA * 0.70)},${Math.round(bA * 0.70)})`
        setGradient(`linear-gradient(to bottom, ${light}, ${dark})`)
      } catch { /* tainted canvas or CORS — keep fallback */ }
    }
    img.src = src
  }, [src])
  return gradient
}

/* ── Icons ────────────────────────────────────── */

function GridIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="7" y1="5" x2="18" y2="5" />
      <line x1="7" y1="10" x2="18" y2="10" />
      <line x1="7" y1="15" x2="18" y2="15" />
      <circle cx="3" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="3" cy="10" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="3" cy="15" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}
