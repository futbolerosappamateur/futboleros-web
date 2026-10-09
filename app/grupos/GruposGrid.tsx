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

const porNombre = (a: GrupoCard, b: GrupoCard) => (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es')

// Cards de la lista con el orden elegido (como el de jugadores); a igual número, por nombre
export default function GruposGrid({ grupos }: { grupos: GrupoCard[] }) {
  const [orden, setOrden] = useState<Orden>('nombre')

  const ordenados = useMemo(
    () => [...grupos].sort((a, b) => (orden === 'nombre' ? 0 : b[orden] - a[orden]) || porNombre(a, b)),
    [grupos, orden]
  )

  if (grupos.length === 0) return null

  return (
    <>
      {grupos.length > 1 && (
        <div className={styles.controls}>
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
        </div>
      )}

      <div className={styles.grid}>
        {ordenados.map(g => (
          <Link key={g.id} href={`/grupos/${g.ruta}`} className={styles.card}>
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
    </>
  )
}
