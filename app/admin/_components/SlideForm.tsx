'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearSlide, editarSlide, subirImagenSlide } from '../_actions/slides'

interface Slide {
  id: string
  titulo: string
  subtitulo: string | null
  imagen_url: string | null
  cta_texto: string | null
  cta_url: string | null
  orden: number
  activo: boolean
}

const field: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

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

export default function SlideForm({ slide }: { slide?: Slide }) {
  const [imageUrl, setImageUrl] = useState(slide?.imagen_url || '')
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
      const url = await subirImagenSlide(fd)
      setImageUrl(url)
    } catch (err) {
      alert('Error subiendo imagen')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('imagen_url', imageUrl)
    startTransition(async () => {
      if (slide) {
        await editarSlide(slide.id, formData)
      } else {
        await crearSlide(formData)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <div style={field}>
        <label style={label}>TÍTULO *</label>
        <input style={input} name="titulo" required defaultValue={slide?.titulo} placeholder="Ej: Bienvenidos a Futboleros" />
      </div>

      <div style={field}>
        <label style={label}>SUBTÍTULO</label>
        <input style={input} name="subtitulo" defaultValue={slide?.subtitulo ?? ''} placeholder="Texto secundario del slide" />
      </div>

      <div style={field}>
        <label style={label}>IMAGEN</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}
        />
        {uploading && <p style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>Subiendo imagen...</p>}
        {imageUrl && (
          <img src={imageUrl} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={field}>
          <label style={label}>TEXTO DEL BOTÓN</label>
          <input style={input} name="cta_texto" defaultValue={slide?.cta_texto ?? ''} placeholder="Ej: Registrarse" />
        </div>
        <div style={field}>
          <label style={label}>URL DEL BOTÓN</label>
          <input style={input} name="cta_url" defaultValue={slide?.cta_url ?? ''} placeholder="/registro" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'end' }}>
        <div style={field}>
          <label style={label}>ORDEN</label>
          <input style={input} name="orden" type="number" defaultValue={slide?.orden ?? 0} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 2 }}>
          <input
            type="checkbox"
            name="activo"
            id="activo"
            defaultChecked={slide?.activo ?? true}
            style={{ width: 18, height: 18, accentColor: 'var(--gold)', cursor: 'pointer' }}
          />
          <label htmlFor="activo" style={{ ...label, cursor: 'pointer' }}>ACTIVO</label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          type="submit"
          disabled={isPending || uploading}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            letterSpacing: '0.08em',
            background: isPending ? 'var(--gold-dim)' : 'var(--gold)',
            color: '#0a0a1a',
            padding: '12px 32px',
            borderRadius: 8,
            border: 'none',
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'GUARDANDO...' : slide ? 'GUARDAR CAMBIOS' : 'CREAR SLIDE'}
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
