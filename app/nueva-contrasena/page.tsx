'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Footer from '../components/Footer'
import styles from '../auth.module.css'

type Status = 'loading' | 'form' | 'success' | 'error'

function NuevaContrasenaInner() {
  const [status, setStatus] = useState<Status>('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const supabase = createClient()

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        setStatus(error ? 'error' : 'form')
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setStatus(session ? 'form' : 'error')
      })
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setError('')
    setIsPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setIsPending(false)
    if (error) {
      setError('No se pudo actualizar la contraseña. Pedí un nuevo link.')
    } else {
      setStatus('success')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>NUEVA CONTRASEÑA</h1>

        {status === 'loading' && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Verificando link...</p>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#ff6b6b', marginBottom: 24 }}>
              El link expiró o es inválido. Pedí uno nuevo.
            </p>
            <Link
              href="/recuperar-contrasena"
              className={styles.btnPrimary}
              style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
            >
              PEDIR NUEVO LINK
            </Link>
          </div>
        )}

        {status === 'form' && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>NUEVA CONTRASEÑA</label>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>CONFIRMAR CONTRASEÑA</label>
              <input
                className={styles.input}
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.btnPrimary} type="submit" disabled={isPending}>
              {isPending ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}
            </button>
          </form>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#4caf50', marginBottom: 24 }}>
              ¡Contraseña actualizada! Ya podés ingresar.
            </p>
            <Link
              href="/login"
              className={styles.btnPrimary}
              style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
            >
              INGRESAR
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NuevaContrasena() {
  return (
    <>
      <Suspense fallback={
        <div className={styles.page}>
          <div className={styles.card}>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Verificando link...</p>
          </div>
        </div>
      }>
        <NuevaContrasenaInner />
      </Suspense>
      <Footer />
    </>
  )
}
