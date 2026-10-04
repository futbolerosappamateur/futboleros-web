'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Footer from '../components/Footer'
import BotonGoogle from '../components/BotonGoogle'
import styles from '../auth.module.css'

export default function Registro() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre_completo: nombre } },
      })
      if (error) {
        setError(error.message)
        return
      }
      router.push('/')
      router.refresh()
    })
  }

  return (
    <>
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>CREAR CUENTA</h1>
        <BotonGoogle texto="REGISTRARSE CON GOOGLE" />
        <p className={styles.separador}>o con tu email</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>NOMBRE</label>
            <input
              className={styles.input}
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
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
          <div className={styles.field}>
            <label className={styles.label}>CONTRASEÑA</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btnPrimary} type="submit" disabled={isPending}>
            {isPending ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
          </button>
        </form>
        <p className={styles.footer}>
          ¿Ya tenés cuenta? <Link href="/login" className={styles.link}>Ingresar</Link>
        </p>
      </div>
    </div>
    <Footer />
    </>
  )
}
