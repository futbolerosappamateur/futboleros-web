'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { buscarUsuarios, cambiarPlan10, eliminarUsuario, type UsuarioAdmin } from '../_actions/usuarios'

// "2026-10-18T…" → "18/10/2026", en hora argentina
const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }) : ''

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
const insignia = (color: string, fondo: string): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  color,
  background: fondo,
  borderRadius: 4,
  padding: '3px 8px 1px',
})

export default function UsuariosClient({ iniciales }: { iniciales: UsuarioAdmin[] }) {
  const [texto, setTexto] = useState('')
  const [usuarios, setUsuarios] = useState(iniciales)
  const [buscando, setBuscando] = useState(false)
  const [ocupado, setOcupado] = useState<string | null>(null)   // el usuario con una acción en curso
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)
  const ultima = useRef('')

  // Busca cuando se deja de escribir; una letra sola no alcanza (vacío vuelve a los últimos registrados)
  const cambiar = (valor: string) => {
    setTexto(valor)
    clearTimeout(espera.current)
    const q = valor.trim()
    if (q.length === 1) return
    espera.current = setTimeout(async () => {
      ultima.current = q
      setBuscando(true)
      const encontrados = await buscarUsuarios(q)
      if (ultima.current !== q) return   // ya se escribió otra cosa
      setUsuarios(encontrados)
      setBuscando(false)
    }, 350)
  }

  const plan = async (u: UsuarioAdmin) => {
    const nombre = u.nombre || 'este jugador'
    const aviso = u.es_pro
      ? `¿Le quitás el Plan 10 a ${nombre}?${u.plan_vence ? ` Lo tiene pago hasta el ${fecha(u.plan_vence)}.` : ''}`
      : `¿Le das el Plan 10 a ${nombre}? Dado desde acá no vence.`
    if (!confirm(aviso)) return
    setOcupado(u.id)
    const r = await cambiarPlan10(u.id, !u.es_pro)
    setOcupado(null)
    if (!r.ok) return alert(r.error)
    setUsuarios(lista => lista.map(x => (x.id === u.id ? { ...x, es_pro: !u.es_pro } : x)))
  }

  const eliminar = async (u: UsuarioAdmin) => {
    const nombre = u.nombre || u.email || 'este usuario'
    if (!confirm(`¿Eliminás la cuenta de ${nombre}? Se borran su perfil, sus estadísticas, sus mensajes y sus figuritas, y no puede volver a entrar. No se puede deshacer.`)) return
    setOcupado(u.id)
    const r = await eliminarUsuario(u.id)
    setOcupado(null)
    if (!r.ok) return alert(r.error)
    setUsuarios(lista => lista.filter(x => x.id !== u.id))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <input
          type="search"
          style={buscador}
          placeholder="Buscar jugador…"
          aria-label="Buscar jugador"
          value={texto}
          onChange={e => cambiar(e.target.value)}
        />
        {buscando && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Buscando…</span>}
      </div>

      {!buscando && usuarios.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin resultados.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: buscando ? 0.6 : 1 }}>
        {usuarios.map(u => {
          const panel = !!(u.is_admin || u.acceso_panel)
          return (
            <div
              key={u.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--gold-border)',
                borderRadius: 10,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
                opacity: ocupado === u.id ? 0.5 : 1,
              }}
            >
              {u.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {(u.nombre || u.email || '?').charAt(0).toUpperCase()}
                </span>
              )}

              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', letterSpacing: '0.04em', color: 'var(--text)' }}>
                  {u.nombre || '(sin nombre)'}
                  {u.apodo && <span style={{ color: 'var(--text-muted)' }}> · {u.apodo}</span>}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>
                  {[u.email, u.username && `@${u.username}`, u.creado_en && `alta ${fecha(u.creado_en)}`].filter(Boolean).join(' · ')}
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {u.es_pro
                    ? <span style={insignia('#2e7d32', '#4caf5022')}>{u.plan_vence ? `PLAN 10 · PAGO HASTA ${fecha(u.plan_vence)}` : 'PLAN 10'}</span>
                    : <span style={insignia('var(--text-muted)', 'var(--surface-2)')}>BÁSICO</span>}
                  {panel && <span style={insignia('#0a0a1a', 'var(--gold)')}>ADMIN</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" disabled={ocupado === u.id} onClick={() => plan(u)} style={accion('#2e7d32')}>
                  {u.es_pro ? 'QUITAR PLAN 10' : 'DAR PLAN 10'}
                </button>
                <Link href={`/chat?con=${u.id}`} style={accion('#8a6d1a')}>MENSAJE</Link>
                <Link href={`/jugadores/${u.username ?? u.id}`} target="_blank" style={accion('#5a5a56')}>VER PERFIL</Link>
                {!panel && (
                  <button type="button" disabled={ocupado === u.id} onClick={() => eliminar(u)} style={accion('#c62828')}>
                    ELIMINAR
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
