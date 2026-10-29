import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { SITE_URL } from '@/lib/sitio'

export const BASE_URL = process.env.NEXT_PUBLIC_URL || SITE_URL

// API de Mercado Pago con el token de la cuenta; si responde con error, tira el mensaje de MP
export async function mp(
  path: string,
  opciones?: { method?: string; body?: unknown; headers?: Record<string, string> },
): Promise<any> {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    method: opciones?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...opciones?.headers,
    },
    body: opciones?.body ? JSON.stringify(opciones.body) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Mercado Pago ${res.status} en ${path}: ${data?.message ?? ''}`)
  return data
}

export type Pagador = { id: string; email: string | null }

// Quién paga: el código con el que la app abrió /pagar (vale 30 minutos) o, si no hay, la sesión de la web
export async function pagadorDe(codigo: unknown): Promise<Pagador | null> {
  if (typeof codigo === 'string' && codigo) {
    const service = createServiceClient()
    const { data } = await service
      .from('pago_codigos').select('usuario_id, expira').eq('codigo', codigo).maybeSingle()
    if (!data || new Date(data.expira) < new Date()) return null
    const { data: { user } } = await service.auth.admin.getUserById(data.usuario_id)
    return user ? { id: user.id, email: user.email ?? null } : null
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? { id: user.id, email: user.email ?? null } : null
}
