import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import Filete from '../components/Filete'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getRutasGrupos } from '@/lib/grupos'
import { TIPOS_WEB } from '@/lib/notificaciones'
import { FONDO_PERFIL } from '@/lib/perfil-opciones'
import NotificacionesClient, { type Aviso, type Pendiente } from './NotificacionesClient'
import styles from './notificaciones.module.css'

export const metadata: Metadata = {
  title: 'Notificaciones',
  robots: { index: false },
}

type Fila = {
  id: number
  tipo: string
  titulo: string | null
  mensaje: string | null
  leida: boolean | null
  datos: Record<string, unknown> | null
  creado_en: string
}
type PerfilChico = { id: string; nombre: string | null; username: string | null; avatar_url: string | null }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Ícono de cada tipo: los mismos de la campanita de la app
const ICONO: Record<string, string> = {
  seguidor: '/ic-perfil.webp',
  testimonio: '/ic-testi2.webp',
  sorteo: '/ic-figura.webp',
  admin_mensaje: '/ic-noti.webp',
  solicitud_aceptada: '/ic-confirma.webp',
  solicitud_rechazada: '/ic-penale.webp',
  salida_grupo: '/ic-equipos.webp',
}

// "🏆 Ganaste el sorteo de octubre" → "Ganaste el sorteo de octubre": el ícono ya dice de qué es
const sinEmojiInicial = (t: string) => t.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '').trim() || t

const enArgentina = (d: Date, op: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', ...op })

// Hace cuánto llegó, como en la app (minutos, horas, días); de una semana para atrás, la fecha
function haceCuanto(ts: string) {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 60000))
  if (minutos < 1) return 'recién'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return dias === 1 ? 'hace 1 día' : `hace ${dias} días`
  const fecha = new Date(ts)
  const mismoAnio = enArgentina(fecha, { year: 'numeric' }) === enArgentina(new Date(), { year: 'numeric' })
  return enArgentina(fecha, { day: 'numeric', month: 'long', ...(mismoAnio ? {} : { year: 'numeric' }) })
}

export default async function Notificaciones() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/notificaciones')

  // Con la sesión del usuario, como la app: sus avisos (solo los de la web) y los testimonios que le dejaron
  const [{ data: filas }, { data: pendientesData }, { data: yo }] = await Promise.all([
    supabase
      .from('notificaciones')
      .select('id, tipo, titulo, mensaje, leida, datos, creado_en')
      .eq('usuario_id', user.id)
      .in('tipo', TIPOS_WEB)
      .order('creado_en', { ascending: false })
      .limit(50),
    supabase
      .from('testimonios')
      .select('id, autor_id, texto, creado_en')
      .eq('destinatario_id', user.id)
      .eq('estado', 'pendiente')
      .order('creado_en', { ascending: false }),
    supabase.from('perfiles').select('username, domicilio').eq('id', user.id).maybeSingle(),
  ])
  const avisosDb = (filas ?? []) as Fila[]
  const pendientesDb = (pendientesData ?? []) as { id: number; autor_id: string; texto: string; creado_en: string }[]

  // Nombre, foto y perfil de los seguidores y de quienes dejaron testimonios. Con service: las políticas de
  // perfiles solo dejan ver a los del mismo grupo, y con sesión en la web se ven todos los perfiles
  const ids = [...new Set([
    ...avisosDb.filter(a => a.tipo === 'seguidor').map(a => String(a.datos?.seguidor_id ?? '')),
    ...pendientesDb.map(t => t.autor_id),
  ])].filter(id => UUID_RE.test(id))
  const [{ data: perfilesData }, { porId: rutasGrupos }] = await Promise.all([
    ids.length
      ? createServiceClient().from('perfiles').select('id, nombre, username, avatar_url').in('id', ids)
      : Promise.resolve({ data: [] }),
    getRutasGrupos(),
  ])
  const perfiles = new Map(((perfilesData ?? []) as PerfilChico[]).map(p => [p.id, p]))
  const linkPerfil = (p: { id: string; username: string | null }) => `/jugadores/${p.username ?? p.id}`

  // A dónde lleva cada aviso, como en la app: al perfil del que te sigue, a los testimonios por aprobar, a
  // cargar el domicilio si ganaste un sorteo y no lo tenés, o a la página del grupo
  const avisos: Aviso[] = avisosDb.map(a => {
    const datos = a.datos ?? {}
    let href: string | undefined
    let foto: string | undefined
    if (a.tipo === 'seguidor') {
      const p = perfiles.get(String(datos.seguidor_id))
      if (p) {
        href = linkPerfil(p)
        foto = p.avatar_url ?? undefined
      }
    } else if (a.tipo === 'testimonio') {
      href = pendientesDb.length ? '#testimonios' : linkPerfil({ id: user.id, username: yo?.username ?? null })
    } else if (a.tipo === 'sorteo') {
      if (datos.falta_domicilio && !yo?.domicilio?.trim()) href = '/editar-perfil#domicilio'
    } else if (datos.grupo_id != null) {
      const ruta = rutasGrupos.get(Number(datos.grupo_id))?.ruta
      if (ruta) href = `/grupos/${ruta}`
    }
    return {
      id: a.id,
      tipo: a.tipo,
      titulo: sinEmojiInicial(a.titulo ?? ''),
      mensaje: a.mensaje ?? '',
      leida: !!a.leida,
      cuando: haceCuanto(a.creado_en),
      icono: ICONO[a.tipo] ?? '/ic-noti.webp',
      foto,
      href,
    }
  })

  const pendientes: Pendiente[] = pendientesDb.map(t => {
    const autor = perfiles.get(t.autor_id)
    return {
      id: t.id,
      texto: t.texto,
      fecha: enArgentina(new Date(t.creado_en), { day: 'numeric', month: 'long', year: 'numeric' }),
      autor: autor?.nombre?.trim() || 'Jugador',
      foto: autor?.avatar_url ?? undefined,
      href: autor ? linkPerfil(autor) : undefined,
    }
  })

  return (
    <>
      <Header />
      <main className={styles.page}>
        <ParallaxHero src={FONDO_PERFIL} className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.badge}>TU CUENTA</span>
            <h1 className={styles.title}>NOTIFICACIONES</h1>
            <p className={styles.subtitle}>Seguidores, testimonios, sorteos y grupos. Los avisos de los partidos siguen en la app.</p>
            <Filete />
          </div>
        </ParallaxHero>

        <div className={styles.body}>
          <NotificacionesClient userId={user.id} avisos={avisos} pendientes={pendientes} />
        </div>
      </main>
      <Footer />
    </>
  )
}
