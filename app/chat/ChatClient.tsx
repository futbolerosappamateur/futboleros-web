'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EVENTO_CHAT_LEIDO } from '@/lib/chat'
import styles from './chat.module.css'

// Mismas tablas que el chat de la app: conversaciones (una por par de jugadores) y mensajes

type Id = number | string

type Contacto = {
  id: string
  nombre: string | null
  apodo: string | null
  username: string | null
  avatar_url: string | null
  es_pro: boolean | null
}

type Conversacion = {
  id: Id
  usuario1_id: string
  usuario2_id: string
  ultimo_mensaje: string | null
  ultimo_mensaje_at: string | null
  contacto: Contacto | null
  noLeidos: number
}

type Mensaje = {
  id: Id
  conversacion_id: Id
  sender_id: string
  texto: string
  creado_en: string
  leido: boolean
}

const CAMPOS_CONTACTO = 'id, nombre, apodo, username, avatar_url, es_pro'

const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const hora = (fecha: string) =>
  new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

// Separador entre días de la conversación: Hoy, Ayer o la fecha corta
function fechaSeparador(fecha: string) {
  const d = new Date(fecha)
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  if (mismoDia(d, hoy)) return 'Hoy'
  if (mismoDia(d, ayer)) return 'Ayer'
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Momento del último mensaje en la lista, como en la app: la hora, "hace Nd" o la fecha
function tiempoLista(fecha: string | null) {
  if (!fecha) return ''
  const diff = Date.now() - new Date(fecha).getTime()
  if (diff < 86400000) return hora(fecha)
  const dias = Math.floor(diff / 86400000)
  return dias < 7 ? `hace ${dias}d` : new Date(fecha).toLocaleDateString('es-AR')
}

function Avatar({ contacto, tam }: { contacto: Contacto | null; tam: number }) {
  if (contacto?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={contacto.avatar_url} alt="" className={styles.avatar} style={{ width: tam, height: tam }} />
  }
  return (
    <span className={styles.avatarPh} style={{ width: tam, height: tam, fontSize: tam * 0.42 }}>
      {contacto?.nombre?.charAt(0)?.toUpperCase() ?? '?'}
    </span>
  )
}

function Nombre({ contacto }: { contacto: Contacto | null }) {
  return (
    <>
      {contacto?.nombre || 'Jugador'}
      {contacto?.es_pro && <img src="/ic-10.webp" alt="Plan 10" className={styles.plan10} />}
    </>
  )
}

export default function ChatClient({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  // El chat abierto va en la dirección (/chat?con=<id del jugador>): el botón atrás vuelve a la lista
  const conId = useSearchParams().get('con')

  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [cargandoLista, setCargandoLista] = useState(true)
  const [permitidos, setPermitidos] = useState<Set<string>>(new Set())
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<Contacto[]>([])
  const [buscando, setBuscando] = useState(false)
  const busquedaRef = useRef('')

  const [contacto, setContacto] = useState<Contacto | null>(null)
  const [convId, setConvId] = useState<Id | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargandoMensajes, setCargandoMensajes] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aEliminar, setAEliminar] = useState<Conversacion | null>(null)
  const mensajesRef = useRef<Mensaje[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { mensajesRef.current = mensajes }, [mensajes])

  const cargarConversaciones = async () => {
    const { data: convs } = await supabase
      .from('conversaciones')
      .select('*')
      .or(`usuario1_id.eq.${userId},usuario2_id.eq.${userId}`)
      .order('ultimo_mensaje_at', { ascending: false, nullsFirst: false })
    if (!convs?.length) {
      setConversaciones([])
      setCargandoLista(false)
      return
    }
    const otroDe = (c: Conversacion) => (c.usuario1_id === userId ? c.usuario2_id : c.usuario1_id)
    const [{ data: perfiles }, { data: sinLeer }] = await Promise.all([
      supabase.from('perfiles').select(CAMPOS_CONTACTO).in('id', convs.map(otroDe)),
      supabase
        .from('mensajes')
        .select('conversacion_id')
        .in('conversacion_id', convs.map(c => c.id))
        .eq('leido', false)
        .neq('sender_id', userId),
    ])
    const noLeidos = new Map<Id, number>()
    sinLeer?.forEach(m => noLeidos.set(m.conversacion_id, (noLeidos.get(m.conversacion_id) ?? 0) + 1))
    setConversaciones(convs.map(c => ({
      ...c,
      contacto: (perfiles as Contacto[] | null)?.find(p => p.id === otroDe(c)) ?? null,
      noLeidos: noLeidos.get(c.id) ?? 0,
    })))
    setCargandoLista(false)
  }

  const marcarLeidos = async (id: Id) => {
    await supabase
      .from('mensajes')
      .update({ leido: true })
      .eq('conversacion_id', id)
      .neq('sender_id', userId)
      .eq('leido', false)
    setConversaciones(prev => prev.map(c => (c.id === id ? { ...c, noLeidos: 0 } : c)))
    window.dispatchEvent(new Event(EVENTO_CHAT_LEIDO))
  }

  // Lista: al entrar y cada 15 s, para ver los mensajes nuevos de los otros chats
  useEffect(() => {
    cargarConversaciones()
    const intervalo = setInterval(cargarConversaciones, 15000)
    return () => clearInterval(intervalo)
  }, [])

  // Con quién se puede empezar un chat desde el buscador, como en la app: seguidores mutuos y compañeros de grupo
  useEffect(() => {
    const cargarPermitidos = async () => {
      const ids = new Set<string>()
      const { data: yo } = await supabase.from('perfiles').select('siguiendo').eq('id', userId).maybeSingle()
      const siguiendo = ((yo?.siguiendo ?? []) as string[]).filter(Boolean)
      if (siguiendo.length) {
        const { data: mutuos } = await supabase
          .from('perfiles')
          .select('id')
          .in('id', siguiendo)
          .contains('siguiendo', [userId])
        mutuos?.forEach(m => ids.add(m.id))
      }
      const { data: grupos } = await supabase
        .from('grupo_jugadores')
        .select('grupo_id')
        .eq('usuario_id', userId)
        .eq('activo', true)
        .eq('estado', 'aceptado')
      if (grupos?.length) {
        const { data: companeros } = await supabase
          .from('grupo_jugadores')
          .select('usuario_id')
          .in('grupo_id', grupos.map(g => g.grupo_id))
          .eq('activo', true)
          .eq('estado', 'aceptado')
          .neq('usuario_id', userId)
        companeros?.forEach(c => ids.add(c.usuario_id))
      }
      setPermitidos(ids)
    }
    cargarPermitidos()
  }, [])

  // Abrir el chat con el jugador de la dirección
  useEffect(() => {
    setMensajes([])
    setConvId(null)
    setError(null)
    if (!conId) {
      setContacto(null)
      return
    }
    let vigente = true
    const abrir = async () => {
      setCargandoMensajes(true)
      try {
        const { data: perfil } = await supabase.from('perfiles').select(CAMPOS_CONTACTO).eq('id', conId).maybeSingle()
        if (!vigente) return
        if (!perfil || perfil.id === userId) {
          router.replace('/chat', { scroll: false })
          return
        }
        setContacto(perfil as Contacto)

        // La misma conversación que usa la app; si todavía no existe se crea, como al abrir un chat en la app
        const { data: existente } = await supabase
          .from('conversaciones')
          .select('id')
          .or(`and(usuario1_id.eq.${userId},usuario2_id.eq.${conId}),and(usuario1_id.eq.${conId},usuario2_id.eq.${userId})`)
          .limit(1)
          .maybeSingle()
        let id: Id | undefined = existente?.id
        if (!id) {
          const { data: nueva } = await supabase
            .from('conversaciones')
            .insert({ usuario1_id: userId, usuario2_id: conId })
            .select('id')
            .single()
          id = nueva?.id
          if (id) cargarConversaciones()
        }
        if (!vigente) return
        if (!id) {
          setError('No se pudo abrir el chat.')
          return
        }

        // Los últimos 300 mensajes alcanzan para la charla; los más viejos siguen en la app
        const { data: ultimos } = await supabase
          .from('mensajes')
          .select('*')
          .eq('conversacion_id', id)
          .order('creado_en', { ascending: false })
          .limit(300)
        if (!vigente) return
        setConvId(id)
        setMensajes(((ultimos ?? []) as Mensaje[]).reverse())
        marcarLeidos(id)
      } finally {
        if (vigente) setCargandoMensajes(false)
      }
    }
    abrir()
    return () => { vigente = false }
  }, [conId])

  // Mensajes nuevos del otro jugador: tiempo real y, de respaldo, una consulta cada 4 s (como la app)
  useEffect(() => {
    if (!convId) return
    const recibir = (nuevos: Mensaje[]) => {
      const vistos = new Set(mensajesRef.current.map(m => m.id))
      const sinRepetir = nuevos.filter(m => !vistos.has(m.id))
      if (!sinRepetir.length) return
      setMensajes(prev => [...prev, ...sinRepetir.filter(m => !prev.some(p => p.id === m.id))])
      const ultimo = sinRepetir[sinRepetir.length - 1]
      setConversaciones(prev => prev.map(c =>
        c.id === convId ? { ...c, ultimo_mensaje: ultimo.texto, ultimo_mensaje_at: ultimo.creado_en } : c))
      marcarLeidos(convId)
    }
    const canal = supabase
      .channel(`mensajes_web_${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `conversacion_id=eq.${convId}` },
        payload => {
          const m = payload.new as Mensaje
          if (m.sender_id !== userId) recibir([m])
        },
      )
      // El otro leyó un mensaje mío (desde la app o la web): pasa a doble tilde sin recargar la página
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mensajes', filter: `conversacion_id=eq.${convId}` },
        payload => {
          const m = payload.new as Mensaje
          if (m.sender_id === userId && m.leido) {
            setMensajes(prev => prev.map(x => (x.id === m.id ? { ...x, leido: true } : x)))
          }
        },
      )
      .subscribe()
    const intervalo = setInterval(async () => {
      // Respaldo de la conexión en vivo: mis mensajes que el otro ya leyó
      const misSinLeer = mensajesRef.current
        .filter(m => m.sender_id === userId && !m.leido && !String(m.id).startsWith('temp-'))
        .map(m => m.id)
      if (misSinLeer.length) {
        const { data: leidos } = await supabase.from('mensajes').select('id').in('id', misSinLeer).eq('leido', true)
        if (leidos?.length) {
          const ids = new Set(leidos.map(l => l.id))
          setMensajes(prev => prev.map(x => (ids.has(x.id) ? { ...x, leido: true } : x)))
        }
      }
      const ultimoReal = [...mensajesRef.current].reverse().find(m => !String(m.id).startsWith('temp-'))
      let consulta = supabase
        .from('mensajes')
        .select('*')
        .eq('conversacion_id', convId)
        .neq('sender_id', userId)
        .order('creado_en', { ascending: true })
      if (ultimoReal) consulta = consulta.gt('id', ultimoReal.id)
      const { data } = await consulta
      if (data?.length) recibir(data as Mensaje[])
    }, 4000)
    return () => {
      supabase.removeChannel(canal)
      clearInterval(intervalo)
    }
  }, [convId])

  // Siempre al último mensaje
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [mensajes, cargandoMensajes])

  const buscar = async (valor: string) => {
    setBusqueda(valor)
    const consulta = valor.trim()
    busquedaRef.current = consulta
    if (consulta.length < 3) {
      setResultados([])
      return
    }
    setBuscando(true)
    const { data } = await supabase
      .from('perfiles')
      .select(CAMPOS_CONTACTO)
      .ilike('nombre', `%${consulta}%`)
      .neq('id', userId)
      .limit(50)
    if (busquedaRef.current !== consulta) return   // ya escribió otra cosa
    setResultados(((data ?? []) as Contacto[]).filter(p => permitidos.has(p.id)))
    setBuscando(false)
  }

  const abrirChat = (id: string | undefined) => {
    if (!id) return
    setBusqueda('')
    setResultados([])
    busquedaRef.current = ''
    if (id !== conId) router.push(`/chat?con=${id}`, { scroll: false })
  }

  const enviar = async () => {
    const valor = texto.trim()
    if (!valor || !convId || enviando) return
    setEnviando(true)
    setTexto('')
    setError(null)
    const tempId = `temp-${Date.now()}`
    setMensajes(prev => [...prev, {
      id: tempId, conversacion_id: convId, sender_id: userId, texto: valor, creado_en: new Date().toISOString(), leido: false,
    }])
    try {
      const { data: real, error: errorEnvio } = await supabase
        .from('mensajes')
        .insert({ conversacion_id: convId, sender_id: userId, texto: valor })
        .select()
        .single()
      if (errorEnvio || !real) throw errorEnvio
      setMensajes(prev => prev.map(m => (m.id === tempId ? (real as Mensaje) : m)))
      await supabase
        .from('conversaciones')
        .update({ ultimo_mensaje: valor, ultimo_mensaje_at: real.creado_en })
        .eq('id', convId)
      setConversaciones(prev => {
        const actual = prev.find(c => c.id === convId)
        if (!actual) return prev
        return [{ ...actual, ultimo_mensaje: valor, ultimo_mensaje_at: real.creado_en }, ...prev.filter(c => c.id !== convId)]
      })
      // El aviso al otro jugador (notificación y push al celular) lo manda el servidor
      fetch('/api/chat/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensajeId: real.id }),
      }).catch(() => {})
    } catch {
      setMensajes(prev => prev.filter(m => m.id !== tempId))
      setTexto(valor)
      setError('No se pudo enviar el mensaje. Probá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  // Como en la app: borra la conversación y sus mensajes
  const eliminar = async () => {
    const conv = aEliminar
    setAEliminar(null)
    if (!conv) return
    const { error: errorMensajes } = await supabase.from('mensajes').delete().eq('conversacion_id', conv.id)
    const { error: errorConv } = errorMensajes
      ? { error: errorMensajes }
      : await supabase.from('conversaciones').delete().eq('id', conv.id)
    if (errorConv) {
      setError('No se pudo eliminar el chat.')
      return
    }
    setConversaciones(prev => prev.filter(c => c.id !== conv.id))
    window.dispatchEvent(new Event(EVENTO_CHAT_LEIDO))
    if (conv.contacto?.id === conId) router.push('/chat', { scroll: false })
  }

  const buscandoContactos = busqueda.trim().length >= 3

  return (
    <div className={`${styles.chat} ${conId ? styles.chatAbierto : ''}`}>
      {/* ── Lista de chats ── */}
      <aside className={styles.lista}>
        <div className={styles.buscador}>
          <span className={styles.lupa} />
          <input
            className={styles.buscadorInput}
            placeholder="Buscar contacto..."
            value={busqueda}
            onChange={e => buscar(e.target.value)}
          />
        </div>

        {buscandoContactos ? (
          buscando ? (
            <p className={styles.listaNota}>Buscando...</p>
          ) : resultados.length === 0 ? (
            <p className={styles.listaNota}>
              Sin resultados. Podés escribirles a los jugadores que se siguen con vos y a tus compañeros de grupo.
            </p>
          ) : (
            <ul className={styles.items}>
              {resultados.map(p => (
                <li key={p.id} className={styles.itemFila}>
                  <button type="button" className={styles.item} onClick={() => abrirChat(p.id)}>
                    <Avatar contacto={p} tam={44} />
                    <span className={styles.itemInfo}>
                      <span className={styles.itemNombre}><Nombre contacto={p} /></span>
                      {p.apodo && <span className={styles.itemApodo}>“{p.apodo}”</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : cargandoLista ? (
          <p className={styles.listaNota}>Cargando chats...</p>
        ) : conversaciones.length === 0 ? (
          <div className={styles.listaVacia}>
            <span className={styles.iconoVacio} />
            <p className={styles.vacioTitulo}>Sin mensajes todavía</p>
            <p className={styles.vacioTexto}>Buscá un contacto para empezar</p>
          </div>
        ) : (
          <ul className={styles.items}>
            {conversaciones.map(c => (
              <li key={c.id} className={`${styles.itemFila} ${c.contacto?.id === conId ? styles.itemActivo : ''}`}>
                <button type="button" className={styles.item} onClick={() => abrirChat(c.contacto?.id)}>
                  <Avatar contacto={c.contacto} tam={44} />
                  <span className={styles.itemInfo}>
                    <span className={styles.itemArriba}>
                      <span className={styles.itemNombre}><Nombre contacto={c.contacto} /></span>
                      <span className={styles.itemTiempo}>{tiempoLista(c.ultimo_mensaje_at)}</span>
                    </span>
                    <span className={styles.itemAbajo}>
                      <span className={styles.itemUltimo}>{c.ultimo_mensaje || 'Sin mensajes'}</span>
                      {c.noLeidos > 0 && <span className={styles.itemBadge}>{c.noLeidos}</span>}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.eliminar}
                  onClick={() => setAEliminar(c)}
                  aria-label={`Eliminar el chat con ${c.contacto?.nombre ?? 'este jugador'}`}
                  title="Eliminar chat"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9zm4 2v8h2v-8h-2zm4 0v8h2v-8h-2z" fill="currentColor" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ── Conversación ── */}
      <section className={styles.conversacion}>
        {!conId ? (
          <div className={styles.sinChat}>
            <span className={styles.iconoVacio} />
            <p className={styles.vacioTitulo}>Elegí un chat</p>
            <p className={styles.vacioTexto}>o buscá un contacto para empezar uno nuevo</p>
          </div>
        ) : (
          <>
            <header className={styles.convHeader}>
              <button
                type="button"
                className={styles.volver}
                onClick={() => router.push('/chat', { scroll: false })}
                aria-label="Volver a los chats"
              >
                <span className={styles.volverIcono} />
              </button>
              {contacto && (
                <>
                  <Avatar contacto={contacto} tam={40} />
                  <Link href={`/jugadores/${contacto.username ?? contacto.id}`} className={styles.convNombre}>
                    <span className={styles.convNombreTexto}><Nombre contacto={contacto} /></span>
                    {contacto.apodo && <span className={styles.convApodo}>“{contacto.apodo}”</span>}
                  </Link>
                </>
              )}
            </header>

            <div className={styles.mensajes} ref={scrollRef}>
              {cargandoMensajes ? (
                <p className={styles.mensajesNota}>Cargando mensajes...</p>
              ) : mensajes.length === 0 ? (
                <div className={styles.sinChat}>
                  <span className={styles.iconoVacio} />
                  <p className={styles.vacioTexto}>Empezá la charla</p>
                </div>
              ) : (
                mensajes.map((m, i) => {
                  const anterior = mensajes[i - 1]
                  const nuevoDia = !anterior || !mismoDia(new Date(anterior.creado_en), new Date(m.creado_en))
                  const mio = m.sender_id === userId
                  const seguido = !nuevoDia && anterior?.sender_id === m.sender_id
                  return (
                    <Fragment key={m.id}>
                      {nuevoDia && (
                        <div className={styles.separador}>
                          <span>{fechaSeparador(m.creado_en)}</span>
                        </div>
                      )}
                      <div className={`${styles.fila} ${mio ? styles.filaMia : ''} ${seguido ? styles.filaSeguida : ''}`}>
                        <div className={`${styles.burbuja} ${mio ? styles.burbujaMia : styles.burbujaOtro}`}>
                          <p className={styles.texto}>{m.texto}</p>
                          <span className={styles.meta}>
                            {hora(m.creado_en)}
                            {mio && <span className={m.leido ? styles.leido : undefined}>{m.leido ? '✓✓' : '✓'}</span>}
                          </span>
                        </div>
                      </div>
                    </Fragment>
                  )
                })
              )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <form className={styles.barra} onSubmit={e => { e.preventDefault(); enviar() }}>
              <textarea
                className={styles.input}
                placeholder="Escribí un mensaje..."
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => {
                  // Enter manda, Shift+Enter hace un salto de línea
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    enviar()
                  }
                }}
                rows={1}
                maxLength={500}
                disabled={!convId}
              />
              <button type="submit" className={styles.enviar} disabled={!texto.trim() || enviando || !convId} aria-label="Enviar">
                <span className={styles.enviarIcono} />
              </button>
            </form>
          </>
        )}
      </section>

      {aEliminar && (
        <div className={styles.modalFondo} onClick={() => setAEliminar(null)}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitulo}>Eliminar chat</h2>
            <p className={styles.modalTexto}>
              ¿Eliminar la conversación con {aEliminar.contacto?.nombre || 'este jugador'}? Se borra para los dos.
            </p>
            <div className={styles.modalBotones}>
              <button type="button" className={styles.btnCancelar} onClick={() => setAEliminar(null)}>Cancelar</button>
              <button type="button" className={styles.btnEliminar} onClick={eliminar}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
