'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { buscarGrupos, darPlan10AlGrupo, eliminarGrupo, type GrupoAdmin } from '../_actions/grupos'

const buscador: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--gold-border)',
  borderRadius: 8,
  padding: '12px 16px',
  color: 'var(--text)',
  fontSize: '1rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  width: '100%',
  maxWidth: 520,
}
const accion = (color: string): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontSize: '0.85rem',
  letterSpacing: '0.06em',
  color,
  border: `1px solid ${color}55`,
  borderRadius: 6,
  padding: '6px 12px 4px',
  background: 'none',
  whiteSpace: 'nowrap',
})

export default function GruposClient({ iniciales }: { iniciales: GrupoAdmin[] }) {
  const [texto, setTexto] = useState('')
  const [grupos, setGrupos] = useState(iniciales)
  const [buscando, setBuscando] = useState(false)
  const [ocupado, setOcupado] = useState<number | null>(null)
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)
  const ultima = useRef('')

  const cambiar = (valor: string) => {
    setTexto(valor)
    clearTimeout(espera.current)
    const q = valor.trim()
    if (q.length === 1) return
    espera.current = setTimeout(async () => {
      ultima.current = q
      setBuscando(true)
      const encontrados = await buscarGrupos(q)
      if (ultima.current !== q) return
      setGrupos(encontrados)
      setBuscando(false)
    }, 350)
  }

  const plan10 = async (g: GrupoAdmin) => {
    if (!confirm(`¿Le das el Plan 10 a los ${g.miembros} miembros de "${g.nombre}"? Dado desde acá no vence.`)) return
    setOcupado(g.id)
    const r = await darPlan10AlGrupo(g.id)
    setOcupado(null)
    alert(r.ok ? `Listo: Plan 10 para ${r.cantidad} jugadores de "${g.nombre}".` : r.error)
  }

  const eliminar = async (g: GrupoAdmin) => {
    if (!confirm(`¿Eliminás "${g.nombre}"? Deja de verse en la app y en la web; sus partidos y estadísticas quedan guardados.`)) return
    setOcupado(g.id)
    const r = await eliminarGrupo(g.id)
    setOcupado(null)
    if (!r.ok) return alert(r.error)
    setGrupos(lista => lista.map(x => (x.id === g.id ? { ...x, activo: false } : x)))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <input
          type="search"
          style={buscador}
          placeholder="Buscar grupo…"
          aria-label="Buscar grupo"
          value={texto}
          onChange={e => cambiar(e.target.value)}
        />
        {buscando && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Buscando…</span>}
      </div>

      {!buscando && grupos.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin resultados.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: buscando ? 0.6 : 1 }}>
        {grupos.map(g => (
          <div
            key={g.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--gold-border)',
              borderRadius: 10,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
              opacity: ocupado === g.id ? 0.5 : g.activo ? 1 : 0.7,
            }}
          >
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', letterSpacing: '0.04em', color: 'var(--text)' }}>
                {g.nombre || '(sin nombre)'}
                {!g.activo && <span style={{ color: '#c62828' }}> · ELIMINADO</span>}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {g.miembros} {g.miembros === 1 ? 'miembro' : 'miembros'}
                {g.descripcion && ` · ${g.descripcion.length > 60 ? `${g.descripcion.slice(0, 60)}…` : g.descripcion}`}
              </p>
            </div>
            {g.activo && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" disabled={ocupado === g.id || !g.miembros} onClick={() => plan10(g)} style={accion('#2e7d32')}>
                  PLAN 10 AL GRUPO
                </button>
                <Link href={`/grupos/${g.id}`} target="_blank" style={accion('#5a5a56')}>VER</Link>
                <button type="button" disabled={ocupado === g.id} onClick={() => eliminar(g)} style={accion('#c62828')}>
                  ELIMINAR
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
