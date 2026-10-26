import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { necesitaAceptarTerminos } from '@/lib/terminos'
import Footer from '../components/Footer'
import AceptarForm from './AceptarForm'
import styles from '../auth.module.css'

export const metadata: Metadata = {
  title: 'Términos y privacidad',
  robots: { index: false },
}

// Paso intermedio para las cuentas nuevas que no aceptaron los textos al registrarse (las de Google). Se entra
// desde la vuelta de Google y desde el login; si no hace falta aceptar nada, sigue derecho a next
export default async function AceptarTerminos({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: pedido } = await searchParams
  const next = pedido && /^\/(?![/\\])/.test(pedido) ? pedido : '/'   // solo rutas internas

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)

  const { data: perfil, error } = await supabase
    .from('perfiles').select('terminos_version').eq('id', user.id).maybeSingle()
  // Sin la columna (todavía no se corrió supabase/terminos_y_solicitudes.sql) no hay dónde guardarlo: sigue
  if (error || !necesitaAceptarTerminos(user.created_at, perfil?.terminos_version ?? user.user_metadata?.terminos_version)) {
    redirect(next)
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>UN PASO MÁS</h1>
          <AceptarForm next={next} />
        </div>
      </div>
      <Footer />
    </>
  )
}
