'use server'

import { randomInt } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { PREFIJO_SOLICITUD, TITULO_SOLICITUD, type TipoSolicitud } from '@/lib/solicitudes'

export type ResultadoSolicitud = { codigo: string } | { error: string }

type Service = ReturnType<typeof createServiceClient>

// Sin 0/O ni 1/I, para que se pueda dictar sin confusiones
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function nuevoCodigo(tipo: TipoSolicitud) {
  let codigo = ''
  for (let i = 0; i < 6; i++) codigo += LETRAS[randomInt(LETRAS.length)]
  return `${PREFIJO_SOLICITUD[tipo]}-${codigo}`
}

// Pedido de los botones de arrepentimiento y de baja. No pide cuenta (la norma no deja exigir registrarse) y lo
// guarda el servidor, porque la tabla no tiene políticas. Se atiende a mano desde /admin/solicitudes
export async function enviarSolicitud(tipo: TipoSolicitud, formData: FormData): Promise<ResultadoSolicitud> {
  if (tipo !== 'arrepentimiento' && tipo !== 'baja') return { error: 'Pedido no válido.' }
  const nombre = String(formData.get('nombre') ?? '').trim().slice(0, 120)
  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200)
  const detalle = String(formData.get('detalle') ?? '').trim().slice(0, 2000) || null
  if (!nombre) return { error: 'Escribí tu nombre y apellido.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Escribí un email válido.' }

  const service = createServiceClient()

  // Freno a los envíos repetidos: hasta 3 pedidos por email en un día
  const { count } = await service
    .from('solicitudes_consumidor')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('creado_en', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  if ((count ?? 0) >= 3) return { error: 'Ya recibimos tus pedidos de hoy: te vamos a escribir a ese email.' }

  const { data: usuarioId } = await service.rpc('usuario_por_email', { p_email: email })

  // El código es único: si justo sale uno repetido (23505), se prueba con otro
  for (let intento = 0; intento < 3; intento++) {
    const codigo = nuevoCodigo(tipo)
    const { error } = await service.from('solicitudes_consumidor').insert({
      codigo,
      tipo,
      nombre,
      email,
      detalle,
      usuario_id: usuarioId ?? null,
    })
    if (!error) {
      await avisarAdmins(service, tipo, codigo, nombre, email)
      return { codigo }
    }
    if (error.code !== '23505') {
      console.error('[solicitud]', error)
      break
    }
  }
  return { error: 'No se pudo registrar el pedido. Probá de nuevo o escribinos a contacto@futboleros.com.ar.' }
}

// Aviso a las cuentas del panel: la fila en notificaciones, y el push al celular lo manda la base al guardarla
// (trigger push_de_notificacion). Si falla, el pedido igual quedó guardado
async function avisarAdmins(service: Service, tipo: TipoSolicitud, codigo: string, nombre: string, email: string) {
  const { data: admins } = await service.from('perfiles').select('id').or('is_admin.eq.true,acceso_panel.eq.true')
  if (!admins?.length) return
  const { error } = await service.from('notificaciones').insert(admins.map(a => ({
    usuario_id: a.id,
    tipo: 'solicitud_consumidor',
    titulo: `${TITULO_SOLICITUD[tipo]}: ${codigo}`,
    mensaje: `${nombre} (${email}). Atendelo desde futboleros.com.ar/admin/solicitudes`,
    datos: { codigo },
  })))
  if (error) console.error('[solicitud aviso]', error)
}
