import Link from 'next/link'
import styles from './BloquePublicidad.module.css'

// Espacio de publicidad propia de la web (no AdMob). Por ahora muestra un aviso de la casa;
// cuando exista el admin de publicidades, acá va la que esté activa.
export default function BloquePublicidad() {
  return (
    <aside className={styles.bloque} aria-label="Publicidad">
      <span className={styles.etiqueta}>Publicidad</span>
      <p className={styles.titulo}>Tu marca en Futboleros</p>
      <p className={styles.texto}>Llegá a los jugadores de fútbol amateur de todo el país.</p>
      <Link href="/contacto" className={styles.boton}>Quiero publicitar</Link>
    </aside>
  )
}
