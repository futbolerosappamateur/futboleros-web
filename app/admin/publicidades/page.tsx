import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import DeleteButton from '../_components/DeleteButton'
import { eliminarPublicidad } from '../_actions/publicidades'

const SLOT_LABELS: Record<string, string> = {
  home_principal: 'Home — Banner principal',
  home_hinchas:   'Home — Más hinchados',
  home_figurita:  'Home — Figurita (alto)',
  perfil_testimonios: 'Perfil — Testimonios',
}

export default async function PublicidadesAdmin() {
  const supabase = createServiceClient()
  const { data: pubs } = await supabase
    .from('publicidades')
    .select('*')
    .order('slot')
    .order('orden')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--gold)', letterSpacing: '0.06em' }}>
          PUBLICIDADES
        </h1>
        <Link
          href="/admin/publicidades/nueva"
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
          + NUEVA
        </Link>
      </div>

      {!pubs?.length && (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No hay publicidades todavía.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pubs?.map(pub => (
          <div
            key={pub.id}
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
            <img
              src={pub.imagen_url}
              alt=""
              style={{ width: 90, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontSize: '1.05rem', letterSpacing: '0.04em' }}>
                {pub.titulo || '(sin título)'}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 3 }}>
                {SLOT_LABELS[pub.slot] ?? pub.slot}
                {' · '}
                {[pub.para_free && 'Free', pub.para_plan10 && 'Plan 10'].filter(Boolean).join(' + ')}
              </p>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              color: pub.activa ? 'var(--gold)' : 'var(--text-muted)',
              padding: '4px 10px',
              border: `1px solid ${pub.activa ? 'var(--gold-border)' : 'transparent'}`,
              borderRadius: 4,
              flexShrink: 0,
            }}>
              {pub.activa ? 'ACTIVA' : 'INACTIVA'}
            </span>
            <Link
              href={`/admin/publicidades/${pub.id}/editar`}
              style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.06em', flexShrink: 0 }}
            >
              EDITAR
            </Link>
            <DeleteButton id={pub.id} onDelete={eliminarPublicidad} />
          </div>
        ))}
      </div>
    </div>
  )
}
