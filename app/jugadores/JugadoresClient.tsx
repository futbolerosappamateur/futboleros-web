'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './jugadores.module.css'

export type JugadorConStats = {
  id: string
  nombre: string
  apodo: string | null
  username: string | null
  avatar_url: string | null
  imagen_ia: string | null
  plan: number | null
  stats: {
    partidos: number
    goles: number
    asistencias: number
    ganados: number
  }
}

type Sort = 'nombre' | 'partidos' | 'goles' | 'asistencias'
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

        <p className={styles.resultCount}>
          {filtered.length} jugador{filtered.length !== 1 ? 'es' : ''}
          {q && (
            <>
              {' para '}
              <span className={styles.qLabel}>"{q}"</span>
              {' · '}
              <button onClick={() => setQ('')} className={styles.clearBtn}>Ver todos</button>
            </>
          )}
        </p>

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
  const pct = j.stats.partidos > 0
    ? Math.round((j.stats.ganados / j.stats.partidos) * 100)
    : 0

  return (
    <Link href={`/jugadores/${j.username ?? j.id}`} className={styles.card}>
      {/* Visual: figurita photo or avatar */}
      <div className={styles.visual}>
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
          {Number(j.plan) === 10 && <span className={styles.plan10Star}>★</span>}
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
          <span className={styles.statVal}>{pct}%</span>
          <span className={styles.statLbl}>G%</span>
        </div>
      </div>
    </Link>
  )
}

/* ── Row (list view) ──────────────────────────── */

function JugadorRow({ j }: { j: JugadorConStats }) {
  const pct = j.stats.partidos > 0
    ? Math.round((j.stats.ganados / j.stats.partidos) * 100)
    : 0

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
          {Number(j.plan) === 10 && <span className={styles.plan10StarRow}>★</span>}
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
        <span className={styles.listStat}><b>{pct}%</b><span className={styles.listStatLbl}>G%</span></span>
      </div>
    </Link>
  )
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
