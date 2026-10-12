import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Aviso al otro jugador cuando se manda un mensaje desde la web: la misma fila en notificaciones
// y el mismo push de Expo que crearNotificacion de la app. Va por el servidor porque exp.host
// no acepta pedidos desde el navegador.
export async function POST(req: Request) {
  const { mensajeId } = await req.json().catch(() => ({}))
  if (!mensajeId) return NextResponse.json({ error: 'Falta el mensaje' }, { status: 400 })

  // Con la sesión del usuario: mismos permisos que la app
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })

  // Solo se avisa de un mensaje propio y recién enviado (que no sirva para mandar avisos repetidos)
  const { data: mensaje } = await supabase
    .from('mensajes')
    .select('conversacion_id, sender_id, texto, creado_en')
    .eq('id', mensajeId)
    .maybeSingle()
  const reciente = mensaje && Date.now() - new Date(mensaje.creado_en).getTime() < 2 * 60 * 1000
  if (!mensaje || mensaje.sender_id !== user.id || !reciente) {
    return NextResponse.json({ error: 'Mensaje no válido' }, { status: 400 })
  }

  const { data: conv } = await supabase
    .from('conversaciones')
    .select('usuario1_id, usuario2_id')
    .eq('id', mensaje.conversacion_id)
    .maybeSingle()
  if (!conv) return NextResponse.json({ error: 'Conversación no válida' }, { status: 400 })
  const destinatario = conv.usuario1_id === user.id ? conv.usuario2_id : conv.usuario1_id

  const [{ data: yo }, { data: otro }] = await Promise.all([
    supabase.from('perfiles').select('nombre').eq('id', user.id).maybeSingle(),
    supabase.from('perfiles').select('expo_push_token').eq('id', destinatario).maybeSingle(),
  ])
  const titulo = yo?.nombre || 'Mensaje nuevo'
  const datos = { tipo: 'chat', id: user.id }

  await supabase.from('notificaciones').insert({
    usuario_id: destinatario,
    tipo: 'chat',
    titulo,
    mensaje: mensaje.texto,
    datos,
  })

  if (otro?.expo_push_token) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: otro.expo_push_token,
        title: titulo,
        body: mensaje.texto,
        data: datos,
        sound: 'default',
        channelId: 'default',
        color: '#0c4344',
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
