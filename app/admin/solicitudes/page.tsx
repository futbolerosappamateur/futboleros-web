import { createServiceClient } from '@/lib/supabase/service'
import { pesos } from '@/lib/plan10'
import { TITULO_SOLICITUD, type TipoSolicitud } from '@/lib/solicitudes'
import AccionesSolicitud from './AccionesSolicitud'

export const revalidate = 0

type Solicitud = {
  id: string
  codigo: string
  tipo: TipoSolicitud
  nombre: string
  email: string
  usuario_id: string | null
  detalle: string | null
  estado: 'pendiente' | 'resuelta' | 'rechazada'
  nota: string | null
  creado_en: string
  resuelto_en: string | null
}
type Perfil = { id: string; nombre: string | null; es_pro: boolean | null; plan_vence: string | null }
type Pago = { usuario_id: string; tipo: string; monto: number; created_at: string }

const DIA = 24 * 60 * 60 * 1000
const ZONA = 'America/Argentina/Buenos_Aires'
const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: ZONA })
const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: ZONA })

const ESTADOS = {
  pendiente: { texto: 'PENDIENTE', color: '#b8942e' },
  resuelta: { texto: 'RESUELTA', color: '#2e7d32' },
  rechazada: { texto: 'RECHAZADA', color: '#5a5a56' },
}

const chip = (color: string): React.CSSProperties => ({
  fontSize: '0.72rem',
  fontFamily: 'var(--font-display)',
  letterSpacing: '0.1em',
  padding: '3px 10px 2px',
  borderRadius: 20,
  color,
  background: `${color}1a`,
  border: `1px solid ${color}44`,
})
const dato: React.CSSProperties = { fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }

// Pedidos de los botones de arrepentimiento y de baja de la web. Los pendientes van arriba
export default async function AdminSolicitudes() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('solicitudes_consumidor')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(200)
  const solicitudes = (data ?? []) as Solicitud[]
  const lista = [
    ...solicitudes.filter(s => s.estado === 'pendiente'),
    ...solicitudes.filter(s => s.estado !== 'pendiente'),
  ]

  // La cuenta de cada pedido: plan, débito y pagos, para saber qué hay que hacer
  const ids = [...new Set(solicitudes.map(s => s.usuario_id).filter((id): id is string => !!id))]
  let perfiles: Perfil[] = []
  let debitos: { usuario_id: string; estado: string }[] = []
  let pagos: Pago[] = []
  if (ids.length) {
    const [p, d, g] = await Promise.all([
      supabase.from('perfiles').select('id, nombre, es_pro, plan_vence').in('id', ids),
      supabase.from('suscripciones_plan10').select('usuario_id, estado').in('usuario_id', ids),
      supabase.from('pagos_plan10').select('usuario_id, tipo, monto, created_at').in('usuario_id', ids).order('created_at', { ascending: false }),
    ])
    perfiles = (p.data ?? []) as Perfil[]
    debitos = d.data ?? []
    pagos = (g.data ?? []) as Pago[]
  }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.06em', color: 'var(--text)', marginBottom: 8 }}>
        SOLICITUDES
      </h1>
      <p style={{ ...dato, marginBottom: 28, maxWidth: 720 }}>
        Pedidos de los botones de arrepentimiento y de baja de la web. <strong>Arrepentimiento:</strong> devolvé el pago
        desde Mercado Pago, dale de baja el débito y quitale el Plan 10. <strong>Baja:</strong> dale de baja el débito.
        Después escribile citando el código y cerrá el pedido con lo que se hizo.
      </p>

      {lista.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0' }}>
          No llegó ningún pedido todavía.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {lista.map(s => {
          const perfil = perfiles.find(p => p.id === s.usuario_id)
          const debitoActivo = debitos.some(d => d.usuario_id === s.usuario_id && d.estado === 'authorized')
          const pagosDeEl = pagos.filter(g => g.usuario_id === s.usuario_id).slice(0, 3)
          // Plazo del arrepentimiento: 10 días corridos desde el pago
          const diasDesdePago = pagosDeEl[0]
            ? Math.floor((new Date(s.creado_en).getTime() - new Date(pagosDeEl[0].created_at).getTime()) / DIA)
            : null
          const estado = ESTADOS[s.estado]
          return (
            <div
              key={s.id}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${s.estado === 'pendiente' ? 'var(--gold)' : 'var(--gold-border)'}`,
                borderRadius: 10,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.08em', color: 'var(--text)' }}>
                  {s.codigo}
                </span>
                <span style={chip('#1a1a18')}>{TITULO_SOLICITUD[s.tipo].toUpperCase()}</span>
                <span style={chip(estado.color)}>{estado.texto}</span>
                <span style={{ ...dato, marginLeft: 'auto' }}>{fechaHora(s.creado_en)}</span>
              </div>

              <p style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
                {s.nombre} ·{' '}
                <a
                  href={`mailto:${s.email}?subject=${encodeURIComponent(`Tu pedido ${s.codigo} en Futboleros`)}`}
                  style={{ color: 'var(--gold-light)', textDecoration: 'underline', textUnderlineOffset: 3 }}
                >
                  {s.email}
                </a>
              </p>
              {s.detalle && <p style={{ ...dato, whiteSpace: 'pre-line', marginTop: 4 }}>“{s.detalle}”</p>}

              <div style={{ marginTop: 8 }}>
                {!s.usuario_id ? (
                  <p style={dato}>Ninguna cuenta de Futboleros tiene ese email.</p>
                ) : (
                  <>
                    <p style={dato}>
                      Cuenta: <strong>{perfil?.nombre?.trim() || 'sin nombre'}</strong>
                      {' · '}Plan 10: {perfil?.es_pro ? (perfil.plan_vence ? `activo hasta el ${fecha(perfil.plan_vence)}` : 'activo, dado a mano') : 'no'}
                      {' · '}Débito automático: {debitoActivo ? 'activo' : 'no'}
                    </p>
                    {pagosDeEl.length === 0 ? (
                      <p style={dato}>Sin pagos registrados.</p>
                    ) : (
                      <p style={dato}>
                        Pagos: {pagosDeEl.map(g => `${fecha(g.created_at)} ${g.tipo} ${pesos(Number(g.monto))}`).join(' · ')}
                        {s.tipo === 'arrepentimiento' && diasDesdePago !== null && (
                          <strong style={{ color: diasDesdePago <= 10 ? '#2e7d32' : '#d64545' }}>
                            {' '}({diasDesdePago <= 10 ? 'dentro' : 'fuera'} de los 10 días: pidió {diasDesdePago} {diasDesdePago === 1 ? 'día' : 'días'} después del último pago)
                          </strong>
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>

              {s.estado === 'pendiente' ? (
                <AccionesSolicitud
                  id={s.id}
                  usuarioId={s.usuario_id}
                  esArrepentimiento={s.tipo === 'arrepentimiento'}
                  debitoActivo={debitoActivo}
                  tienePlan10={!!perfil?.es_pro}
                />
              ) : (
                <p style={{ ...dato, marginTop: 10 }}>
                  {s.estado === 'resuelta' ? 'Resuelta' : 'Rechazada'}
                  {s.resuelto_en && ` el ${fechaHora(s.resuelto_en)}`}
                  {s.nota && `: ${s.nota}`}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
