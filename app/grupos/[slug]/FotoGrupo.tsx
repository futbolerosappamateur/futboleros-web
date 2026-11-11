'use client'

import { useEffect, useState } from 'react'
import styles from './grupo.module.css'

// El escudo del grupo: al tocarlo se ve entero, como la foto del perfil del jugador
export default function FotoGrupo({ src, nombre }: { src: string | null; nombre: string }) {
  const [abierta, setAbierta] = useState(false)

  useEffect(() => {
    if (!abierta) return
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierta(false) }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierta])

  if (!src) {
    return (
      <div className={styles.fotoCircle}>
        <span>{nombre?.charAt(0)?.toUpperCase() ?? '?'}</span>
      </div>
    )
  }

  return (
    <>
      <button type="button" className={`${styles.fotoCircle} ${styles.fotoBoton}`} onClick={() => setAbierta(true)} aria-label="Ver el escudo entero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={nombre} />
      </button>

      {abierta && (
        <div className={styles.modal} onClick={() => setAbierta(false)} role="dialog" aria-modal="true" aria-label={nombre}>
          <button type="button" className={styles.modalClose} onClick={() => setAbierta(false)} aria-label="Cerrar">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={nombre} className={styles.modalImg} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
