'use client'

import { useState } from 'react'
import styles from './jugador.module.css'

interface Props {
  avatarUrl: string | null
  imagenIa: string | null
  nombre: string
  esPro: boolean
}

export default function AvatarModal({ avatarUrl, imagenIa, nombre, esPro }: Props) {
  const [open, setOpen] = useState(false)
  const src = esPro && imagenIa ? imagenIa : avatarUrl

  return (
    <>
      <button
        className={styles.avatarCircle}
        onClick={() => src && setOpen(true)}
        aria-label="Ver foto completa"
        style={{ cursor: src ? 'pointer' : 'default' }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={nombre} className={styles.avatarCircleImg} />
        ) : (
          <div className={styles.avatarCirclePh}>
            <span>{nombre?.charAt(0)?.toUpperCase() ?? '?'}</span>
          </div>
        )}
      </button>

      {open && (
        <div className={styles.modal} onClick={() => setOpen(false)}>
          <button className={styles.modalClose} onClick={() => setOpen(false)}>✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src!}
            alt={nombre}
            className={styles.modalImg}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
