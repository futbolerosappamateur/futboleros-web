'use client'

import { useRef } from 'react'
import styles from './FiguritaBrillante.module.css'

type Props = {
  children: React.ReactNode
  className?: string
  inclinacion?: number   // grados máximos hacia cada lado
  destello?: boolean     // el destello que la cruza cada tanto (en una fila de muchas queda recargado)
}

// Figurita brillante, el mismo efecto que la de la home (FiguritaStack): con el mouse se inclina hacia el
// puntero y le pasan un reflejo de luz y un tornasolado amplio. En pantallas táctiles no hay mouse: ahí la
// cruza un destello cada tanto. Recorta con el redondeo de la tarjeta (va en className si hace falta)
export default function FiguritaBrillante({ children, className, inclinacion = 12, destello = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (e.pointerType !== 'mouse' || !el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${((0.5 - y) * inclinacion).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((x - 0.5) * inclinacion * 1.3).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
    el.classList.add(styles.activa)
  }

  const salir = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.classList.remove(styles.activa)
  }

  return (
    <div
      ref={ref}
      className={className ? `${styles.figurita} ${className}` : styles.figurita}
      onPointerMove={mover}
      onPointerLeave={salir}
    >
      {children}
      <span className={styles.holo} aria-hidden="true" />
      <span className={styles.brillo} aria-hidden="true" />
      {destello && <span className={styles.destello} aria-hidden="true" />}
    </div>
  )
}
