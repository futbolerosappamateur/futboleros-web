'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CATEGORIAS_NOVEDADES } from '@/lib/novedades'
import styles from './novedades.module.css'

export type NovedadItem = {
  id: string
  titulo: string
  slug: string
  resumen: string | null
  imagen_url: string | null
  categoria: string | null
  fecha: string      // "15/09/2026"
  mes: string        // "2026-09", para filtrar
  mesLabel: string   // "Septiembre de 2026"
}

// Filtros por categoría y por mes; las novedades llegan de la más nueva a la más vieja
export default function NovedadesClient({ novedades }: { novedades: NovedadItem[] }) {
  const [categoria, setCategoria] = useState('')
  const [mes, setMes] = useState('')

  // Solo las opciones que tienen alguna novedad
  const categorias = CATEGORIAS_NOVEDADES.filter(c => novedades.some(n => n.categoria === c))
  const meses = [...new Map(novedades.map(n => [n.mes, n.mesLabel])).entries()]

  const filtradas = novedades.filter(n => (!categoria || n.categoria === categoria) && (!mes || n.mes === mes))
  const verTodas = () => { setCategoria(''); setMes('') }

  return (
    <>
      <div className={styles.controls}>
        {categorias.length > 0 && (
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            className={styles.filtroSelect}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select
          value={mes}
          onChange={e => setMes(e.target.value)}
          className={styles.filtroSelect}
          aria-label="Filtrar por fecha"
        >
          <option value="">Todas las fechas</option>
          {meses.map(([clave, label]) => <option key={clave} value={clave}>{label}</option>)}
        </select>
      </div>

      {filtradas.length === 0 && (
        <p className={styles.empty}>
          No hay novedades con esos filtros.{' '}
          <button onClick={verTodas} className={styles.clearBtn}>Ver todas</button>
        </p>
      )}

      <div className={styles.grid}>
        {filtradas.map(n => (
          <Link key={n.id} href={`/novedades/${n.slug}`} className={styles.card}>
            <div className={styles.cardImg}>
              {n.imagen_url ? (
                <Image
                  src={n.imagen_url}
                  alt={n.titulo}
                  fill
                  className={styles.img}
                  unoptimized
                />
              ) : (
                <div className={styles.imgPlaceholder}>
                  <span className={styles.imgPlaceholderIcon}>📰</span>
                </div>
              )}
            </div>
            <div className={styles.cardBody}>
              <p className={styles.meta}>
                {n.categoria && <span className={styles.categoria}>{n.categoria}</span>}
                <time className={styles.fecha}>{n.fecha}</time>
              </p>
              <h2 className={styles.cardTitle}>{n.titulo}</h2>
              {n.resumen && <p className={styles.resumen}>{n.resumen}</p>}
              <span className={styles.leerMas}>Leer más →</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
