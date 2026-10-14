import { NextRequest, NextResponse } from 'next/server'
import { PRECIOS, esTipoPlan } from '@/lib/plan10'
import { BASE_URL, mp, pagadorDe } from '@/lib/plan10-servidor'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Arma el cobro con el precio del servidor: el anual es un pago único (Checkout Pro) y el mensual
// un débito automático (suscripción sin plan asociado: la tarjeta la carga el usuario en Mercado Pago)
export async function POST(req: NextRequest) {
  const { tipo, c, emailMp } = await req.json().catch(() => ({}))
  if (!esTipoPlan(tipo)) return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })

  const pagador = await pagadorDe(c)
  if (!pagador) {
    return NextResponse.json({ error: 'El link de pago venció. Volvé a abrirlo desde la app o entrá a la web.' }, { status: 401 })
  }

  try {
    if (tipo === 'anual') {
      const preferencia = await mp('/checkout/preferences', {
        method: 'POST',
        body: {
          items: [{ id: 'plan10-anual', title: 'Futboleros Plan 10 — Anual', quantity: 1, unit_price: PRECIOS.anual, currency_id: 'ARS' }],
          ...(pagador.email ? { payer: { email: pagador.email } } : {}),
          external_reference: `${pagador.id}|anual`,
          back_urls: {
            success: `${BASE_URL}/pago/exito`,
            failure: `${BASE_URL}/pago/error`,
            pending: `${BASE_URL}/pago/pendiente`,
          },
          // Mercado Pago no vuelve solo a una URL que no sea https (localhost)
          ...(BASE_URL.startsWith('https://') ? { auto_return: 'approved' } : {}),
          notification_url: `${BASE_URL}/api/mp/webhook`,
        },
      })
      return NextResponse.json({ init_point: preferencia.init_point })
    }

    // Mercado Pago solo deja suscribirse con el email de la cuenta de MP del que paga
    const email = String(emailMp ?? pagador.email ?? '').trim().toLowerCase()
    if (!EMAIL.test(email)) {
      return NextResponse.json({ error: 'Poné el email de tu cuenta de Mercado Pago.' }, { status: 400 })
    }
    const suscripcion = await mp('/preapproval', {
      method: 'POST',
      body: {
        reason: 'Futboleros Plan 10 — Mensual',
        external_reference: `${pagador.id}|mensual`,
        payer_email: email,
        auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: PRECIOS.mensual, currency_id: 'ARS' },
        back_url: `${BASE_URL}/pago/exito`,
        status: 'pending',
      },
    })
    return NextResponse.json({ init_point: suscripcion.init_point })
  } catch (e) {
    console.error('[mp crear-pago]', e)
    return NextResponse.json({ error: 'Mercado Pago no respondió. Probá de nuevo en un rato.' }, { status: 502 })
  }
}
