import Image from 'next/image'
import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <Image src="/logoFoot2.webp" alt="Futboleros" width={180} height={48} className={styles.footerLogo} />
        <p className={styles.footerText}>© {new Date().getFullYear()} Futboleros. Todos los derechos reservados.</p>
        <nav className={styles.footerNav}>
          <Link href="/login">Ingresar</Link>
          <Link href="/registro">Registrarse</Link>
          <Link href="/contacto">Contacto</Link>
          <Link href="/terminos">Términos y condiciones</Link>
          <Link href="/privacidad">Política de privacidad</Link>
        </nav>
      </div>
    </footer>
  )
}
