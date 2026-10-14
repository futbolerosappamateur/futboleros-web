import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { mp, pagadorDe } from '@/lib/plan10-servidor'

// Baja del débito automático: no se cobra más y el Plan 10 sigue hasta que vence lo pagado
export async function POST(req: NextRequest) {
  const { c } = await req.json().catch(() => ({}))
  const pagador = await pagadorDe(c)
  if (!pagador) {
    return NextResponse.json({ error: 'El link venció. Volvé a abrirlo desde la app o entrá a la web.' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: suscripcion } = await service
    .from('suscripciones_plan10').select('mp_preapproval_id, estado').eq('usuario_id', pagador.id).maybeSingle()
  if (!suscripcion || suscripcion.estado === 'cancelled') {
    return NextResponse.json({ error: 'No tenés un débito automático activo.' }, { status: 400 })
  }

  try {
    await mp(`/preapproval/${suscripcion.mp_preapproval_id}`, { method: 'PUT', body: { status: 'cancelled' } })
  } catch (e) {
    console.error('[mp cancelar]', e)
    return NextResponse.json({ error: 'Mercado Pago no respondió. Probá de nuevo en un rato.' }, { status: 502 })
  }

  await service
    .from('suscripciones_plan10')
    .update({ estado: 'cancelled', actualizado: new Date().toISOString() })
    .eq('usuario_id', pagador.id)
  return NextResponse.json({ ok: true })
}
