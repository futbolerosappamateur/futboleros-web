'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FONDO_GRUPO } from '@/lib/perfil-opciones'
import styles from './grupos.module.css'

export type GrupoCard = {
  id: string
  ruta: string
  nombre: string
  descripcion: string | null
  foto_url: string | null
  fondo_url: string | null
  miembros: number
  partidos: number
  goles: number
}

type Orden = 'nombre' | 'miembros' | 'partidos' | 'goles'
type Vista = 'grid' | 'list'

const porNombre = (a: GrupoCard, b: GrupoCard) => (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es')

// Buscador, orden y vista (cards o lista), igual que en jugadores; a igual número ordena por nombre
export default function GruposClient({ grupos, initialQ }: { grupos: GrupoCard[]; initialQ: string }) {
  const [q, setQ] = useState(initialQ)
  const [orden, setOrden] = useState<Orden>('nombre')
  const [vista, setVista] = useState<Vista>('grid')

  const filtrados = useMemo(() => {
    const term = q.toLowerCase().trim()
    const lista = term
      ? grupos.filter(g =>
          (g.nombre ?? '').toLowerCase().includes(term) ||
          (g.descripcion?.toLowerCase().includes(term) ?? false)
        )
      : [...grupos]
    return lista.sort((a, b) => (orden === 'nombre' ? 0 : b[orden] - a[orden]) || porNombre(a, b))
  }, [grupos, q, orden])

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar grupo..."
            className={styles.searchInput}
            autoComplete="off"
          />
        </div>
        <div className={styles.controlsRight}>
          <select
            value={orden}
            onChange={e => setOrden(e.target.value as Orden)}
            className={styles.sortSelect}
            aria-label="Ordenar grupos"
          >
            <option value="nombre">A → Z</option>
            <option value="miembros">Más integrantes</option>
            <option value="partidos">Más partidos</option>
            <option value="goles">Más goles</option>
          </select>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${vista === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setVista('grid')}
              aria-label="Vista cuadrícula"
            >
              <GridIcon />
            </button>
            <button
              className={`${styles.viewBtn} ${vista === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setVista('list')}
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
          {filtrados.length} grupo{filtrados.length !== 1 ? 's' : ''}
          {' para '}
          <span className={styles.qLabel}>"{q}"</span>
          {' · '}
          <button onClick={() => setQ('')} className={styles.clearBtn}>Ver todos</button>
        </p>
      )}

      {filtrados.length === 0 && q.trim() && (
        <p className={styles.empty}>No se encontraron grupos.</p>
      )}

      {vista === 'grid' ? (
        <div className={styles.grid}>
          {filtrados.map(g => <GrupoCardItem key={g.id} g={g} />)}
        </div>
      ) : (
        <div className={styles.listView}>
          {filtrados.map(g => <GrupoRow key={g.id} g={g} />)}
        </div>
      )}
    </>
  )
}

/* ── Card ─────────────────────────────────────── */

function GrupoCardItem({ g }: { g: GrupoCard }) {
  return (
    <Link href={`/grupos/${g.ruta}`} className={styles.card}>
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
  )
}

/* ── Fila (vista lista) ───────────────────────── */

function GrupoRow({ g }: { g: GrupoCard }) {
  return (
    <Link href={`/grupos/${g.ruta}`} className={styles.listRow}>
      <div className={styles.listThumb}>
        {g.foto_url ? (
          <Image
            src={g.foto_url}
            alt={g.nombre}
            width={48}
            height={48}
            className={styles.listAvatar}
            unoptimized
          />
        ) : (
          <div className={styles.listAvatarPh}>
            {g.nombre?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
      <div className={styles.listInfo}>
        <span className={styles.listNombre}>{g.nombre}</span>
        {g.descripcion && <span className={styles.listSub}>{g.descripcion}</span>}
      </div>
      <div className={styles.listStats}>
        <span className={styles.listStat}><b>{g.miembros}</b><span className={styles.listStatLbl}>INTEG.</span></span>
        <span className={styles.listStat}><b>{g.partidos}</b><span className={styles.listStatLbl}>PJ</span></span>
        <span className={styles.listStat}><b>{g.goles}</b><span className={styles.listStatLbl}>GOLES</span></span>
      </div>
    </Link>
  )
}

/* ── Íconos ───────────────────────────────────── */

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
