import { NextRequest, NextResponse } from 'next/server'

// Called by the mobile app (no session cookie — user data sent in body)
export async function POST(req: NextRequest) {
  const { usuario_id, tipo, precio, titulo, email } = await req.json().catch(() => ({}))

  if (!usuario_id || !tipo || !precio) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const base = process.env.NEXT_PUBLIC_URL!

  const preference = {
    items: [{ title: titulo ?? `Futboleros Plan 10 — ${tipo}`, quantity: 1, unit_price: precio, currency_id: 'ARS' }],
    payer: { email },
    external_reference: `${usuario_id}|${tipo}`,
    back_urls: {
      success: `${base}/pago/exito`,
      failure: `${base}/pago/error`,
      pending: `${base}/pago/pendiente`,
    },
    auto_return: 'approved',
    notification_url: `${base}/api/mp/webhook`,
  }

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ error: data.message ?? 'Error MP' }, { status: 500 })
  }

  return NextResponse.json({ init_point: data.init_point })
}
