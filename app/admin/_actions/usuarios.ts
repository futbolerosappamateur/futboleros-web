'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { clienteAdmin } from '@/lib/supabase/admin'

export type UsuarioAdmin = {
  id: string
  nombre: string | null
  apodo: string | null
  username: string | null
  avatar_url: string | null
  es_pro: boolean | null
  plan_vence: string | null
  is_admin: boolean | null
  acceso_panel: boolean | null
  creado_en: string | null
  email: string | null
}

export type Resultado = { ok: true } | { ok: false; error: string }

const CAMPOS = 'id, nombre, apodo, username, avatar_url, es_pro, plan_vence, is_admin, acceso_panel, creado_en'

// Lo que se escribe va adentro de un filtro de PostgREST: sin comas, paréntesis ni comodines
const limpiar = (texto: string) => texto.replace(/[,()%*\\]/g, ' ').trim()

// Sin texto, los últimos que se registraron. Con texto, por nombre, apodo o usuario; con @, por mail
// (el mail está en las cuentas, no en perfiles)
export async function buscarUsuarios(texto: string): Promise<UsuarioAdmin[]> {
  const supabase = await clienteAdmin()
  const q = limpiar(texto)
  let consulta = supabase.from('perfiles').select(CAMPOS)
  if (q.includes('@')) {
    // Se recorren las primeras 1000 cuentas: alcanza de sobra por ahora
    const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const ids = (data?.users ?? [])
      .filter(u => u.email?.toLowerCase().includes(q.toLowerCase()))
      .map(u => u.id)
      .slice(0, 20)
    if (!ids.length) return []
    consulta = consulta.in('id', ids)
  } else if (q.length >= 2) {
    consulta = consulta.or(`nombre.ilike.%${q}%,apodo.ilike.%${q}%,username.ilike.%${q}%`)
  }
  const { data } = await consulta.order('creado_en', { ascending: false, nullsFirst: false }).limit(20)
  const perfiles = (data ?? []) as Omit<UsuarioAdmin, 'email'>[]
  return Promise.all(perfiles.map(async p => {
    const { data: cuenta } = await supabase.auth.admin.getUserById(p.id)
    return { ...p, email: cuenta.user?.email ?? null }
  }))
}

// Plan 10 a mano, como en el panel de la app: sin vencimiento (el cron vencer-plan10 solo mira plan_vence)
export async function cambiarPlan10(id: string, darlo: boolean): Promise<Resultado> {
  const supabase = await clienteAdmin()
  const { error } = await supabase.from('perfiles').update({ es_pro: darlo }).eq('id', id)
  return error ? { ok: false, error: error.message } : { ok: true }
}

// ── Borrar una cuenta: lo mismo que supabase/functions/eliminar-cuenta de la app (si se cambia uno, cambiar
// el otro). El panel de la app borraba solo el perfil y la cuenta podía volver a entrar, vacía ──

// Fotos de perfil (app y web) y figuritas IA; los nombres llevan el id. Las de grupos y los escudos no se tocan
const ARCHIVOS_DEL_USUARIO = [
  { bucket: 'avatares', prefijo: (uid: string) => `perfil_${uid}_` },
  { bucket: 'figuritas', prefijo: (uid: string) => `figurita_${uid}_` },
]

// En orden: primero lo que depende del perfil. pagos_plan10 queda (sin el perfil ya no dice de quién es)
const DATOS_DEL_USUARIO: [tabla: string, columna: string][] = [
  ['testimonios', 'autor_id'],
  ['testimonios', 'destinatario_id'],
  ['notificaciones', 'usuario_id'],
  ['figuritas_generadas', 'user_id'],
  ['estadisticas', 'usuario_id'],
  ['ratings', 'usuario_id'],
  ['stats_grupo', 'usuario_id'],
  ['convocatorias', 'usuario_id'],
  ['mensajes', 'sender_id'],
  ['conversaciones', 'usuario1_id'],
  ['conversaciones', 'usuario2_id'],
  ['grupo_jugadores', 'usuario_id'],
  ['suscripciones_plan10', 'usuario_id'],
  ['pago_codigos', 'usuario_id'],
  ['perfiles', 'id'],
]

async function borrarArchivos(supabase: SupabaseClient, uid: string) {
  for (const { bucket, prefijo } of ARCHIVOS_DEL_USUARIO) {
    const p = prefijo(uid)
    // De a 100: cada vuelta lista lo que queda. Tope por si algo no se borra
    for (let vuelta = 0; vuelta < 100; vuelta++) {
      const { data, error } = await supabase.storage.from(bucket).list('', { search: p, limit: 100 })
      if (error) throw error
      const nombres = (data ?? []).map(f => f.name).filter(n => n.startsWith(p))
      if (!nombres.length) break
      const { error: errorBorrar } = await supabase.storage.from(bucket).remove(nombres)
      if (errorBorrar) throw errorBorrar
    }
  }
}

// Débito automático del Plan 10: si queda activo, Mercado Pago le sigue cobrando a una cuenta que ya no existe
async function darDeBajaDebito(supabase: SupabaseClient, uid: string) {
  const { data: suscripcion, error } = await supabase
    .from('suscripciones_plan10').select('mp_preapproval_id, estado').eq('usuario_id', uid).maybeSingle()
  if (error) throw error
  if (!suscripcion || suscripcion.estado === 'cancelled') return

  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('Tiene débito automático del Plan 10 y falta MP_ACCESS_TOKEN para darlo de baja. No se borró nada.')
  const url = `https://api.mercadopago.com/preapproval/${suscripcion.mp_preapproval_id}`
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // Pudo darse de baja desde Mercado Pago sin que llegara el aviso
  const actual = await fetch(url, { headers })
  if (actual.status === 404) return
  if (!actual.ok) throw new Error(`Mercado Pago respondió ${actual.status} al leer el débito automático. No se borró nada.`)
  if ((await actual.json()).status === 'cancelled') return

  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ status: 'cancelled' }) })
  if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status} al dar de baja el débito automático. No se borró nada.`)
}

export async function eliminarUsuario(id: string): Promise<Resultado> {
  const supabase = await clienteAdmin()
  // Las dos cuentas de administración no se borran desde acá
  const { data: perfil, error: errorPerfil } = await supabase.from('perfiles').select('is_admin, acceso_panel').eq('id', id).maybeSingle()
  // Si no se pudo leer, no se borra: podría ser una cuenta del panel
  if (errorPerfil) return { ok: false, error: 'No se pudo revisar la cuenta. Probá de nuevo.' }
  if (perfil?.is_admin || perfil?.acceso_panel) return { ok: false, error: 'Las cuentas con acceso al panel no se borran desde acá.' }
  try {
    // Primero el débito y los archivos: si algo falla, todavía no se borró nada y se puede reintentar
    await darDeBajaDebito(supabase, id)
    await borrarArchivos(supabase, id)
    for (const [tabla, columna] of DATOS_DEL_USUARIO) await supabase.from(tabla).delete().eq(columna, id)
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error && error.status !== 404) throw error
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo borrar la cuenta.' }
  }
}
