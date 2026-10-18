import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Vistas y clics de las publicidades: los manda MarcoAviso desde el navegador. La dirección no dice
// "publicidades" porque los bloqueadores de anuncios la cortarían (por lo mismo el bucket es "marcas")
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ROBOT = /bot|crawl|spider|slurp|headless|lighthouse|preview/i

export async function POST(req: Request) {
  const { id, tipo } = await req.json().catch(() => ({}))
  if (typeof id !== 'string' || !UUID.test(id) || (tipo !== 'vista' && tipo !== 'clic')) {
    return NextResponse.json({ error: 'Pedido no válido' }, { status: 400 })
  }

  // La web local usa la misma base que la publicada: ahí no se cuenta. Los robots tampoco
  const agente = req.headers.get('user-agent') ?? ''
  if (process.env.NODE_ENV === 'production' && agente && !ROBOT.test(agente)) {
    await createServiceClient().rpc('contar_publicidad', { p_id: id, p_tipo: tipo })
  }
  return new NextResponse(null, { status: 204 })
}
