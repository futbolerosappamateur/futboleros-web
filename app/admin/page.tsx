import { createServiceClient } from '@/lib/supabase/service'
import GraficoSemanas, { type Semana } from './_components/GraficoSemanas'
import BotonActualizar from './_components/BotonActualizar'

export const revalidate = 0

const SEMANAS = 8
const ZONA = 'America/Argentina/Buenos_Aires'

const diaArgentino = (fecha: Date) => fecha.toLocaleDateString('sv-SE', { timeZone: ZONA })   // "2026-10-18"

// "2026-10-18" → el lunes de esa semana, "2026-10-12"
function lunes(dia: string) {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

const tarjeta: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--gold-border)',
  borderRadius: 10,
  padding: '16px 20px 14px',
}

// Lo mismo que la pestaña Estadísticas del panel de admin de la app. Los gráficos de la app usaban
// perfiles.created_at y partidos.created_at, que no existen, y salían vacíos: acá van creado_en y la
// fecha de los partidos jugados
export default async function PanelAdmin() {
  const supabase = createServiceClient()

  // Las últimas 8 semanas, de lunes a domingo en hora argentina; la última es la actual
  const estaSemana = lunes(diaArgentino(new Date()))
  const semanas = Array.from({ length: SEMANAS }, (_, i) => {
    const d = new Date(`${estaSemana}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - 7 * (SEMANAS - 1 - i))
    return d.toISOString().slice(0, 10)
  })
  const desde = semanas[0]

  const [{ count: jugadores }, { count: plan10 }, { count: grupos }, { count: partidos }, { data: altas }, { data: jugados }] = await Promise.all([
    supabase.from('perfiles').select('*', { count: 'exact', head: true }).not('nombre', 'is', null),
    supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('es_pro', true).not('nombre', 'is', null),
    supabase.from('grupos').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('partidos').select('*', { count: 'exact', head: true }).eq('estado', 'finalizado'),
    // creado_en tiene zona: el lunes a las 0 de Argentina son las 3 UTC
    supabase.from('perfiles').select('creado_en').not('nombre', 'is', null).gte('creado_en', `${desde}T03:00:00Z`),
    // fecha no tiene zona: se compara solo el día
    supabase.from('partidos').select('fecha').eq('estado', 'finalizado').gte('fecha', desde),
  ])

  const porSemana = (dias: string[]): Semana[] =>
    semanas.map(semana => ({ semana, valor: dias.filter(d => lunes(d) === semana).length }))
  const altasPorSemana = porSemana(((altas ?? []) as { creado_en: string }[]).map(a => diaArgentino(new Date(a.creado_en))))
  const jugadosPorSemana = porSemana(((jugados ?? []) as { fecha: string }[]).map(p => String(p.fecha).slice(0, 10)))

  const numeros = [
    { texto: 'Jugadores', valor: jugadores ?? 0 },
    { texto: 'Con Plan 10', valor: plan10 ?? 0 },
    { texto: 'Grupos activos', valor: grupos ?? 0 },
    { texto: 'Partidos jugados', valor: partidos ?? 0 },
  ]

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--gold)', letterSpacing: '0.06em' }}>
          PANEL DE CONTROL
        </h1>
        <BotonActualizar />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        {numeros.map(n => (
          <div key={n.texto} style={tarjeta}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{n.texto}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', lineHeight: 1.1, color: 'var(--text)', letterSpacing: '0.02em' }}>
              {n.valor.toLocaleString('es-AR')}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
        <GraficoSemanas titulo="Jugadores nuevos" datos={altasPorSemana} unidad={['jugador nuevo', 'jugadores nuevos']} />
        <GraficoSemanas titulo="Partidos jugados" datos={jugadosPorSemana} unidad={['partido jugado', 'partidos jugados']} />
      </div>
    </>
  )
}
