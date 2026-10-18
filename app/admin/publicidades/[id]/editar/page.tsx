import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { porcentajeClics } from '@/lib/publicidades'
import PublicidadForm from '../../../_components/PublicidadForm'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
// "2026-11-01" → "Noviembre 2026" (a mano: con new Date() se puede correr un día por zona horaria)
const nombreMes = (mes: string) => `${MESES[Number(mes.slice(5, 7)) - 1]} ${mes.slice(0, 4)}`

const celda: React.CSSProperties = { padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }

export default async function EditarPublicidad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const [{ data: pub }, { data: meses }] = await Promise.all([
    supabase.from('publicidades').select('*').eq('id', id).single(),
    // Si todavía no se corrió publicidades_fechas_y_numeros.sql, da error y no hay números
    supabase.from('publicidades_stats_mes').select('mes, vistas, clics').eq('publicidad_id', id).order('mes', { ascending: false }),
  ])

  if (!pub) notFound()

  const filas = (meses ?? []) as { mes: string; vistas: number; clics: number }[]
  const total = filas.reduce((t, m) => ({ vistas: t.vistas + m.vistas, clics: t.clics + m.clics }), { vistas: 0, clics: 0 })

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: 32 }}>
        EDITAR PUBLICIDAD
      </h1>

      {/* Vistas y clics por mes, para pasarle al anunciante */}
      <section style={{ maxWidth: 640, marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text)', letterSpacing: '0.06em' }}>
          VISTAS Y CLICS
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, margin: '6px 0 14px' }}>
          Una vista es cuando al menos la mitad del aviso queda en pantalla un segundo; un clic, cuando abren su link.
          Se cuentan en la web publicada, no en la local.
        </p>
        {filas.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Todavía no tiene vistas.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--surface)', borderRadius: 10, overflow: 'hidden' }}>
            <thead>
              <tr style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                <th style={{ ...celda, textAlign: 'left' }}>MES</th>
                <th style={celda}>VISTAS</th>
                <th style={celda}>CLICS</th>
                <th style={celda}>% DE CLICS</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(m => (
                <tr key={m.mes} style={{ borderTop: '1px solid var(--gold-border)' }}>
                  <td style={{ ...celda, textAlign: 'left' }}>{nombreMes(m.mes)}</td>
                  <td style={celda}>{m.vistas.toLocaleString('es-AR')}</td>
                  <td style={celda}>{m.clics.toLocaleString('es-AR')}</td>
                  <td style={celda}>{porcentajeClics(m.clics, m.vistas)}</td>
                </tr>
              ))}
              {filas.length > 1 && (
                <tr style={{ borderTop: '1px solid var(--gold-border)', fontWeight: 700 }}>
                  <td style={{ ...celda, textAlign: 'left' }}>Total</td>
                  <td style={celda}>{total.vistas.toLocaleString('es-AR')}</td>
                  <td style={celda}>{total.clics.toLocaleString('es-AR')}</td>
                  <td style={celda}>{porcentajeClics(total.clics, total.vistas)}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      <PublicidadForm pub={pub} />
    </div>
  )
}
