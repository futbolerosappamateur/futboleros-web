import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { armarAvisos } from '@/lib/notificaciones-servidor'

// Lo que muestra la campanita al abrirse: los últimos 5 avisos de la web (los mismos que encabezan
// /notificaciones) y cuántos testimonios esperan respuesta. Con la sesión del usuario
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })

  const { avisos, pendientes } = await armarAvisos(supabase, user.id, 5)
  return NextResponse.json(
    { avisos, testimonios: pendientes.length },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
