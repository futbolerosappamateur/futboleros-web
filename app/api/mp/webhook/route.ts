import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || body.type !== 'payment' || !body.data?.id) {
    return NextResponse.json({ ok: true })
  }

  const paymentId = body.data.id

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })

  const payment = await res.json()
  if (payment.status !== 'approved') {
    return NextResponse.json({ ok: true })
  }

  const [userId, tipo] = (payment.external_reference ?? '').split('|')
  if (!userId) return NextResponse.json({ ok: true })

  const meses = tipo === 'anual' ? 12 : 1
  const planVence = new Date()
  planVence.setMonth(planVence.getMonth() + meses)

  const supabase = createServiceClient()
  await supabase
    .from('perfiles')
    .update({ plan: 10, plan_vence: planVence.toISOString() })
    .eq('id', userId)

  return NextResponse.json({ ok: true })
}

// MP también hace GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true })
}
