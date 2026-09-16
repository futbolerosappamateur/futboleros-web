import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import styles from '../pago.module.css'

export default function PagoError() {
  return (
    <>
      <Header darkLinks />
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon} style={{ color: '#e63946' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1 className={styles.title}>ERROR EN EL PAGO</h1>
          <p className={styles.body}>No se pudo procesar el pago. Podés intentarlo de nuevo o escribirnos si el problema persiste.</p>
          <Link href="/plan10" className={styles.cta}>Intentar de nuevo</Link>
          <Link href="/contacto" className={styles.ctaSecondary}>Contactar soporte</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
