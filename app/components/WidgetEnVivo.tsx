'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './WidgetEnVivo.module.css'

// Partido de muestra de la home: el reloj corre y a los 34' entra el gol del 2-1, como en la app.
// Arranca cuando el widget aparece en pantalla, se frena cuando sale y se repite.
// Sin JavaScript queda en 1-1; con el movimiento reducido, quieto después del gol
const DESDE = 33 * 60 + 50
const GOL = 34 * 60
const HASTA = 34 * 60 + 30

const EVENTOS_PREVIOS = [
  { minuto: "21'", nombre: 'Ibarak F.' },
  { minuto: "12'", nombre: 'Andrés M.' },
]

export default function WidgetEnVivo() {
  const ref = useRef<HTMLDivElement>(null)
  const [segundos, setSegundos] = useState(DESDE)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSegundos(38 * 60)
      return
    }
    const observer = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setSegundos(s => (s + 1 >= HASTA ? DESDE : s + 1)), 1000)
    return () => clearInterval(id)
  }, [visible])

  const huboGol = segundos >= GOL
  const festejo = segundos >= GOL && segundos < GOL + 3
  const reloj = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`

  return (
    <div ref={ref} className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.liveTag}>
          <span className={styles.dot} />
          EN VIVO
        </span>
        <span className={styles.tiempo}>{reloj}</span>
      </div>

      <div className={styles.marcador}>
        <div className={styles.equipo}>
          <span className={styles.equipoNombre}>AZUL</span>
          {/* La key nueva hace que el número salte cuando entra el gol */}
          <span key={huboGol ? 'gol' : 'antes'} className={huboGol ? `${styles.goles} ${styles.golNuevo}` : styles.goles}>
            {huboGol ? 2 : 1}
          </span>
        </div>
        <span className={styles.guion}>–</span>
        <div className={styles.equipo}>
          <span className={styles.equipoNombre}>ROJO</span>
          <span className={styles.goles}>1</span>
        </div>
        {festejo && <span className={styles.festejo} aria-hidden="true">¡GOOOL!</span>}
      </div>

      <div className={styles.eventos}>
        {huboGol && (
          <div className={`${styles.evento} ${styles.eventoNuevo}`}>
            <span className={styles.eventoMinuto}>34&apos;</span>
            <span className={styles.eventoIcono} role="img" aria-label="Gol" />
            <span className={styles.eventoNombre}>Limay U.</span>
          </div>
        )}
        {EVENTOS_PREVIOS.map(e => (
          <div key={e.minuto} className={styles.evento}>
            <span className={styles.eventoMinuto}>{e.minuto}</span>
            <span className={styles.eventoIcono} role="img" aria-label="Gol" />
            <span className={styles.eventoNombre}>{e.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
