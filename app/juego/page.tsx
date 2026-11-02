import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fechaDeHoy } from './motor'
import Juego from './Juego'

export const metadata: Metadata = {
  title: 'Gambeta',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { themeColor: '#0a1528' }

// Prototipo del juego diario con Don Fulbio. En desarrollo lo ve cualquiera; publicado, solo las cuentas
// del panel (todavía no está atado al Plan 10 ni al límite de una vida por día)
export default async function JuegoPage() {
  if (process.env.NODE_ENV === 'production') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: perfil } = user
      ? await supabase.from('perfiles').select('is_admin, acceso_panel').eq('id', user.id).maybeSingle()
      : { data: null }
    if (!perfil?.is_admin && !perfil?.acceso_panel) notFound()
  }

  return <Juego fecha={fechaDeHoy()} />
}
