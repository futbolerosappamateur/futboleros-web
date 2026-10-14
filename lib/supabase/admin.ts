import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Cliente con service role para las acciones del panel, solo si quien llama es admin (is_admin o
// acceso_panel, lo mismo que pide el layout de /admin). El layout no alcanza: una server action
// se puede llamar directo, sin pasar por la página.
export async function clienteAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('is_admin, acceso_panel')
    .eq('id', user.id)
    .maybeSingle()
  if (!perfil?.is_admin && !perfil?.acceso_panel) throw new Error('No autorizado')
  return createServiceClient()
}
