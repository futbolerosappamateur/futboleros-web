import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import RecordarAviso from './RecordarAviso'
import styles from './BloquePublicidad.module.css'

interface Props {
  slot: string
  esPro?: boolean
  className?: string   // clase extra para el elemento de afuera (el perfil la usa para estirarlo)
}

export default async function BloquePublicidad({ slot, esPro = false, className }: Props) {
  const supabase = createServiceClient()
  const planField = esPro ? 'para_plan10' : 'para_free'

  // Con * no falla si todavía no se corrió publicidades_mobile.sql (la versión para celular es opcional)
  const { data } = await supabase
    .from('publicidades')
    .select('*')
    .eq('slot', slot)
    .eq('activa', true)
    .eq(planField, true)
    .order('orden')
    .order('creado_en')

  // Si hay varias en el mismo lugar se turnan: en cada carga va la que sigue a la que vio la vez anterior
  // (RecordarAviso la anota en una cookie). La primera vez, una al azar, así ninguna sale siempre primera
  const avisos = (data ?? []) as { id: string; imagen_url: string; imagen_mobile_url?: string | null; url_destino: string | null; titulo: string | null }[]
  const vista = (await cookies()).get(`aviso_${slot}`)?.value
  const anterior = avisos.findIndex(a => a.id === vista)
  const pub = avisos.length > 0
    ? avisos[anterior >= 0 ? (anterior + 1) % avisos.length : Math.floor(Math.random() * avisos.length)]
    : undefined
  const extra = className ? ` ${className}` : ''

  if (!pub) {
    return (
      <aside className={`${styles.bloque}${extra}`} aria-label="Publicidad">
        <span className={styles.etiqueta}>Publicidad</span>
        <p className={styles.titulo}>Tu marca en Futboleros</p>
        <p className={styles.texto}>Llegá a los jugadores de fútbol amateur de todo el país.</p>
        <Link href="/contacto" className={styles.boton}>Quiero publicitar</Link>
      </aside>
    )
  }

  const conEnlace = !!pub.url_destino
  const inner = (
    <aside className={`${styles.bloque} ${styles.bloqueImagen}${conEnlace ? '' : extra}`} aria-label="Publicidad">
      <span className={styles.etiqueta}>Publicidad</span>
      {/* En el celular va la versión para celular si la cargaron; si no, la ancha entera */}
      <picture className={styles.picture}>
        {pub.imagen_mobile_url && <source media="(max-width: 640px)" srcSet={pub.imagen_mobile_url} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pub.imagen_url}
          alt={pub.titulo ?? 'Publicidad'}
          className={styles.imagen}
        />
      </picture>
      <RecordarAviso slot={slot} id={pub.id} />
    </aside>
  )

  if (conEnlace) {
    return (
      <a href={pub.url_destino ?? undefined} target="_blank" rel="noopener noreferrer" className={`${styles.enlace}${extra}`}>
        {inner}
      </a>
    )
  }

  return inner
}
