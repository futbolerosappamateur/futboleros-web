import Link from 'next/link'
import Header from './components/Header'
import Footer from './components/Footer'
import ParallaxHero from './components/ParallaxHero'
import styles from './error.module.css'

// 404 con el diseño de la web: links rotos y jugadores, grupos o novedades que no existen
export default function NoEncontrada() {
  return (
    <>
      <Header />
      <main>
        <ParallaxHero src="/fondos/jugadores.webp" className={styles.hero}>
          <div className={styles.inner}>
            <span className={styles.badge}>ERROR 404</span>
            <h1 className={styles.titulo}>FUERA DE JUEGO</h1>
            <p className={styles.texto}>La página que buscás no existe o cambió de dirección.</p>
            <div className={styles.acciones}>
              <Link href="/" className={styles.btnPrimario}>Ir al inicio</Link>
              <Link href="/jugadores" className={styles.btnSecundario}>Ver jugadores</Link>
            </div>
          </div>
        </ParallaxHero>
      </main>
      <Footer />
    </>
  )
}
