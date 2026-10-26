'use client'

import { useState, useTransition } from 'react'
import { enviarSolicitud } from '../_actions/solicitudes'
import type { TipoSolicitud } from '@/lib/solicitudes'
import auth from '../auth.module.css'
import styles from './SolicitudForm.module.css'

type Props = {
  tipo: TipoSolicitud
  nombreInicial?: string   // con la sesión iniciada, los de la cuenta
  emailInicial?: string
  ayudaDetalle: string     // qué conviene contar en el campo libre
}

// Formulario de los botones de arrepentimiento y de baja: no hace falta tener cuenta. Al enviarlo queda en
// pantalla el código de trámite
export default function SolicitudForm({ tipo, nombreInicial = '', emailInicial = '', ayudaDetalle }: Props) {
  const [email, setEmail] = useState(emailInicial)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const datos = new FormData(e.currentTarget)
    startTransition(async () => {
      const resultado = await enviarSolicitud(tipo, datos)
      if ('error' in resultado) setError(resultado.error)
      else setCodigo(resultado.codigo)
    })
  }

  if (codigo) {
    return (
      <div className={styles.resultado} role="status">
        <p className={styles.resultadoTitulo}>RECIBIMOS TU PEDIDO</p>
        <p className={styles.etiqueta}>TU CÓDIGO DE TRÁMITE</p>
        <p className={styles.codigo}>{codigo}</p>
        <p className={styles.texto}>
          Guardalo. Te vamos a escribir a <strong>{email.trim()}</strong> para contarte cómo sigue.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`${auth.form} ${styles.form}`}>
      <div className={auth.field}>
        <label className={auth.label} htmlFor={`${tipo}-nombre`}>NOMBRE Y APELLIDO</label>
        <input
          id={`${tipo}-nombre`}
          name="nombre"
          className={auth.input}
          defaultValue={nombreInicial}
          required
          maxLength={120}
          autoComplete="name"
        />
      </div>
      <div className={auth.field}>
        <label className={auth.label} htmlFor={`${tipo}-email`}>EMAIL</label>
        <input
          id={`${tipo}-email`}
          name="email"
          type="email"
          className={auth.input}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          maxLength={200}
          autoComplete="email"
        />
        <p className={styles.ayuda}>El de tu cuenta de Futboleros o el que usaste para pagar.</p>
      </div>
      <div className={auth.field}>
        <label className={auth.label} htmlFor={`${tipo}-detalle`}>DETALLE (OPCIONAL)</label>
        <textarea
          id={`${tipo}-detalle`}
          name="detalle"
          className={`${auth.input} ${styles.detalle}`}
          rows={3}
          maxLength={2000}
        />
        <p className={styles.ayuda}>{ayudaDetalle}</p>
      </div>
      {error && <p className={auth.error}>{error}</p>}
      <button className={auth.btnPrimary} type="submit" disabled={isPending}>
        {isPending ? 'ENVIANDO...' : 'ENVIAR PEDIDO'}
      </button>
    </form>
  )
}
