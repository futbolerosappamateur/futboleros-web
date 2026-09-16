import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import styles from '../pago.module.css'

export default function PagoPendiente() {
  return (
    <>
      <Header darkLinks />
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon} style={{ color: '#c9a84c' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1 className={styles.title}>PAGO PENDIENTE</h1>
          <p className={styles.body}>Tu pago está siendo procesado. Cuando se acredite, tu Plan 10 se activa automáticamente.</p>
          <Link href="/" className={styles.cta}>Volver al inicio</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
