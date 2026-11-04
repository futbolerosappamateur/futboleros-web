'use client'

import { useOptimistic, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { EVENTO_NOTIF_LEIDAS, TIPOS_WEB } from '@/lib/notificaciones'
import { responderTestimonio } from './actions'
import styles from './notificaciones.module.css'

export type Aviso = {
  id: number
  tipo: string
  titulo: string
  mensaje: string
  leida: boolean
  cuando: string    // "hace 5 min", ya armado en el servidor
  icono: string
  foto?: string     // la del que te sigue
  href?: string     // a dónde lleva; sin link, tocarlo solo lo marca leído
}

export type Pendiente = {
  id: number
  texto: string
  fecha: string
  autor: string
  foto?: string
  href?: string
}

// Lo que se marcó leído en esta visita al sitio: al volver con "atrás", Next muestra la página que tenía
// guardada y sin esto los avisos aparecerían otra vez como nuevos
const leidasEnLaVisita = new Set<number>()

const avisar = () => window.dispatchEvent(new Event(EVENTO_NOTIF_LEIDAS))

export default function NotificacionesClient({ userId, avisos, pendientes }: {
  userId: string
  avisos: Aviso[]
  pendientes: Pendiente[]
}) {
  const [leidas, setLeidas] = useState(() => new Set(leidasEnLaVisita))
  const lista = avisos.map(a => (leidas.has(a.id) ? { ...a, leida: true } : a))
  const sinLeer = lista.filter(a => !a.leida)

  const anotar = (ids: number[]) => {
    ids.forEach(id => leidasEnLaVisita.add(id))
    setLeidas(new Set(leidasEnLaVisita))
  }

  // Como en la app: tocar un aviso lo marca leído (y, si tiene link, lleva ahí)
  const marcarLeida = (a: Aviso) => {
    if (a.leida) return
    anotar([a.id])
    createClient().from('notificaciones').update({ leida: true }).eq('id', a.id).eq('usuario_id', userId)
      .then(avisar)
  }

  // Todas las de la web, también las más viejas que no entran en la lista; las de partidos quedan para la app
  const marcarTodas = () => {
    anotar(lista.map(a => a.id))
    createClient().from('notificaciones').update({ leida: true })
      .eq('usuario_id', userId).eq('leida', false).in('tipo', TIPOS_WEB)
      .then(avisar)
  }

  return (
    <div className={styles.contenido}>
      <Testimonios pendientes={pendientes} />

      <section className={styles.bloque} aria-labelledby="avisos-titulo">
        <div className={styles.bloqueCabeza}>
          <h2 id="avisos-titulo" className={styles.bloqueTitulo}>
            Avisos{sinLeer.length > 0 && <span className={styles.cuenta}> ({sinLeer.length})</span>}
          </h2>
          {sinLeer.length > 0 && (
            <button type="button" className={styles.marcarTodas} onClick={marcarTodas}>Marcar todas como leídas</button>
          )}
        </div>

        {lista.length === 0 ? (
          <div className={styles.vacio}>
            <span className={`${styles.icono} ${styles.vacioIcono}`} style={{ '--icono': 'url(/ic-noti.webp)' } as React.CSSProperties} aria-hidden="true" />
            <p className={styles.vacioTitulo}>Sin notificaciones</p>
            <p className={styles.vacioTexto}>Acá vas a ver quién empieza a seguirte, los testimonios que te dejan y los sorteos que ganás.</p>
          </div>
        ) : (
          <ul className={styles.lista}>
            {lista.map(a => {
              const clase = [
                styles.aviso,
                a.leida ? styles.leido : styles.nuevo,
                a.tipo === 'sorteo' || a.tipo === 'admin_mensaje' ? styles.futboleros : '',
                a.href || !a.leida ? styles.tocable : '',
              ].join(' ')
              const contenido = (
                <>
                  {a.foto ? (
                    <Image src={a.foto} alt="" width={44} height={44} className={styles.avisoFoto} unoptimized />
                  ) : (
                    <span className={`${styles.avisoIcono} ${styles[`tipo_${a.tipo}`] ?? ''}`}>
                      <span className={styles.icono} style={{ '--icono': `url(${a.icono})` } as React.CSSProperties} aria-hidden="true" />
                    </span>
                  )}
                  <span className={styles.avisoTexto}>
                    <span className={styles.avisoTitulo}>{a.titulo}</span>
                    {a.mensaje && <span className={styles.avisoMensaje}>{a.mensaje}</span>}
                    <span className={styles.avisoCuando}>{a.cuando}</span>
                  </span>
                  {!a.leida && <span className={styles.punto} title="Sin leer" />}
                </>
              )
              return (
                <li key={a.id}>
                  {a.href ? (
                    <Link href={a.href} className={clase} onClick={() => marcarLeida(a)}>{contenido}</Link>
                  ) : !a.leida ? (
                    <button type="button" className={clase} onClick={() => marcarLeida(a)}>{contenido}</button>
                  ) : (
                    <div className={clase}>{contenido}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

// Testimonios que le dejaron y esperan respuesta, con Aprobar y Rechazar como en Testimonios.js de la app.
// Desaparecen apenas se tocan; si algo falla, vuelven con el error
function Testimonios({ pendientes }: { pendientes: Pendiente[] }) {
  const [visibles, quitar] = useOptimistic(pendientes, (lista, id: number) => lista.filter(t => t.id !== id))
  const [, startTransition] = useTransition()
  const [hecho, setHecho] = useState('')
  const [error, setError] = useState('')

  const responder = (t: Pendiente, aprobar: boolean) => {
    setError('')
    setHecho('')
    startTransition(async () => {
      quitar(t.id)
      const r = await responderTestimonio(t.id, aprobar)
      if ('error' in r) {
        setError(r.error)
        return
      }
      setHecho(aprobar ? `Aprobaste el testimonio de ${t.autor}.` : `Rechazaste el testimonio de ${t.autor}.`)
      avisar()
    })
  }

  if (!visibles.length && !hecho && !error) return null
  return (
    <section id="testimonios" className={`${styles.bloque} ${styles.bloqueTestimonios}`} aria-labelledby="testimonios-titulo">
      <div className={styles.bloqueCabeza}>
        <h2 id="testimonios-titulo" className={styles.bloqueTitulo}>
          Testimonios para aprobar{visibles.length > 0 && <span className={styles.cuenta}> ({visibles.length})</span>}
        </h2>
      </div>
      {hecho && <p className={styles.hecho} role="status">{hecho}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {visibles.length > 0 && (
        <ul className={styles.testimonios}>
          {visibles.map(t => (
            <li key={t.id} className={styles.testimonio}>
              <div className={styles.testimonioCabeza}>
                {t.foto ? (
                  <Image src={t.foto} alt="" width={46} height={46} className={styles.testimonioFoto} unoptimized />
                ) : (
                  <span className={styles.testimonioFoto} aria-hidden="true">{t.autor.charAt(0).toUpperCase()}</span>
                )}
                <div>
                  <p className={styles.testimonioAutor}>{t.href ? <Link href={t.href}>{t.autor}</Link> : t.autor}</p>
                  <p className={styles.testimonioFecha}>{t.fecha}</p>
                </div>
              </div>
              <p className={styles.testimonioTexto}>“{t.texto}”</p>
              <div className={styles.testimonioBotones}>
                <button type="button" className={styles.btnRechazar} onClick={() => responder(t, false)}>Rechazar</button>
                <button type="button" className={styles.btnAprobar} onClick={() => responder(t, true)}>Aprobar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
