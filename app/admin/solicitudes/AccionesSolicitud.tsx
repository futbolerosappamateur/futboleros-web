'use client'

import { useState, useTransition } from 'react'
import { cerrarSolicitud, darDeBajaDebitoDe, revocarPlan10 } from '../_actions/solicitudes'
import type { Resultado } from '../_actions/usuarios'

type Props = {
  id: string
  usuarioId: string | null
  esArrepentimiento: boolean
  debitoActivo: boolean
  tienePlan10: boolean
}

const boton: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.8rem',
  letterSpacing: '0.06em',
  color: 'var(--gold-light)',
  background: 'transparent',
  border: '1px solid var(--gold-border)',
  padding: '7px 14px 5px',
  borderRadius: 6,
  cursor: 'pointer',
}

// Lo que se puede hacer con un pedido pendiente. La devolución del pago se hace desde Mercado Pago
export default function AccionesSolicitud({ id, usuarioId, esArrepentimiento, debitoActivo, tienePlan10 }: Props) {
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const correr = (accion: () => Promise<Resultado>, confirmacion: string) => {
    if (!window.confirm(confirmacion)) return
    setError('')
    startTransition(async () => {
      const resultado = await accion()
      if (!resultado.ok) setError(resultado.error)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
      {usuarioId && (debitoActivo || (esArrepentimiento && tienePlan10)) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {debitoActivo && (
            <button
              type="button"
              style={boton}
              disabled={isPending}
              onClick={() => correr(() => darDeBajaDebitoDe(usuarioId), '¿Dar de baja su débito automático en Mercado Pago?')}
            >
              DAR DE BAJA EL DÉBITO
            </button>
          )}
          {esArrepentimiento && tienePlan10 && (
            <button
              type="button"
              style={boton}
              disabled={isPending}
              onClick={() => correr(() => revocarPlan10(usuarioId), '¿Quitarle el Plan 10, también lo que le quedaba pago?')}
            >
              QUITAR PLAN 10
            </button>
          )}
        </div>
      )}
      <textarea
        value={nota}
        onChange={e => setNota(e.target.value)}
        placeholder="Qué se hizo (por ejemplo, la devolución en Mercado Pago o por qué se rechaza)"
        rows={2}
        maxLength={2000}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--gold-border)',
          borderRadius: 8,
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          color: 'var(--text)',
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          style={{ ...boton, background: 'var(--gold)', color: '#0a0a1a', borderColor: 'var(--gold)' }}
          disabled={isPending}
          onClick={() => correr(() => cerrarSolicitud(id, 'resuelta', nota), '¿Marcar el pedido como resuelto?')}
        >
          RESUELTA
        </button>
        <button
          type="button"
          style={boton}
          disabled={isPending}
          onClick={() => correr(() => cerrarSolicitud(id, 'rechazada', nota), '¿Marcar el pedido como rechazado?')}
        >
          RECHAZADA
        </button>
      </div>
      {error && <p style={{ color: '#d64545', fontSize: '0.85rem' }}>{error}</p>}
    </div>
  )
}
