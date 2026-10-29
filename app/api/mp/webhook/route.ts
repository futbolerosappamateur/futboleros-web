import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PRECIOS, esTipoPlan } from '@/lib/plan10'
import { mp } from '@/lib/plan10-servidor'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// "usuario|tipo", como lo arma crear-pago
function referencia(ref: unknown) {
  const [usuarioId, tipo] = String(ref ?? '').split('|')
  return UUID.test(usuarioId) && esTipoPlan(tipo) ? { usuarioId, tipo } : null
}

// Estado del débito automático del usuario, para mostrarlo en /pagar y poder darlo de baja
async function guardarSuscripcion(suscripcion: any) {
  const ref = referencia(suscripcion.external_reference)
  if (!ref) return
  const service = createServiceClient()
  const { data: actual } = await service
    .from('suscripciones_plan10').select('mp_preapproval_id, estado').eq('usuario_id', ref.usuarioId).maybeSingle()
  // Una suscripción abandonada o vieja no pisa a la que está activa
  if (actual && actual.mp_preapproval_id !== suscripcion.id && actual.estado === 'authorized' && suscripcion.status !== 'authorized') return
  const { error } = await service.from('suscripciones_plan10').upsert({
    usuario_id: ref.usuarioId,
    mp_preapproval_id: suscripcion.id,
    estado: suscripcion.status,
    actualizado: new Date().toISOString(),
  })
  if (error) throw error
}

// Un pago devuelto, o desconocido con la tarjeta (contracargo), le saca al Plan 10 lo que había sumado
const DESCONTAR = ['refunded', 'charged_back']

// Cada pago aprobado extiende el Plan 10 (1 mes el débito, 12 el anual) una sola vez, aunque el aviso se repita.
// Si después se devuelve o se desconoce, se descuenta también una sola vez
async function procesarPago(paymentId: string) {
  const pago = await mp(`/v1/payments/${paymentId}`)
  if (DESCONTAR.includes(pago.status)) {
    const { error } = await createServiceClient().rpc('revertir_pago_plan10', { p_payment_id: String(pago.id) })
    if (error) throw error
    return
  }
  if (pago.status !== 'approved') return

  // Los cobros del débito automático traen el id de la suscripción, y ahí está el usuario
  const suscripcionId = pago.metadata?.preapproval_id ?? pago.point_of_interaction?.transaction_data?.subscription_id
  let ref
  if (suscripcionId) {
    const suscripcion = await mp(`/preapproval/${suscripcionId}`)
    ref = referencia(suscripcion.external_reference)
    await guardarSuscripcion(suscripcion)
  } else {
    ref = referencia(pago.external_reference)
    // Pago único: tiene que ser el monto del plan (las preferencias viejas con otro precio no acreditan solas)
    if (ref && (pago.currency_id !== 'ARS' || Number(pago.transaction_amount) < PRECIOS[ref.tipo])) {
      console.warn('[mp webhook] monto menor al del plan', paymentId, pago.transaction_amount, ref.tipo)
      return
    }
  }
  if (!ref) return

  const { error } = await createServiceClient().rpc('acreditar_plan10', {
    p_payment_id: String(pago.id),
    p_usuario: ref.usuarioId,
    p_tipo: ref.tipo,
    p_monto: pago.transaction_amount,
  })
  if (error) throw error
}

// Mercado Pago avisa por pagos y por suscripciones. No se confía en el aviso: se vuelve a pedir
// todo a la API con nuestro token, así un aviso inventado no acredita nada.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const q = req.nextUrl.searchParams
  // Webhooks manda { type, data: { id } }; el aviso viejo (IPN) manda ?topic=...&id=...
  const tipo = body?.type ?? q.get('type') ?? q.get('topic')
  const id = String(body?.data?.id ?? q.get('data.id') ?? q.get('id') ?? '')
  if (!id) return NextResponse.json({ ok: true })

  try {
    if (tipo === 'payment') {
      await procesarPago(id)
    } else if (tipo === 'subscription_authorized_payment') {
      // Cobro mensual del débito: se acredita por el pago que generó
      const cobro = await mp(`/authorized_payments/${id}`)
      if (cobro.payment?.id) await procesarPago(String(cobro.payment.id))
    } else if (tipo === 'subscription_preapproval') {
      await guardarSuscripcion(await mp(`/preapproval/${id}`))
    }
  } catch (e) {
    console.error('[mp webhook]', tipo, id, e)
    // Con error, Mercado Pago reintenta el aviso más tarde
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

// MP también hace GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true })
}
