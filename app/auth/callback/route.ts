import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Vuelta del ingreso con Google: crea la sesión y, como hace la app, el perfil la primera vez
export async function GET(request: NextRequest) {
  // Detrás del hosting, request.url puede traer el host interno: se usa la URL pública del sitio
  const base = process.env.NEXT_PUBLIC_URL || request.nextUrl.origin
  const code = request.nextUrl.searchParams.get('code')
  const pedido = request.nextUrl.searchParams.get('next') ?? '/'
  const next = /^\/(?![/\\])/.test(pedido) ? pedido : '/'   // solo rutas internas

  if (!code) return NextResponse.redirect(`${base}/login?error=google`)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return NextResponse.redirect(`${base}/login?error=google`)

  const user = data.user
  const nombreGoogle: string = user.user_metadata?.full_name || user.user_metadata?.name || ''
  const avatarGoogle: string | null = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

  const { data: perfil } = await supabase
    .from('perfiles').select('nombre, avatar_url').eq('id', user.id).maybeSingle()

  if (!perfil) {
    await supabase.from('perfiles').insert({
      id: user.id,
      nombre: nombreGoogle,
      avatar_url: avatarGoogle,
      siguiendo: [],
      disponible_invitaciones: true,
    })
    // Primera vez: a completar el perfil, igual que en la app
    return NextResponse.redirect(`${base}/editar-perfil`)
  }

  if (!perfil.nombre?.trim() && nombreGoogle) {
    await supabase.from('perfiles').update({
      nombre: nombreGoogle,
      ...(!perfil.avatar_url && avatarGoogle ? { avatar_url: avatarGoogle } : {}),
    }).eq('id', user.id)
  }

  return NextResponse.redirect(`${base}${next}`)
}
