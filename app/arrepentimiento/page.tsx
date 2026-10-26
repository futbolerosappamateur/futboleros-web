import type { Metadata } from 'next'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BackLink from '../components/BackLink'
import SolicitudForm from '../components/SolicitudForm'
import { createClient } from '@/lib/supabase/server'
import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'Botón de arrepentimiento',
  description: 'Revocá la compra del Plan 10 dentro de los 10 días corridos, sin costo y sin explicar el motivo.',
}

// Botón de arrepentimiento (art. 34 de la Ley 24.240 y Resolución 424/2020): sin pedir cuenta, con código de
// trámite. El link está en el pie de todas las páginas
export default async function Arrepentimiento() {
  // Con la sesión iniciada se completan el nombre y el email; sin sesión se puede pedir igual
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: perfil } = user
    ? await supabase.from('perfiles').select('nombre').eq('id', user.id).maybeSingle()
    : { data: null }

  return (
    <>
      <Header darkLinks />
      <main className={styles.page}>
        <div className={styles.inner}>
          <BackLink href="/" className={styles.back}>Inicio</BackLink>
          <h1 className={styles.title}>BOTÓN DE ARREPENTIMIENTO</h1>
          <p className={styles.updated}>Revocar la compra del Plan 10</p>
          <div className={styles.section}>
            <p className={styles.body}>
              Si contrataste el Plan 10, podés revocar la compra dentro de los 10 días corridos desde que la hiciste,
              sin costo y sin explicar el motivo. No hace falta que tengas la sesión iniciada.
            </p>
          </div>
          <div className={styles.section}>
            <p className={styles.body}>
              Completá el formulario y te damos un código de trámite. Te devolvemos lo que pagaste por el mismo medio
              de pago y, si tenías débito automático, también lo damos de baja. Con la revocación, el Plan 10 queda
              sin efecto.
            </p>
          </div>
          <SolicitudForm
            tipo="arrepentimiento"
            nombreInicial={perfil?.nombre ?? ''}
            emailInicial={user?.email ?? ''}
            ayudaDetalle="Por ejemplo, la fecha en que pagaste o qué plan contrataste."
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
