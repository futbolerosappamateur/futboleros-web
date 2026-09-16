'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Footer from '../components/Footer'
import styles from '../auth.module.css'

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://futboleros.com.ar/nueva-contrasena',
      })
      if (error) {
        setError('No se pudo enviar el email. Verificá que sea correcto.')
      } else {
        setSent(true)
      }
    })
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>RECUPERAR CONTRASEÑA</h1>

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text)', marginBottom: 8 }}>
                Te mandamos un email a <strong style={{ color: 'var(--gold)' }}>{email}</strong>.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 28 }}>
                Revisá el spam también.
              </p>
              <Link href="/login" className={styles.link}>Volver al inicio</Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>EMAIL</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <button className={styles.btnPrimary} type="submit" disabled={isPending}>
                  {isPending ? 'ENVIANDO...' : 'ENVIAR LINK'}
                </button>
              </form>
              <p className={styles.footer}>
                <Link href="/login" className={styles.link}>Volver al inicio</Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
