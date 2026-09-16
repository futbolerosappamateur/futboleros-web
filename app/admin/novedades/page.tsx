import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import DeleteButton from '../_components/DeleteButton'
import { eliminarNovedad } from '../_actions/novedades'

export const revalidate = 0

export default async function AdminNovedades() {
  const supabase = createServiceClient()
  const { data: novedades } = await supabase
    .from('novedades')
    .select('id, titulo, slug, publicado, creado_en')
    .order('creado_en', { ascending: false })

  const lista = novedades ?? []

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.06em', color: 'var(--text)' }}>
          NOVEDADES
        </h1>
        <Link
          href="/admin/novedades/nuevo"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.9rem',
            letterSpacing: '0.08em',
            background: 'var(--gold)',
            color: '#0a0a1a',
            padding: '10px 24px 8px',
            borderRadius: 8,
          }}
        >
          + NUEVA
        </Link>
      </div>

      {lista.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0' }}>
          No hay novedades todavía.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lista.map((n: any) => (
          <div
            key={n.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'var(--surface)',
              border: '1px solid var(--gold-border)',
              borderRadius: 10,
              padding: '14px 18px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.04em', color: 'var(--text)' }}>
                {n.titulo}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                /novedades/{n.slug}
                {' · '}
                {new Date(n.creado_en).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>

            <span style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.1em',
              padding: '3px 10px 2px',
              borderRadius: 20,
              background: n.publicado ? '#4caf5022' : 'var(--surface-2)',
              color: n.publicado ? '#4caf50' : 'var(--text-muted)',
              border: `1px solid ${n.publicado ? '#4caf5044' : 'var(--gold-border)'}`,
              flexShrink: 0,
            }}>
              {n.publicado ? 'PUBLICADO' : 'BORRADOR'}
            </span>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Link
                href={`/admin/novedades/${n.id}/editar`}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.8rem',
                  letterSpacing: '0.06em',
                  color: 'var(--gold)',
                  border: '1px solid var(--gold-border)',
                  padding: '6px 14px 4px',
                  borderRadius: 6,
                }}
              >
                EDITAR
              </Link>
              <DeleteButton id={n.id} onDelete={eliminarNovedad} label="ELIMINAR" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
