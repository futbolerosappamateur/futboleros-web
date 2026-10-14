'use client'

import Link from 'next/link'
import Header from './components/Header'
import Footer from './components/Footer'
import ParallaxHero from './components/ParallaxHero'
import styles from './error.module.css'

// Error inesperado en cualquier página (salvo /admin, que tiene el suyo): sigue con el diseño de la web
export default function ErrorPagina({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <Header />
      <main>
        <ParallaxHero src="/fondos/jugadores.webp" className={styles.hero}>
          <div className={styles.inner}>
            <span className={styles.badge}>ERROR</span>
            <h1 className={styles.titulo}>SE NOS ESCAPÓ LA PELOTA</h1>
            <p className={styles.texto}>Algo falló al cargar esta página. Probá de nuevo en un rato.</p>
            <div className={styles.acciones}>
              <button onClick={reset} className={styles.btnPrimario}>Reintentar</button>
              <Link href="/" className={styles.btnSecundario}>Ir al inicio</Link>
            </div>
          </div>
        </ParallaxHero>
      </main>
      <Footer />
    </>
  )
}
