import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BackLink from '../components/BackLink'
import SolicitudForm from '../components/SolicitudForm'
import PagarForm from '../pagar/PagarForm'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import styles from '../legal.module.css'
import consumidor from '../consumidor.module.css'

export const metadata: Metadata = {
  title: 'Botón de baja',
  description: 'Dá de baja el débito automático del Plan 10 cuando quieras, sin explicar el motivo.',
}

// Botón de baja (art. 10 ter de la Ley 24.240): con la sesión iniciada se da de baja en el momento, con el mismo
// panel de /pagar; sin sesión, o si el débito está en otra cuenta, se pide con el formulario y se hace a mano
export default async function Baja() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let nombre = ''
  let debitoActivo = false
  let vence: string | null = null
  if (user) {
    // Con service role: las tablas de pagos no tienen políticas
    const service = createServiceClient()
    const [{ data: perfil }, { data: suscripcion }] = await Promise.all([
      service.from('perfiles').select('nombre, plan_vence').eq('id', user.id).maybeSingle(),
      service.from('suscripciones_plan10').select('estado').eq('usuario_id', user.id).maybeSingle(),
    ])
    nombre = perfil?.nombre ?? ''
    debitoActivo = suscripcion?.estado === 'authorized'
    // La fecha se escribe acá y no en el navegador, para que no cambie con la zona horaria
    vence = perfil?.plan_vence
      ? new Date(perfil.plan_vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
      : null
  }

  return (
    <>
      <Header darkLinks />
      <main className={styles.page}>
        <div className={styles.inner}>
          <BackLink href="/" className={styles.back}>Inicio</BackLink>
          <h1 className={styles.title}>BOTÓN DE BAJA</h1>
          <p className={styles.updated}>Débito automático del Plan 10</p>
          <div className={styles.section}>
            <p className={styles.body}>
              Desde acá das de baja el débito automático del Plan 10 cuando quieras, sin explicar el motivo. No se te
              cobra más y seguís con Plan 10 hasta que venza lo que ya pagaste. El plan anual no se renueva solo: no
              hace falta darlo de baja.
            </p>
          </div>

          {debitoActivo ? (
            <div className={consumidor.panel}>
              <PagarForm codigo={null} tipoInicial="mensual" email={user?.email ?? null} debitoActivo esPro vence={vence} />
            </div>
          ) : (
            <>
              {user ? (
                <p className={consumidor.estado}>
                  No tenés un débito automático activo en esta cuenta ({user.email}).
                </p>
              ) : (
                <>
                  <p className={consumidor.estado}>Ingresá con tu cuenta y lo das de baja en el momento.</p>
                  <Link href="/login?next=/baja" className={consumidor.boton}>INGRESAR</Link>
                </>
              )}

              <h2 className={consumidor.subtitulo}>
                {user ? '¿EL DÉBITO ESTÁ EN OTRA CUENTA?' : '¿NO PODÉS INGRESAR?'}
              </h2>
              <p className={consumidor.estado}>Pedí la baja acá: te damos un código de trámite y la hacemos nosotros.</p>
              <SolicitudForm
                tipo="baja"
                nombreInicial={nombre}
                emailInicial={user?.email ?? ''}
                ayudaDetalle="Por ejemplo, el email de la cuenta de Mercado Pago con la que pagás."
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
