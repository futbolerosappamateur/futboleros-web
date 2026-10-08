import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import styles from './BloquePublicidad.module.css'

interface Props {
  slot: string
  esPro?: boolean
  className?: string   // clase extra para el elemento de afuera (el perfil la usa para estirarlo)
}

export default async function BloquePublicidad({ slot, esPro = false, className }: Props) {
  const supabase = createServiceClient()
  const planField = esPro ? 'para_plan10' : 'para_free'

  const { data } = await supabase
    .from('publicidades')
    .select('id, imagen_url, url_destino, titulo')
    .eq('slot', slot)
    .eq('activa', true)
    .eq(planField, true)
    .order('orden')
    .limit(1)

  const pub = data?.[0]
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={pub.imagen_url}
        alt={pub.titulo ?? 'Publicidad'}
        className={styles.imagen}
      />
    </aside>
  )

  if (conEnlace) {
    return (
      <a href={pub.url_destino} target="_blank" rel="noopener noreferrer" className={`${styles.enlace}${extra}`}>
        {inner}
      </a>
    )
  }

  return inner
}
