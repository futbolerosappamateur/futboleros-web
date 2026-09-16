import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { tipo } = await req.json()
  if (tipo !== 'mensual' && tipo !== 'anual') {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  const precio = tipo === 'mensual' ? 4900 : 29400
  const titulo = tipo === 'mensual' ? 'Futboleros Plan 10 — Mensual' : 'Futboleros Plan 10 — Anual'
  const base = process.env.NEXT_PUBLIC_URL!

  const isProduction = !base.includes('localhost')

  const preference: Record<string, unknown> = {
    items: [{ title: titulo, quantity: 1, unit_price: precio, currency_id: 'ARS' }],
    payer: { email: user.email },
    external_reference: `${user.id}|${tipo}`,
    back_urls: {
      success: `${base}/pago/exito`,
      failure: `${base}/pago/error`,
      pending: `${base}/pago/pendiente`,
    },
    notification_url: `${base}/api/mp/webhook`,
  }
  if (isProduction) preference.auto_return = 'approved'

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
