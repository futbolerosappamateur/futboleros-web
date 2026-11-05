import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Filete from '../components/Filete'
import ParallaxHero from '../components/ParallaxHero'
import FiguritaStack from '../components/FiguritaStack'
import FiguritaBrillante from '../components/FiguritaBrillante'
import AnimarAlScroll from '../components/AnimarAlScroll'
import { createServiceClient } from '@/lib/supabase/service'
import { PRECIOS, pesos } from '@/lib/plan10'
import PlanButtons from './PlanButtons'
import base from './plan10.module.css'
import styles from './vitrina.module.css'

export const metadata: Metadata = {
  title: 'Plan 10',
  description: `Sin anuncios, testimonios, una figurita nueva por mes, sorteo mensual y el álbum impreso. Desde ${pesos(PRECIOS.mensual)} por mes.`,
}

// La fila de figuritas de la comunidad se renueva cada 5 minutos
export const revalidate = 300

// Los cinco beneficios, con los íconos y los textos de la pantalla del Plan 10 de la app (screens/PlanPro.js);
// la nota va abajo, en letra chica
const BENEFICIOS: { icono: string; titulo: string; descripcion: string; nota?: string }[] = [
  { icono: '/ic-ojoc.webp', titulo: 'Sin anuncios', descripcion: 'Disfrutá la app sin interrupciones publicitarias.' },
  { icono: '/ic-testi2.webp', titulo: 'Testimonios', descripcion: 'Escribí y recibí testimonios de tus compañeros.' },
  { icono: '/ic-fig2.webp', titulo: 'Tu figurita', descripcion: 'Una figurita vintage personalizada por mes.' },
  {
    icono: '/ic-sorteo.webp',
    titulo: 'Sorteo mensual',
    descripcion: 'Participá en el sorteo del primer día de cada mes.',
    nota: 'Los sorteos se realizarán a partir de que Futboleros tenga +100 jugadores con Plan 10.',
  },
  {
    icono: '/ic-album.webp',
    titulo: 'Álbum impreso anual',
    descripcion: 'Tu grupo puede ganar el álbum impreso con las figuritas de sus jugadores para pegar. Hasta 20 jugadores por grupo (los que más partidos jugaron). Disponible para grupos con 10 o más planes 10 activos por 6 meses o más consecutivos.',
    nota: 'Se entrega un álbum por grupo.',
  },
]

// Las cuatro poses del editor de figuritas de la app (mitad de hombre, mitad de mujer)
const POSES = [
  { src: '/pose1.webp', alt: 'Pose con los brazos cruzados' },
  { src: '/pose2m.webp', alt: 'Pose con las manos en la cintura' },
  { src: '/pose3.webp', alt: 'Pose con las manos atrás' },
  { src: '/pose4m.webp', alt: 'Pose con el pulgar arriba' },
]

// Jugadores con perfil público y figurita, como la fila de la home (las imágenes las arma /api/figurita)
async function getFiguritasPublicas() {
  const { data } = await createServiceClient()
    .from('perfiles')
    .select('id, username, nombre, nombre_figurita')
    .eq('perfil_publico', true)
    .not('imagen_ia', 'is', null)
    .order('actualizado_en', { ascending: false, nullsFirst: false })
    .limit(24)
  return (data ?? []) as { id: string; username: string | null; nombre: string | null; nombre_figurita: string | null }[]
}

const MINIMO_FIGURITAS = 3       // con menos, la fila no se muestra
const FIGURITAS_POR_VUELTA = 8   // se repiten hasta llenar el ancho de una pantalla grande

export default async function Plan10() {
  const figuritas = await getFiguritasPublicas()
  const fila = figuritas.length >= MINIMO_FIGURITAS
    ? Array.from({ length: Math.ceil(FIGURITAS_POR_VUELTA / figuritas.length) }, () => figuritas).flat()
    : []

  return (
    <>
      <Header />
      <main className={styles.page}>

        {/* ── Portada: el vestuario de fondo, el texto a la izquierda y la pila de figuritas a la derecha ── */}
        <ParallaxHero src="/hero.webp" overlay="rgba(10,10,14,0.76)" className={styles.portada}>
          <div className={styles.portadaInner}>
            <div className={styles.portadaTexto}>
              <span className={styles.sello}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ic-10.webp" alt="" width={16} height={16} />
                PLAN 10
              </span>
              <h1 className={styles.titulo}>LLEVÁ TU JUEGO<br />AL SIGUIENTE NIVEL</h1>
              <p className={styles.bajada}>Todo lo que necesitás para destacarte en la cancha y fuera de ella.</p>
              <p className={styles.desde}>Desde <strong>{pesos(PRECIOS.mensual)}</strong> por mes</p>
              <div className={styles.botones}>
                <a href="#planes" className={styles.botonDorado}>Quiero el Plan 10</a>
                <a href="#beneficios" className={styles.botonLinea}>Ver beneficios</a>
              </div>
            </div>
            <FiguritaStack />
          </div>
        </ParallaxHero>

        {/* ── Beneficios ── */}
        <section id="beneficios" className={styles.beneficios}>
          <h2 className={styles.seccionTitulo} data-revelar>TODO LO QUE TRAE</h2>
          <Filete className={styles.filete} />
          <ul className={styles.beneficiosGrilla}>
            {BENEFICIOS.map((b, i) => (
              <li key={b.titulo} className={styles.beneficio} data-revelar style={{ '--retraso': `${i * 0.08}s` } as React.CSSProperties}>
                <span className={styles.beneficioIcono}>
                  <span className={styles.icono} style={{ '--icono': `url(${b.icono})` } as React.CSSProperties} aria-hidden="true" />
                </span>
                <h3 className={styles.beneficioTitulo}>{b.titulo}</h3>
                <p className={styles.beneficioTexto}>{b.descripcion}</p>
                {b.nota && <p className={styles.beneficioNota}>{b.nota}</p>}
              </li>
            ))}
          </ul>
        </section>

        {/* ── La figurita: de la foto a la carta, con las poses de la app ── */}
        <section className={styles.figurita}>
          <div className={styles.figuritaCabeza} data-revelar>
            <span className={styles.etiqueta}>Tu figurita</span>
            <h2 className={styles.figuritaTitulo}>UNA FIGURITA NUEVA<br />CADA MES</h2>
            <p className={styles.figuritaTexto}>
              Subí una foto, elegí tu pose y la inteligencia artificial arma tu figurita, como las del álbum de
              siempre. Con el Plan 10 hacés una nueva cada mes y la sumás a tu colección.
            </p>
          </div>

          <ol className={styles.pasos}>
            <li className={styles.paso} data-revelar>
              <div className={`${styles.pasoImagen} ${styles.pasoFoto}`}>
                <span className={styles.icono} style={{ '--icono': 'url(/ic-camara.webp)' } as React.CSSProperties} aria-hidden="true" />
              </div>
              <p className={styles.pasoTexto}><span className={styles.pasoNumero}>1</span>Subí una foto tuya</p>
            </li>
            <li className={styles.paso} data-revelar style={{ '--retraso': '0.12s' } as React.CSSProperties}>
              <div className={`${styles.pasoImagen} ${styles.poses}`}>
                {POSES.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.src} src={p.src} alt={p.alt} width={265} height={265} loading="lazy" className={i === 0 ? styles.poseElegida : undefined} />
                ))}
              </div>
              <p className={styles.pasoTexto}><span className={styles.pasoNumero}>2</span>Elegí entre 4 poses</p>
            </li>
            <li className={styles.paso} data-revelar style={{ '--retraso': '0.24s' } as React.CSSProperties}>
              <div className={`${styles.pasoImagen} ${styles.pasoCarta}`}>
                <FiguritaBrillante className={styles.carta}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/figurita-2.webp" alt="Figurita de ejemplo" width={496} height={715} loading="lazy" />
                </FiguritaBrillante>
              </div>
              <p className={styles.pasoTexto}><span className={styles.pasoNumero}>3</span>La IA arma tu figurita</p>
            </li>
          </ol>

          {/* Figuritas de jugadores con perfil público: pasan solas, brillan con el mouse y llevan al perfil.
              La lista va dos veces seguidas para que la vuelta no se note */}
          {fila.length > 0 && (
            <div className={styles.album} data-revelar>
              <p className={styles.albumTitulo}>Las figuritas de la comunidad</p>
              <div className={styles.albumPista} style={{ animationDuration: `${fila.length * 6}s` }}>
                {[0, 1].map(copia => (
                  <ul key={copia} className={styles.albumGrupo} aria-hidden={copia === 1 || undefined}>
                    {fila.map((f, i) => {
                      const repetida = copia === 1 || i >= figuritas.length
                      const nombre = f.nombre_figurita?.trim() || f.nombre?.trim().split(' ')[0] || 'un jugador'
                      return (
                        <li key={i} aria-hidden={repetida || undefined}>
                          <Link
                            href={`/jugadores/${f.username ?? f.id}`}
                            className={styles.albumLink}
                            aria-label={`Figurita de ${nombre}`}
                            tabIndex={repetida ? -1 : undefined}
                          >
                            <FiguritaBrillante inclinacion={10} destello={false}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`/api/figurita/${f.id}?ancho=320`} alt="" width={320} height={461} loading="lazy" />
                            </FiguritaBrillante>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Planes, sobre papel de álbum ── */}
        <section id="planes" className={styles.planes}>
          <div className={styles.planesInner}>
            <h2 className={styles.seccionTitulo} data-revelar>ELEGÍ TU PLAN</h2>
            <Filete className={styles.filete} />
            <div data-revelar>
              <PlanButtons />
            </div>
            <p className={base.planNote}>
              El pago es procesado de forma segura por MercadoPago. ¿Tenés dudas?{' '}
              <Link href="/contacto">Escribinos</Link>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <AnimarAlScroll />
    </>
  )
}
