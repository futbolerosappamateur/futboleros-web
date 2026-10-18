import { createServiceClient } from '@/lib/supabase/service'
import SorteoClient from './SorteoClient'

export const revalidate = 0

type Sorteo = {
  id: string
  nombre_premio: string
  descripcion_mes: string
  estado: string
  aprobado_en: string | null
  ganador: { nombre: string | null; apodo: string | null; domicilio: string | null } | null
}

// La pestaña Sorteos del panel de admin de la app: sortear entre los de Plan 10, aprobar y el historial
export default async function SorteosAdmin() {
  const { data } = await createServiceClient()
    .from('sorteos')
    .select('id, nombre_premio, descripcion_mes, estado, aprobado_en, ganador:ganador_id(nombre, apodo, domicilio)')
    .order('created_at', { ascending: false })
    .limit(20)
  const sorteos = (data ?? []) as unknown as Sorteo[]
  // El mes de hoy como lo escribe la app: "octubre de 2026"
  const mes = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: 8 }}>
        SORTEOS
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Entre los jugadores con Plan 10, sin las cuentas de administración. Al aprobarlo, el ganador recibe el aviso en la app.
      </p>

      <SorteoClient mesInicial={mes} />

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.06em', color: 'var(--text-muted)', margin: '36px 0 12px' }}>
        HISTORIAL
      </h2>
      {sorteos.length === 0 && <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Todavía no hay sorteos.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorteos.map(s => (
          <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.06em', color: '#8a6d1a' }}>
                {s.descripcion_mes.toUpperCase()}
              </p>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.08em', color: '#2e7d32', background: '#4caf5022', borderRadius: 4, padding: '3px 8px 1px' }}>
                {s.estado.toUpperCase()}
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', letterSpacing: '0.04em', color: 'var(--text)', marginTop: 4 }}>
              {s.ganador?.nombre || s.ganador?.apodo || '(cuenta borrada)'}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Premio: {s.nombre_premio}</p>
            {s.ganador?.domicilio && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Domicilio: {s.ganador.domicilio}</p>}
          </div>
        ))}
      </div>
    </>
  )
}
