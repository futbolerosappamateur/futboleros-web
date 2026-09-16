import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import styles from '../pago.module.css'

export default function PagoExito() {
  return (
    <>
      <Header darkLinks />
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon} style={{ color: '#4caf50' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1 className={styles.title}>¡PAGO EXITOSO!</h1>
          <p className={styles.body}>Tu Plan 10 ya está activo. En unos segundos se refleja en tu cuenta.</p>
          <Link href="/" className={styles.cta}>Volver al inicio</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
