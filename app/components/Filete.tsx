import styles from './Filete.module.css'

// Filete porteño (el mismo de la app) que subraya la bajada de los encabezados.
// className: para cambiar el margen o la alineación en una página
export default function Filete({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/filete-1.webp" alt="" aria-hidden="true" width={257} height={35}
      className={className ? `${styles.filete} ${className}` : styles.filete}
    />
  )
}
