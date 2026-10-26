'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TERMINOS_VERSION } from '@/lib/terminos'
import Footer from '../components/Footer'
import BotonGoogle from '../components/BotonGoogle'
import styles from '../auth.module.css'

export default function Registro() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [acepta, setAcepta] = useState(false)
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
        // newsletter y la versión de los textos aceptados viajan en los datos de la cuenta: el perfil se crea
        // después (supabase/newsletter.sql y terminos_y_solicitudes.sql)
        options: { data: { nombre_completo: nombre, newsletter, terminos_version: TERMINOS_VERSION } },
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
          <label className={styles.casilla}>
            <input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)} required />
            <span>
              Leí y acepto los <Link href="/terminos" target="_blank" className={styles.link}>Términos y Condiciones</Link> y
              la <Link href="/privacidad" target="_blank" className={styles.link}>Política de Privacidad</Link>
            </span>
          </label>
          <label className={styles.casilla}>
            <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} />
            <span>Quiero recibir por email las novedades y promociones de Futboleros</span>
          </label>
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
