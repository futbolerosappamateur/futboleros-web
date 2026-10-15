'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import styles from './FiguritaStack.module.css'

export default function FiguritaStack() {
  const ref = useRef<HTMLDivElement>(null)
  const frente = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(styles.visible)
          obs.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Figurita brillante: con el mouse, la pila se inclina hacia donde está el puntero y sobre la de adelante
  // se mueven el reflejo y el tornasolado (las variables las leen los estilos). En pantallas táctiles no
  // hay mouse: ahí cada tanto la cruza un destello solo
  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    const carta = frente.current
    if (e.pointerType !== 'mouse' || !el || !carta) return
    const pila = el.getBoundingClientRect()
    const x = (e.clientX - pila.left) / pila.width
    const y = (e.clientY - pila.top) / pila.height
    el.style.setProperty('--rx', `${((0.5 - y) * 14).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${((x - 0.5) * 18).toFixed(2)}deg`)
    // El reflejo va donde está el mouse sobre la carta de adelante (puede quedar un poco afuera)
    const c = carta.getBoundingClientRect()
    const cx = (e.clientX - c.left) / c.width
    const cy = (e.clientY - c.top) / c.height
    el.style.setProperty('--mx', `${(cx * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(cy * 100).toFixed(1)}%`)
    el.style.setProperty('--hx', cx.toFixed(3))   // corre las franjas del tornasolado
    el.style.setProperty('--hy', cy.toFixed(3))
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
    <div ref={ref} className={styles.stack} onPointerMove={mover} onPointerLeave={salir}>
      <div className={styles.card3}>
        <Image src="/figurita-3.webp" alt="Figurita" width={296} height={427} />
      </div>
      <div className={styles.card2}>
        <Image src="/figurita-2.webp" alt="Figurita" width={296} height={427} />
      </div>
      <div ref={frente} className={styles.card1}>
        <Image src="/figurita-1.webp" alt="Figurita" width={296} height={427} />
        <span className={styles.holo} aria-hidden="true" />
        <span className={styles.brillo} aria-hidden="true" />
        <span className={styles.destello} aria-hidden="true" />
      </div>
    </div>
  )
}
