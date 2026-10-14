import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BackLink from '../components/BackLink'
import { createServiceClient } from '@/lib/supabase/service'
import { esTipoPlan } from '@/lib/plan10'
import { pagadorDe } from '@/lib/plan10-servidor'
import PagarForm from './PagarForm'
import base from '../plan10/plan10.module.css'

export const metadata: Metadata = {
  title: 'Pagar Plan 10',
  robots: { index: false },
}

// Se entra desde /plan10 (con la sesión de la web) o desde la app, con ?c= (código de un solo uso)
export default async function Pagar({ searchParams }: { searchParams: Promise<{ c?: string; tipo?: string }> }) {
  const { c, tipo } = await searchParams
  const pagador = await pagadorDe(c)
  if (!pagador && !c) redirect(`/login?next=${encodeURIComponent(`/pagar${esTipoPlan(tipo) ? `?tipo=${tipo}` : ''}`)}`)

  let contenido: React.ReactNode
  let titulo = 'ACTIVÁ TU PLAN 10'
  let subtitulo = ''

  if (!pagador) {
    subtitulo = 'Este link de pago venció. Volvé a la app y tocá el plan otra vez, o entrá a la web con tu cuenta.'
    contenido = null
  } else {
    // Con service role: las tablas de pagos no tienen políticas y el código de la app no es una sesión
    const service = createServiceClient()
    const [{ data: perfil }, { data: suscripcion }] = await Promise.all([
      service.from('perfiles').select('nombre, es_pro, plan_vence').eq('id', pagador.id).maybeSingle(),
      service.from('suscripciones_plan10').select('estado').eq('usuario_id', pagador.id).maybeSingle(),
    ])
    const debitoActivo = suscripcion?.estado === 'authorized'
    const esPro = !!perfil?.es_pro
    // La fecha se escribe acá y no en el navegador, para que no cambie con la zona horaria
    const vence = perfil?.plan_vence
      ? new Date(perfil.plan_vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
      : null

    if (esPro || debitoActivo) titulo = 'TU PLAN 10'
    subtitulo = `Cuenta: ${perfil?.nombre?.trim() || pagador.email || ''}`
    contenido = (
      <PagarForm
        codigo={c ?? null}
        tipoInicial={esTipoPlan(tipo) ? tipo : 'mensual'}
        email={pagador.email}
        debitoActivo={debitoActivo}
        esPro={esPro}
        vence={vence}
      />
    )
  }

  return (
    <>
      <Header darkLinks />
      <main className={base.page}>
        <div className={base.inner}>
          <BackLink href="/plan10" className={base.back}>Plan 10</BackLink>

          <div className={base.hero}>
            <span className={base.badge}>PLAN 10</span>
            <h1 className={base.title}>{titulo}</h1>
            {subtitulo && <p className={base.subtitle}>{subtitulo}</p>}
          </div>

          {contenido}

          <p className={base.planNote}>
            El pago es procesado de forma segura por Mercado Pago. ¿Tenés dudas?{' '}
            <Link href="/contacto">Escribinos</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
