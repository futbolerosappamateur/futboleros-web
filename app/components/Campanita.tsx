'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { EVENTO_NOTIF_LEIDAS, type Aviso } from '@/lib/notificaciones'
import { marcarLeida, marcarTodas, yaLeida } from '@/lib/notificaciones-cliente'
import styles from './Campanita.module.css'

// Campanita del encabezado con su desplegable, como en Facebook: al tocarla muestra los últimos 5 avisos
// (los nuevos resaltados) y "Ver todas" lleva a /notificaciones. El botón usa las clases del encabezado
export default function Campanita({ userId, sinLeer, className, clases, onAbrir }: {
  userId: string
  sinLeer: number                 // el número rojo, que cuenta el encabezado
  className?: string              // para el contenedor (en el celular, la versión de la barra)
  clases: { boton: string; icono: string; numero: string }
  onAbrir?: () => void            // el encabezado cierra su menú del celular
}) {
  const [abierta, setAbierta] = useState(false)
  const [avisos, setAvisos] = useState<Aviso[] | null>(null)   // null: todavía cargando
  const [testimonios, setTestimonios] = useState(0)
  const [error, setError] = useState(false)
  const [todasMarcadas, setTodasMarcadas] = useState(false)   // el número del encabezado tarda un momento en bajar
  const [, redibujar] = useState(0)
  const caja = useRef<HTMLDivElement>(null)

  // Cada vez que se abre trae los últimos (así nunca muestra algo viejo)
  useEffect(() => {
    if (!abierta) return
    let vigente = true
    setError(false)
    setTodasMarcadas(false)
    fetch('/api/notificaciones', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { avisos: Aviso[]; testimonios: number }) => {
        if (!vigente) return
        setAvisos(d.avisos)
        setTestimonios(d.testimonios)
      })
      .catch(() => { if (vigente) setError(true) })
    return () => { vigente = false }
  }, [abierta])

  // Se cierra tocando afuera o con Escape
  useEffect(() => {
    if (!abierta) return
    const afuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierta(false)
    }
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierta(false) }
    document.addEventListener('pointerdown', afuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('pointerdown', afuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierta])

  // Se vuelve a dibujar cuando se marca algo, acá o en la página de notificaciones
  useEffect(() => {
    const alMarcar = () => redibujar(n => n + 1)
    window.addEventListener(EVENTO_NOTIF_LEIDAS, alMarcar)
    return () => window.removeEventListener(EVENTO_NOTIF_LEIDAS, alMarcar)
  }, [])

  const lista = (avisos ?? []).map(a => (yaLeida(a) ? { ...a, leida: true } : a))
  // También si las 5 de la lista están leídas pero quedan más viejas sin leer (el número del encabezado)
  const hayNuevas = !todasMarcadas && (lista.some(a => !a.leida) || (sinLeer > 0 && lista.length > 0))

  const tocar = (a: Aviso) => {
    if (!a.leida) marcarLeida(userId, a.id)
    if (a.href) setAbierta(false)
  }

  return (
    <div ref={caja} className={`${styles.campanita}${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className={clases.boton}
        aria-label={sinLeer > 0 ? `Notificaciones: ${sinLeer} sin leer` : 'Notificaciones'}
        title="Notificaciones"
        aria-expanded={abierta}
        aria-haspopup="dialog"
        onClick={() => {
          setAbierta(a => !a)
          onAbrir?.()
        }}
      >
        <span className={clases.icono} />
        {sinLeer > 0 && <span className={clases.numero}>{sinLeer > 9 ? '9+' : sinLeer}</span>}
      </button>

      {abierta && (
        <div className={styles.panel} role="dialog" aria-label="Notificaciones">
          <div className={styles.cabeza}>
            <p className={styles.titulo}>Notificaciones</p>
            {hayNuevas && (
              <button
                type="button"
                className={styles.marcarTodas}
                onClick={() => {
                  marcarTodas(userId, lista.map(a => a.id))
                  setTodasMarcadas(true)
                }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {testimonios > 0 && (
            <Link href="/notificaciones#testimonios" className={styles.testimonios} onClick={() => setAbierta(false)}>
              <span className={styles.icono} style={{ '--icono': 'url(/ic-testi2.webp)' } as React.CSSProperties} aria-hidden="true" />
              {testimonios === 1 ? 'Tenés 1 testimonio para aprobar' : `Tenés ${testimonios} testimonios para aprobar`}
            </Link>
          )}

          {error ? (
            <p className={styles.estado}>No se pudieron cargar las notificaciones.</p>
          ) : avisos === null ? (
            <p className={styles.estado}>Cargando…</p>
          ) : lista.length === 0 ? (
            <p className={styles.estado}>Todavía no tenés notificaciones.</p>
          ) : (
            <ul className={styles.lista}>
              {lista.map(a => {
                const clase = `${styles.aviso} ${a.leida ? styles.leido : styles.nuevo} ${a.href || !a.leida ? styles.tocable : ''}`
                const contenido = (
                  <>
                    {a.foto ? (
                      <Image src={a.foto} alt="" width={38} height={38} className={styles.foto} unoptimized />
                    ) : (
                      <span className={`${styles.avisoIcono} ${styles[`tipo_${a.tipo}`] ?? ''}`}>
                        <span className={styles.icono} style={{ '--icono': `url(${a.icono})` } as React.CSSProperties} aria-hidden="true" />
                      </span>
                    )}
                    <span className={styles.texto}>
                      <span className={styles.avisoTitulo}>{a.titulo}</span>
                      {a.mensaje && <span className={styles.mensaje}>{a.mensaje}</span>}
                      <span className={styles.cuando}>{a.cuando}</span>
                    </span>
                    {!a.leida && <span className={styles.punto} title="Sin leer" />}
                  </>
                )
                return (
                  <li key={a.id}>
                    {a.href ? (
                      <Link href={a.href} className={clase} onClick={() => tocar(a)}>{contenido}</Link>
                    ) : !a.leida ? (
                      <button type="button" className={clase} onClick={() => tocar(a)}>{contenido}</button>
                    ) : (
                      <div className={clase}>{contenido}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          <Link href="/notificaciones" className={styles.verTodas} onClick={() => setAbierta(false)}>Ver todas</Link>
        </div>
      )}
    </div>
  )
}
