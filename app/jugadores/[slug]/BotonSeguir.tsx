'use client'

import { useOptimistic, useState, useTransition } from 'react'
import Link from 'next/link'
import { cambiarSeguir } from './actions'
import styles from './jugador.module.css'

// "+ Seguir" en la página de otro jugador, como en su perfil de la app. Sin sesión lleva a ingresar y vuelve acá
export default function BotonSeguir({ perfilId, slug, logueado, siguiendo }: {
  perfilId: string
  slug: string
  logueado: boolean
  siguiendo: boolean
}) {
  // Cambia apenas se toca; cuando vuelve la página con el contador al día, queda lo que dice la base
  const [mostrado, setMostrado] = useOptimistic(siguiendo)
  const [enCurso, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (!logueado) {
    return (
      <div className={styles.filaSeguir}>
        <Link href={`/login?next=${encodeURIComponent(`/jugadores/${slug}`)}`} className={styles.btnSeguir}>
          + Seguir
        </Link>
      </div>
    )
  }

  const tocar = () => {
    const seguir = !mostrado
    setError('')
    startTransition(async () => {
      setMostrado(seguir)
      const r = await cambiarSeguir(perfilId, seguir)
      if ('error' in r) setError(r.error)
    })
  }

  return (
    <div className={styles.filaSeguir}>
      <button
        type="button"
        onClick={tocar}
        disabled={enCurso}
        className={mostrado ? styles.btnSiguiendo : styles.btnSeguir}
      >
        {mostrado ? (
          // Con el mouse encima avisa que el clic lo deja de seguir (los dos textos ocupan el mismo lugar)
          <>
            <span className={styles.siguiendoTexto}><IcoCheck />Siguiendo</span>
            <span className={styles.dejarTexto}>Dejar de seguir</span>
          </>
        ) : '+ Seguir'}
      </button>
      {error && <p className={styles.errorSeguir} role="alert">{error}</p>}
    </div>
  )
}

function IcoCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}
