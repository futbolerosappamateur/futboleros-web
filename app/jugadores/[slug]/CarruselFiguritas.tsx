'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './jugador.module.css'

type Figurita = {
  key: string
  src: string      // miniatura
  grande: string   // para el modal
}

type Props = {
  figuritas: Figurita[]
  subtitulo: string
  alt: string
}

// Encabezado con flechas + pista horizontal (se desliza con el dedo o con las flechas).
// Cada figurita abre en grande en un modal, donde se puede pasar a la siguiente.
export default function CarruselFiguritas({ figuritas, subtitulo, alt }: Props) {
  const pista = useRef<HTMLDivElement>(null)
  const [puede, setPuede] = useState({ atras: false, adelante: false })
  const [abierta, setAbierta] = useState<number | null>(null)
  const [cargadas, setCargadas] = useState<Set<string>>(() => new Set())   // grandes ya descargadas
  // Cada miniatura se dibuja en el servidor: se piden solo las visibles y las que están por aparecer
  const [hasta, setHasta] = useState(5)
  const precargadas = useRef(new Set<string>())
  const total = figuritas.length

  // La grande se dibuja en el servidor y tarda: se pide antes de que haga falta
  const precargar = (src: string) => {
    if (precargadas.current.has(src)) return
    precargadas.current.add(src)
    new Image().src = src
  }

  useEffect(() => {
    const el = pista.current
    if (!el) return
    const actualizar = () => setPuede({
      atras: el.scrollLeft > 4,
      adelante: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
    actualizar()
    el.addEventListener('scroll', actualizar, { passive: true })
    window.addEventListener('resize', actualizar)

    // Media pista más allá del borde derecho ya cuenta como "por aparecer"
    const io = new IntersectionObserver(entradas => {
      for (const e of entradas) {
        if (e.isIntersecting) setHasta(h => Math.max(h, Number((e.target as HTMLElement).dataset.i)))
      }
    }, { root: el, rootMargin: '0px 50% 0px 0px' })
    el.querySelectorAll('[data-i]').forEach(n => io.observe(n))

    return () => {
      el.removeEventListener('scroll', actualizar)
      window.removeEventListener('resize', actualizar)
      io.disconnect()
    }
  }, [])

  // Modal abierto: teclado (Esc, flechas), sin scroll de fondo y las vecinas precargadas
  useEffect(() => {
    if (abierta === null) return
    precargar(figuritas[(abierta + 1) % total].grande)
    precargar(figuritas[(abierta - 1 + total) % total].grande)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierta(null)
      if (e.key === 'ArrowRight') setAbierta(i => i === null ? i : (i + 1) % total)
      if (e.key === 'ArrowLeft') setAbierta(i => i === null ? i : (i - 1 + total) % total)
    }
    window.addEventListener('keydown', onKey)
    const overflowAntes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflowAntes
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, total])

  const mover = (sentido: 1 | -1) => {
    const el = pista.current
    if (el) el.scrollBy({ left: sentido * el.clientWidth, behavior: 'smooth' })
  }

  const pasar = (sentido: 1 | -1) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setAbierta(i => i === null ? i : (i + sentido + total) % total)
  }

  return (
    <section className={styles.figuritas} aria-label="Figuritas">
      <div className={styles.bloqueHeader}>
        <h2 className={styles.tituloBloque}>Figuritas</h2>
        <p className={styles.subtituloBloque}>{subtitulo}</p>
        {(puede.atras || puede.adelante) && (
          <div className={styles.flechas}>
            <button type="button" className={styles.flecha} onClick={() => mover(-1)} disabled={!puede.atras} aria-label="Anteriores">‹</button>
            <button type="button" className={styles.flecha} onClick={() => mover(1)} disabled={!puede.adelante} aria-label="Siguientes">›</button>
          </div>
        )}
      </div>

      <div ref={pista} className={styles.figusPista}>
        {figuritas.map((f, i) => (
          <button
            key={f.key}
            type="button"
            className={styles.figu}
            onClick={() => setAbierta(i)}
            onPointerEnter={() => precargar(f.grande)}
            onFocus={() => precargar(f.grande)}
            aria-label={`Ver en grande la figurita ${i + 1} de ${total}`}
            data-i={i}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i <= hasta ? f.src : undefined} alt="" />
          </button>
        ))}
      </div>

      {abierta !== null && (
        <div className={styles.modal} onClick={() => setAbierta(null)} role="dialog" aria-modal="true" aria-label={alt}>
          <button type="button" className={styles.modalClose} onClick={() => setAbierta(null)} aria-label="Cerrar">✕</button>
          {total > 1 && (
            <button type="button" className={`${styles.modalFlecha} ${styles.modalAnterior}`} onClick={pasar(-1)} aria-label="Figurita anterior">‹</button>
          )}
          {/* Abre al instante con la miniatura (ya descargada) y la grande aparece encima cuando llega */}
          <div className={styles.figuGrande} onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={figuritas[abierta].src} alt="" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={figuritas[abierta].key}
              src={figuritas[abierta].grande}
              alt={`${alt} (${abierta + 1} de ${total})`}
              className={`${styles.capaGrande} ${cargadas.has(figuritas[abierta].key) ? styles.capaLista : ''}`}
              onLoad={() => {
                const key = figuritas[abierta].key
                setCargadas(prev => new Set(prev).add(key))
              }}
            />
          </div>
          {total > 1 && (
            <button type="button" className={`${styles.modalFlecha} ${styles.modalSiguiente}`} onClick={pasar(1)} aria-label="Figurita siguiente">›</button>
          )}
        </div>
      )}
    </section>
  )
}
