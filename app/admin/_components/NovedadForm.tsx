'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearNovedad, editarNovedad, subirImagenNovedad } from '../_actions/novedades'

interface Novedad {
  id: string
  titulo: string
  slug: string
  resumen: string | null
  contenido: string | null
  imagen_url: string | null
  publicado: boolean
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.85rem',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
}
const inputStyle: React.CSSProperties = {
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

export default function NovedadForm({ novedad }: { novedad?: Novedad }) {
  const [titulo, setTitulo] = useState(novedad?.titulo ?? '')
  const [slug, setSlug] = useState(novedad?.slug ?? '')
  const [imageUrl, setImageUrl] = useState(novedad?.imagen_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleTitulo = (v: string) => {
    setTitulo(v)
    if (!novedad) setSlug(slugify(v))
  }

  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const url = await subirImagenNovedad(fd)
      setImageUrl(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('imagen_url', imageUrl)
    startTransition(async () => {
      if (novedad) {
        await editarNovedad(novedad.id, formData)
      } else {
        await crearNovedad(formData)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>

      <div style={field}>
        <label style={labelStyle}>TÍTULO *</label>
        <input
          style={inputStyle}
          name="titulo"
          required
          value={titulo}
          onChange={e => handleTitulo(e.target.value)}
          placeholder="Ej: Nueva versión de la app disponible"
        />
      </div>

      <div style={field}>
        <label style={labelStyle}>SLUG (URL) *</label>
        <input
          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.9rem' }}
          name="slug"
          required
          value={slug}
          onChange={e => setSlug(e.target.value)}
          placeholder="nueva-version-app"
        />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          URL: /novedades/<b>{slug || 'slug-del-articulo'}</b>
        </span>
      </div>

      <div style={field}>
        <label style={labelStyle}>RESUMEN</label>
        <input
          style={inputStyle}
          name="resumen"
          defaultValue={novedad?.resumen ?? ''}
          placeholder="Descripción corta para la lista de novedades"
        />
      </div>

      <div style={field}>
        <label style={labelStyle}>IMAGEN DE PORTADA</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}
        />
        {uploading && <p style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>Subiendo imagen...</p>}
        {uploadError && <p style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>Error: {uploadError}</p>}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Portada"
            style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 8, marginTop: 8 }}
          />
        )}
      </div>

      <div style={field}>
        <label style={labelStyle}>CONTENIDO</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: 320,
            resize: 'vertical',
            lineHeight: 1.7,
          }}
          name="contenido"
          defaultValue={novedad?.contenido ?? ''}
          placeholder={'Escribí el contenido aquí.\n\nDos saltos de línea crean un nuevo párrafo.'}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Dos saltos de línea = nuevo párrafo. Las URLs que empiecen con http se convierten en links.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          name="publicado"
          id="publicado"
          defaultChecked={novedad?.publicado ?? false}
          style={{ width: 18, height: 18, accentColor: 'var(--gold)', cursor: 'pointer' }}
        />
        <label htmlFor="publicado" style={{ ...labelStyle, cursor: 'pointer' }}>PUBLICADO</label>
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
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'GUARDANDO...' : novedad ? 'GUARDAR CAMBIOS' : 'CREAR NOVEDAD'}
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
