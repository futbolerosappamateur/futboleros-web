'use client'

import { useState } from 'react'
import PlanButtons from '../plan10/PlanButtons'
import { PRECIOS, pesos, type TipoPlan } from '@/lib/plan10'
import base from '../plan10/plan10.module.css'
import styles from './pagar.module.css'

type Props = {
  codigo: string | null
  tipoInicial: TipoPlan
  email: string | null
  debitoActivo: boolean
  esPro: boolean
  vence: string | null   // ya escrita por el servidor
}

export default function PagarForm({ codigo, tipoInicial, email, debitoActivo, esPro, vence }: Props) {
  const [tipo, setTipo] = useState<TipoPlan>(tipoInicial)
  const [emailMp, setEmailMp] = useState(email ?? '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [dadoDeBaja, setDadoDeBaja] = useState(false)

  const pedir = async (url: string, datos: object) => {
    setEnviando(true)
    setError('')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, c: codigo }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Ocurrió un error. Probá de nuevo.')
        setEnviando(false)
        return null
      }
      return data
    } catch {
      setError('No se pudo conectar. Probá de nuevo.')
      setEnviando(false)
      return null
    }
  }

  const pagar = async () => {
    const data = await pedir('/api/mp/crear-pago', { tipo, emailMp })
    // Sigue "enviando" mientras el navegador va a Mercado Pago
    if (data?.init_point) window.location.href = data.init_point
    else if (data) { setError('Mercado Pago no devolvió el link de pago. Probá de nuevo.'); setEnviando(false) }
  }

  const darDeBaja = async () => {
    if (!window.confirm('¿Dar de baja el débito automático? No se te va a cobrar más y seguís con Plan 10 hasta que venza lo que pagaste.')) return
    const data = await pedir('/api/mp/cancelar', {})
    if (data) { setDadoDeBaja(true); setEnviando(false) }
  }

  if (debitoActivo) {
    return (
      <div className={styles.panel}>
        {dadoDeBaja ? (
          <p className={styles.estado}>
            Listo, diste de baja el débito automático: no se te va a cobrar más.
            {vence && <> Seguís con Plan 10 hasta el <strong>{vence}</strong>.</>}
          </p>
        ) : (
          <>
            <p className={styles.estado}>
              Tenés el <strong>débito automático</strong> activo: {pesos(PRECIOS.mensual)} por mes.
              {vence && <> Plan 10 pago hasta el <strong>{vence}</strong>.</>}
            </p>
            {error && <p className={base.errorMsg}>{error}</p>}
            <button type="button" className={styles.bajaBtn} onClick={darDeBaja} disabled={enviando}>
              {enviando ? '...' : 'DAR DE BAJA EL DÉBITO AUTOMÁTICO'}
            </button>
          </>
        )}
      </div>
    )
  }

  // Plan 10 dado a mano (sin vencimiento): no hay nada para pagar
  if (esPro && !vence) {
    return (
      <div className={styles.panel}>
        <p className={styles.estado}>Ya tenés <strong>Plan 10</strong> activo. ¡A disfrutarlo!</p>
      </div>
    )
  }

  return (
    <>
      {esPro && vence && (
        <div className={`${styles.panel} ${styles.panelArriba}`}>
          <p className={styles.estado}>
            Tenés Plan 10 hasta el <strong>{vence}</strong>. Si pagás ahora, se suma a lo que te queda.
          </p>
        </div>
      )}

      <p className={base.plansTitle}>ELEGÍ TU PLAN</p>
      <PlanButtons elegido={tipo} onElegir={setTipo} />

      <div className={styles.panel}>
        {tipo === 'mensual' ? (
          <>
            <label className={styles.label} htmlFor="email-mp">EMAIL DE TU CUENTA DE MERCADO PAGO</label>
            <input
              id="email-mp"
              type="email"
              className={styles.input}
              value={emailMp}
              onChange={e => setEmailMp(e.target.value)}
              autoComplete="email"
            />
            <p className={styles.hint}>
              Tiene que ser el mismo con el que entrás a Mercado Pago; si no, Mercado Pago no te deja suscribirte.
              Se cobran {pesos(PRECIOS.mensual)} por mes y lo das de baja cuando quieras desde esta página.
            </p>
          </>
        ) : (
          <p className={styles.hint}>
            Un solo pago de {pesos(PRECIOS.anual)} por 12 meses de Plan 10. No se renueva solo.
          </p>
        )}
        {error && <p className={base.errorMsg}>{error}</p>}
        <button type="button" className={styles.pagarBtn} onClick={pagar} disabled={enviando}>
          {enviando ? '...' : 'PAGAR CON MERCADO PAGO'}
        </button>
      </div>
    </>
  )
}
