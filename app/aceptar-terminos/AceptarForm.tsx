'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { aceptarTerminos } from './actions'
import styles from '../auth.module.css'

// next: a dónde seguir después de aceptar (ya validada en page.tsx)
export default function AceptarForm({ next }: { next: string }) {
  const [acepta, setAcepta] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const resultado = await aceptarTerminos()
      if ('error' in resultado) {
        setError(resultado.error)
        return
      }
      router.push(next)
      router.refresh()
    })
  }

  // Quien no acepta no sigue: se le cierra la sesión
  const salir = () => {
    startTransition(async () => {
      await createClient().auth.signOut()
      router.push('/')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <p className={styles.aviso}>
        Para usar Futboleros tenés que aceptar los Términos y Condiciones y la Política de Privacidad.
      </p>
      <label className={styles.casilla}>
        <input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)} required />
        <span>
          Leí y acepto los <Link href="/terminos" target="_blank" className={styles.link}>Términos y Condiciones</Link> y
          la <Link href="/privacidad" target="_blank" className={styles.link}>Política de Privacidad</Link>
        </span>
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.btnPrimary} type="submit" disabled={isPending}>
        {isPending ? 'GUARDANDO...' : 'CONTINUAR'}
      </button>
      <button type="button" className={styles.btnTexto} onClick={salir} disabled={isPending}>
        No acepto, salir
      </button>
    </form>
  )
}
