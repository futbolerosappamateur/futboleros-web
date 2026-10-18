'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { aprobarSorteo, sortearGanador, type Ganador } from '../_actions/sorteos'

const campo: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--gold-border)',
  borderRadius: 6,
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: '1rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  width: '100%',
}
const etiqueta: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.85rem',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
}
const boton = (lleno: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontSize: '1rem',
  letterSpacing: '0.08em',
  padding: '11px 24px 9px',
  borderRadius: 8,
  border: '1px solid var(--gold-border)',
  background: lleno ? 'var(--gold)' : 'none',
  color: lleno ? '#0a0a1a' : 'var(--text-muted)',
})

// Primero se sortea (no se guarda nada) y se ve quién ganó y su domicilio; recién al aprobar se guarda y se le avisa
export default function SorteoClient({ mesInicial }: { mesInicial: string }) {
  const router = useRouter()
  const [premio, setPremio] = useState('')
  const [mes, setMes] = useState(mesInicial)
  const [ganador, setGanador] = useState<Ganador | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const sortear = async () => {
    if (!premio.trim() || !mes.trim()) return alert('Completá el premio y el mes.')
    setOcupado(true)
    const r = await sortearGanador()
    setOcupado(false)
    if (!r.ok) return alert(r.error)
    setGanador(r.ganador)
  }

  const aprobar = async () => {
    if (!ganador) return
    setOcupado(true)
    const r = await aprobarSorteo(ganador.id, premio, mes)
    setOcupado(false)
    if (!r.ok) return alert(r.error)
    alert(`¡Listo! Se le avisó a ${ganador.nombre || ganador.apodo || 'el ganador'}.`)
    setGanador(null)
    setPremio('')
    router.refresh()   // para que aparezca en el historial
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 620 }}>
      <span style={{ ...etiqueta, color: 'var(--gold)' }}>NUEVO SORTEO</span>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={etiqueta}>PREMIO</span>
        <input style={campo} placeholder="Ej: Pelota oficial" value={premio} disabled={!!ganador} onChange={e => setPremio(e.target.value)} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={etiqueta}>MES</span>
        <input style={campo} placeholder="Ej: octubre de 2026" value={mes} disabled={!!ganador} onChange={e => setMes(e.target.value)} />
      </label>

      {!ganador ? (
        <button type="button" onClick={sortear} disabled={ocupado} style={{ ...boton(true), alignSelf: 'flex-start' }}>
          {ocupado ? 'SORTEANDO…' : 'REALIZAR SORTEO'}
        </button>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--gold)', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ ...etiqueta, color: 'var(--gold)' }}>GANADOR SORTEADO</span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', letterSpacing: '0.04em', color: 'var(--text)' }}>
            {ganador.nombre || ganador.apodo || '(sin nombre)'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Entre {ganador.participantes} {ganador.participantes === 1 ? 'jugador' : 'jugadores'} con Plan 10 · Premio: {premio} · {mes}
          </p>
          {ganador.domicilio ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text)', background: 'var(--surface)', borderRadius: 6, padding: '8px 12px', marginTop: 4 }}>
              <span style={{ ...etiqueta, display: 'block', fontSize: '0.75rem' }}>DOMICILIO DE ENVÍO</span>
              {ganador.domicilio}
            </p>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#c62828', marginTop: 4 }}>No tiene domicilio cargado en su perfil.</p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={aprobar} disabled={ocupado} style={boton(true)}>
              {ocupado ? 'GUARDANDO…' : 'APROBAR Y AVISARLE'}
            </button>
            <button type="button" onClick={() => setGanador(null)} disabled={ocupado} style={boton(false)}>
              CANCELAR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
