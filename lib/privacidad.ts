import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// Los perfiles privados solo los ven los usuarios con cuenta (términos 4.1 y privacidad 10).
// Lee la sesión: la página que lo usa se arma en cada visita. Con cache, metadata y página comparten la consulta.
export const hayUsuario = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
})

// Quien entra sin cuenta solo ve los perfiles que el jugador hizo públicos desde Editar perfil
export const perfilVisible = (perfil: { perfil_publico?: boolean | null }, logueado: boolean) =>
  logueado || !!perfil.perfil_publico
