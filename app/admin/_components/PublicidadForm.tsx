'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearPublicidad, editarPublicidad, subirImagenPublicidad } from '../_actions/publicidades'

interface Publicidad {
  id: string
  slot: string
  titulo: string | null
  imagen_url: string
  url_destino: string | null
  para_free: boolean
  para_plan10: boolean
  activa: boolean
  orden: number
}

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const label: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.85rem',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
}
const input: React.CSSProperties = {
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
const selectStyle: React.CSSProperties = { ...input, cursor: 'pointer' }

const SLOTS = [
  { value: 'home_principal', label: 'Home — Banner principal (ancho)' },
  { value: 'home_hinchas', label: 'Home — Debajo de los más hinchados (ancho)' },
  { value: 'home_figurita', label: 'Home — Columna figurita (alto)' },
  { value: 'perfil_testimonios', label: 'Perfil jugador — Testimonios' },
]

export default function PublicidadForm({ pub }: { pub?: Publicidad }) {
  const [imageUrl, setImageUrl] = useState(pub?.imagen_url || '')
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const url = await subirImagenPublicidad(fd)
      setImageUrl(url)
    } catch {
      alert('Error subiendo imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('imagen_url', imageUrl)
    startTransition(async () => {
      if (pub) {
        await editarPublicidad(pub.id, formData)
      } else {
        await crearPublicidad(formData)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <div style={field}>
        <label style={label}>SLOT *</label>
        <select style={selectStyle} name="slot" required defaultValue={pub?.slot || ''}>
          <option value="" disabled>Seleccioná un slot...</option>
          {SLOTS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div style={field}>
        <label style={label}>TÍTULO INTERNO</label>
        <input style={input} name="titulo" defaultValue={pub?.titulo ?? ''} placeholder="Ej: Camisetas FC — Oct 2026" />
      </div>

      <div style={field}>
        <label style={label}>IMAGEN *</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}
        />
        {uploading && <p style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>Subiendo imagen...</p>}
        {imageUrl && (
          <img src={imageUrl} alt="Preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />
        )}
        {!imageUrl && pub && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Dejá vacío para mantener la imagen actual.</p>
        )}
      </div>

      <div style={field}>
        <label style={label}>URL DE DESTINO</label>
        <input style={input} name="url_destino" defaultValue={pub?.url_destino ?? ''} placeholder="https://... (opcional)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'end' }}>
        <div style={field}>
          <label style={label}>ORDEN</label>
          <input style={input} name="orden" type="number" defaultValue={pub?.orden ?? 0} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            name="para_free"
            id="para_free"
            defaultChecked={pub?.para_free ?? true}
            style={{ width: 18, height: 18, accentColor: 'var(--gold)', cursor: 'pointer' }}
          />
          <label htmlFor="para_free" style={{ ...label, cursor: 'pointer' }}>PLAN FREE</label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            name="para_plan10"
            id="para_plan10"
            defaultChecked={pub?.para_plan10 ?? false}
            style={{ width: 18, height: 18, accentColor: 'var(--gold)', cursor: 'pointer' }}
          />
          <label htmlFor="para_plan10" style={{ ...label, cursor: 'pointer' }}>PLAN 10</label>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          name="activa"
          id="activa"
          defaultChecked={pub?.activa ?? true}
          style={{ width: 18, height: 18, accentColor: 'var(--gold)', cursor: 'pointer' }}
        />
        <label htmlFor="activa" style={{ ...label, cursor: 'pointer' }}>ACTIVA</label>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          type="submit"
          disabled={isPending || uploading || (!imageUrl && !pub)}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            letterSpacing: '0.08em',
            background: (isPending || (!imageUrl && !pub)) ? 'var(--gold-dim)' : 'var(--gold)',
            color: '#0a0a1a',
            padding: '12px 32px',
            borderRadius: 8,
            border: 'none',
            cursor: (isPending || (!imageUrl && !pub)) ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'GUARDANDO...' : pub ? 'GUARDAR CAMBIOS' : 'CREAR PUBLICIDAD'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            letterSpacing: '0.08em',
            background: 'none',
            color: 'var(--text-muted)',
            padding: '12px 24px',
            borderRadius: 8,
            border: '1px solid var(--gold-border)',
            cursor: 'pointer',
          }}
        >
          CANCELAR
        </button>
      </div>
    </form>
  )
}
