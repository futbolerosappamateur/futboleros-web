'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

// Vuelve a pedir los números al servidor sin recargar la página
export default function BotonActualizar() {
  const router = useRouter()
  const [actualizando, empezar] = useTransition()
  return (
    <button
      type="button"
      onClick={() => empezar(() => router.refresh())}
      disabled={actualizando}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.95rem',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        padding: '8px 16px 6px',
        borderRadius: 6,
        border: '1px solid var(--gold-border)',
      }}
    >
      {actualizando ? 'ACTUALIZANDO…' : '↺ ACTUALIZAR'}
    </button>
  )
}
