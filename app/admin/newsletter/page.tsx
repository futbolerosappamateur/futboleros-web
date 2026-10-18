import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'

export const revalidate = 0

type Fila = { suscripto: boolean }

const tarjeta: React.CSSProperties = {
  flex: '1 1 280px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  background: 'var(--surface)',
  border: '1px solid var(--gold-border)',
  borderRadius: 10,
  padding: '20px 22px',
}

const titulo: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1rem',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
}

const boton: React.CSSProperties = {
  alignSelf: 'flex-start',
  fontFamily: 'var(--font-display)',
  fontSize: '0.9rem',
  letterSpacing: '0.08em',
  background: 'var(--gold)',
  color: '#0a0a1a',
  padding: '10px 24px 8px',
  borderRadius: 8,
}

// Listas para el plugin Newsletter de WordPress: se bajan en CSV (csv/route.ts) y se cargan a mano
export default async function AdminNewsletter() {
  const { data, error } = await createServiceClient().rpc('newsletter_lista')
  const filas = (data ?? []) as Fila[]
  const suscriptos = filas.filter(f => f.suscripto).length
  const bajas = filas.length - suscriptos

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.06em', color: 'var(--text)', marginBottom: 8 }}>
        NEWSLETTER
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        Los jugadores que aceptaron recibir novedades por email, en la casilla del registro o en Editar perfil.
        Solo entran los emails confirmados.
      </p>

      {error ? (
        <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '60px 0' }}>
          No se pudo leer la lista. Falta correr supabase/newsletter.sql en el SQL Editor de Supabase.
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <div style={tarjeta}>
            <span style={titulo}>SUSCRIPTOS</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', color: 'var(--gold)', lineHeight: 1 }}>{suscriptos}</span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Importalos en el plugin sin pisar a los que ya están: así no vuelven a la lista los que se dieron de baja
              desde el link de un mail. Columnas: email, nombre y apellido.
            </p>
            <a href="/admin/newsletter/csv?lista=suscriptos" style={boton}>BAJAR CSV</a>
          </div>

          <div style={tarjeta}>
            <span style={titulo}>BAJAS</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', color: 'var(--gold)', lineHeight: 1 }}>{bajas}</span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Apagaron la casilla en la app o en la web, o borraron la cuenta. Dalos de baja en el plugin antes de cada
              envío. Vienen con la fecha, los más nuevos primero.
            </p>
            <a href="/admin/newsletter/csv?lista=bajas" style={boton}>BAJAR CSV</a>
          </div>
        </div>
      )}

      <div style={{ ...tarjeta, marginTop: 16 }}>
        <span style={titulo}>EL MAIL</span>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Armalo con las secciones de la home y las últimas novedades, y copialo para pegarlo en el plugin.
        </p>
        <Link href="/admin/newsletter/mail" style={boton}>ARMAR EL MAIL</Link>
      </div>
    </>
  )
}
