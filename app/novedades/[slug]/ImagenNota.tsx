'use client'

import { useEffect, useState } from 'react'
import styles from './novedad.module.css'

// Imagen de la nota: al tocarla se abre en un modal a tamaño real (si no entra en la pantalla, se achica
// hasta entrar). Se cierra tocando afuera, con la ✕ o con Escape.
export default function ImagenNota({ src, alt }: { src: string; alt: string }) {
  const [abierta, setAbierta] = useState(false)

  useEffect(() => {
    if (!abierta) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierta(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abierta])

  return (
    <>
      <button type="button" className={styles.imagenBtn} onClick={() => setAbierta(true)} aria-label="Ver la imagen en tamaño real">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={styles.imagen} />
      </button>

      {abierta && (
        <div className={styles.modal} onClick={() => setAbierta(false)} role="dialog" aria-modal="true" aria-label={alt}>
          <button type="button" className={styles.modalClose} onClick={() => setAbierta(false)} aria-label="Cerrar">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className={styles.modalImg} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
