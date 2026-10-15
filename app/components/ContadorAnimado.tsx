'use client'

import { useEffect, useRef, useState } from 'react'

// Número que sube desde 0 hasta su valor cuando aparece en pantalla. El HTML trae el valor final:
// sin JavaScript, o con el movimiento reducido, se ve ese directamente
export default function ContadorAnimado({ valor, className }: { valor: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [mostrado, setMostrado] = useState(valor)

  useEffect(() => {
    const el = ref.current
    if (!el || valor <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    setMostrado(0)
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      observer.disconnect()
      const inicio = performance.now()
      const paso = (t: number) => {
        const avance = Math.min(1, (t - inicio) / 1600)
        setMostrado(Math.round(valor * (1 - Math.pow(1 - avance, 3))))   // arranca rápido y frena al llegar
        if (avance < 1) frame = requestAnimationFrame(paso)
      }
      frame = requestAnimationFrame(paso)
    }, { threshold: 0.4 })
    observer.observe(el)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [valor])

  return <span ref={ref} className={className}>{mostrado.toLocaleString('es-AR')}</span>
}
