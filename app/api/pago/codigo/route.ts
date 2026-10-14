import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { esTipoPlan } from '@/lib/plan10'
import { BASE_URL } from '@/lib/plan10-servidor'

// La app no comparte la sesión con el navegador: pide con su token un código y abre /pagar con él
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const service = createServiceClient()
  const { data: { user } } = await service.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { tipo } = await req.json().catch(() => ({}))
  const codigo = randomBytes(24).toString('base64url')
  const { error } = await service.from('pago_codigos').insert({ codigo, usuario_id: user.id })
  if (error) {
    console.error('[pago codigo]', error.message)
    return NextResponse.json({ error: 'No se pudo preparar el pago' }, { status: 500 })
  }

  const q = new URLSearchParams({ c: codigo })
  if (esTipoPlan(tipo)) q.set('tipo', tipo)
  return NextResponse.json({ url: `${BASE_URL}/pagar?${q}` })
}
