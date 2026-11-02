import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { coloresClub } from '@/lib/colores-clubes'
import { fechaDeHoy } from './motor'
import Juego from './Juego'

export const metadata: Metadata = {
  title: 'Gambeta',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { themeColor: '#070504' }

// Prototipo del juego diario. En desarrollo lo ve cualquiera; publicado, solo las cuentas del panel
// (todavía no está atado al Plan 10 ni al límite de una vida por día)
export default async function JuegoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: perfil } = user
    ? await supabase.from('perfiles').select('hincha_de, is_admin, acceso_panel').eq('id', user.id).maybeSingle()
    : { data: null }

  if (process.env.NODE_ENV === 'production' && !perfil?.is_admin && !perfil?.acceso_panel) notFound()

  // El jugador sale con los colores de su club; sin club, con la camiseta dorada de Futboleros
  const colores = perfil?.hincha_de ? coloresClub(perfil.hincha_de) : null

  return <Juego colores={colores} fecha={fechaDeHoy()} />
}
