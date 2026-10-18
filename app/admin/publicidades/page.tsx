import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { hoyEnArgentina, porcentajeClics } from '@/lib/publicidades'
import DeleteButton from '../_components/DeleteButton'
import { eliminarPublicidad } from '../_actions/publicidades'

const SLOT_LABELS: Record<string, string> = {
  home_principal: 'Home — Banner principal',
  home_hinchas:   'Home — Más hinchados',
  perfil_testimonios: 'Perfil — Testimonios',
}

// "2026-11-30" → "30/11/2026"
const fecha = (d: string) => d.split('-').reverse().join('/')
const cantidad = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-AR')} ${n === 1 ? uno : varios}`

export default async function PublicidadesAdmin() {
  const supabase = createServiceClient()
  const [{ data: pubs }, { data: meses }] = await Promise.all([
    // Las de un mismo lugar, en el orden en que se turnan
    supabase.from('publicidades').select('*').order('slot').order('orden').order('creado_en'),
    // Si todavía no se corrió publicidades_fechas_y_numeros.sql, da error y los números quedan en cero
    supabase.from('publicidades_stats_mes').select('publicidad_id, vistas, clics'),
  ])

  const totales = new Map<string, { vistas: number; clics: number }>()
  for (const m of (meses ?? []) as { publicidad_id: string; vistas: number; clics: number }[]) {
    const t = totales.get(m.publicidad_id) ?? { vistas: 0, clics: 0 }
    totales.set(m.publicidad_id, { vistas: t.vistas + m.vistas, clics: t.clics + m.clics })
  }
  const hoy = hoyEnArgentina()

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
        {pubs?.map(pub => {
          const { vistas, clics } = totales.get(pub.id) ?? { vistas: 0, clics: 0 }
          // Programada: todavía no llegó su fecha de inicio. Vencida: ya pasó la de fin
          const estado = !pub.activa ? 'INACTIVA'
            : pub.desde && pub.desde > hoy ? 'PROGRAMADA'
            : pub.hasta && pub.hasta < hoy ? 'VENCIDA'
            : 'ACTIVA'
          const fechas = pub.desde && pub.hasta ? `del ${fecha(pub.desde)} al ${fecha(pub.hasta)}`
            : pub.desde ? `desde el ${fecha(pub.desde)}`
            : pub.hasta ? `hasta el ${fecha(pub.hasta)}`
            : null
          return (
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
                  {fechas && ` · ${fechas}`}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 3 }}>
                  {cantidad(vistas, 'vista', 'vistas')} · {cantidad(clics, 'clic', 'clics')}
                  {vistas > 0 && ` (${porcentajeClics(clics, vistas)})`}
                </p>
              </div>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                color: estado === 'ACTIVA' ? 'var(--gold)' : 'var(--text-muted)',
                padding: '4px 10px',
                border: `1px solid ${estado === 'ACTIVA' ? 'var(--gold-border)' : 'transparent'}`,
                borderRadius: 4,
                flexShrink: 0,
              }}>
                {estado}
              </span>
              <Link
                href={`/admin/publicidades/${pub.id}/editar`}
                style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.06em', flexShrink: 0 }}
              >
                EDITAR
              </Link>
              <DeleteButton id={pub.id} onDelete={eliminarPublicidad} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
