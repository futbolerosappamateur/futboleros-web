'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import styles from './FiguritaStack.module.css'

export default function FiguritaStack() {
  const ref = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={ref} className={styles.stack}>
      <div className={styles.card3}>
        <Image src="/figurita-3.webp" alt="Figurita" width={296} height={427} />
      </div>
      <div className={styles.card2}>
        <Image src="/figurita-2.webp" alt="Figurita" width={296} height={427} />
      </div>
      <div className={styles.card1}>
        <Image src="/figurita-1.webp" alt="Figurita" width={296} height={427} />
      </div>
    </div>
  )
}
