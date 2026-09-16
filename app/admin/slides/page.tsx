import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import DeleteButton from '../_components/DeleteButton'
import { eliminarSlide } from '../_actions/slides'

export default async function SlidesAdmin() {
  const supabase = createServiceClient()
  const { data: slides } = await supabase
    .from('slides')
    .select('*')
    .order('orden')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--gold)', letterSpacing: '0.06em' }}>
          SLIDES
        </h1>
        <Link
          href="/admin/slides/nuevo"
          style={{
            fontFamily: 'var(--font-display)',
            background: 'var(--gold)',
            color: '#0a0a1a',
            padding: '10px 22px',
            borderRadius: 6,
            fontSize: '1rem',
            letterSpacing: '0.08em',
          }}
        >
          + NUEVO
        </Link>
      </div>

      {!slides?.length && (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No hay slides todavía.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {slides?.map(slide => (
          <div
            key={slide.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--gold-border)',
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {slide.imagen_url && (
              <img
                src={slide.imagen_url}
                alt=""
                style={{ width: 90, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: '1.15rem', letterSpacing: '0.04em' }}>
                {slide.titulo}
              </p>
              {slide.subtitulo && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {slide.subtitulo}
                </p>
              )}
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              color: slide.activo ? 'var(--gold)' : 'var(--text-muted)',
              padding: '4px 10px',
              border: `1px solid ${slide.activo ? 'var(--gold-border)' : 'transparent'}`,
              borderRadius: 4,
              flexShrink: 0,
            }}>
              {slide.activo ? 'ACTIVO' : 'INACTIVO'}
            </span>
            <Link
              href={`/admin/slides/${slide.id}/editar`}
              style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.06em', flexShrink: 0 }}
            >
              EDITAR
            </Link>
            <DeleteButton id={slide.id} onDelete={eliminarSlide} />
          </div>
        ))}
      </div>
    </div>
  )
}
