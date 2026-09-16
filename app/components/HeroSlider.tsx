'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import styles from './HeroSlider.module.css'

interface Slide {
  id: string
  titulo: string
  subtitulo: string | null
  imagen_url: string | null
  cta_texto: string | null
  cta_url: string | null
}

export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const goTo = useCallback((idx: number) => {
    setCurrent(idx)
    setAnimKey(k => k + 1)
  }, [])

  const next = useCallback(
    () => goTo((current + 1) % slides.length),
    [current, slides.length, goTo]
  )

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(next, 6000)
    return () => clearInterval(t)
  }, [next, slides.length])

  if (!slides.length) {
    return (
      <section className={styles.slider} style={{ backgroundImage: 'url(/hero.webp)' }}>
        <div className={styles.bg} style={{ backgroundImage: 'url(/hero.webp)', opacity: 1 }} />
        <div className={styles.overlay} />
        <div className={styles.content}>
          <h1 className={styles.title}>FUTBOLEROS</h1>
          <p className={styles.subtitle}>El fútbol amateur, organizado.</p>
          <Link href="/registro" className={styles.cta}>Crear cuenta</Link>
        </div>
      </section>
    )
  }

  const slide = slides[current]

  return (
    <section className={styles.slider}>
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`${styles.bg} ${i === current ? styles.bgActive : ''}`}
          style={{ backgroundImage: s.imagen_url ? `url(${s.imagen_url})` : 'url(/hero.webp)' }}
        />
      ))}
      <div className={styles.overlay} />

      <div className={styles.content} key={animKey}>
        <h1 className={styles.title}>{slide.titulo}</h1>
        {slide.subtitulo && <p className={styles.subtitle}>{slide.subtitulo}</p>}
        {slide.cta_texto && slide.cta_url && (
          <Link href={slide.cta_url} className={styles.cta}>{slide.cta_texto}</Link>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => goTo((current - 1 + slides.length) % slides.length)}
            aria-label="Anterior"
          >‹</button>
          <button
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={next}
            aria-label="Siguiente"
          >›</button>
          <div className={styles.dots}>
            {slides.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
