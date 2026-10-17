import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import Header from './components/Header'
import HeroSlider from './components/HeroSlider'
import FiguritaStack from './components/FiguritaStack'
import BloquePublicidad from './components/BloquePublicidad'
import Footer from './components/Footer'
import Filete from './components/Filete'
import ContadorAnimado from './components/ContadorAnimado'
import WidgetEnVivo from './components/WidgetEnVivo'
import AnimarAlScroll from './components/AnimarAlScroll'
import FiguritaBrillante from './components/FiguritaBrillante'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { URL_GOOGLE_PLAY } from '@/lib/sitio'
import { coloresClub } from '@/lib/colores-clubes'
import styles from './page.module.css'

async function getSlides() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('slides')
    .select('id, titulo, subtitulo, imagen_url, cta_texto, cta_url')
    .eq('activo', true)
    .order('orden')
  return data ?? []
}

// Con la clave anónima las políticas de Supabase no dejan contar (daba 0): son solo totales, van con service.
// Los de la semana van al zócalo de abajo del slider
async function getStats() {
  const supabase = createServiceClient()
  const haceUnaSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [{ count: jugadores }, { count: partidos }, { count: grupos }, { count: partidosSemana }, { count: jugadoresSemana }] = await Promise.all([
    supabase.from('perfiles').select('*', { count: 'exact', head: true }),
    supabase.from('partidos').select('*', { count: 'exact', head: true }).eq('estado', 'finalizado'),
    supabase.from('grupos').select('*', { count: 'exact', head: true }).eq('activo', true),
    // fecha es timestamp sin zona: se compara solo el día
    supabase.from('partidos').select('*', { count: 'exact', head: true }).eq('estado', 'finalizado').gte('fecha', haceUnaSemana.slice(0, 10)),
    supabase.from('perfiles').select('*', { count: 'exact', head: true }).gte('created_at', haceUnaSemana),
  ])
  return {
    jugadores: jugadores ?? 0,
    partidos: partidos ?? 0,
    grupos: grupos ?? 0,
    partidosSemana: partidosSemana ?? 0,
    jugadoresSemana: jugadoresSemana ?? 0,
  }
}

const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-AR')} ${n === 1 ? uno : varios}`

// Jugadores con perfil público y figurita, para la fila de figuritas (las imágenes las arma /api/figurita,
// igual que en el perfil). Sin caché: se ve enseguida cuando alguien pone su perfil público
async function getFiguritasPublicas() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('perfiles')
    .select('id, username, nombre, nombre_figurita')
    .eq('perfil_publico', true)
    .not('imagen_ia', 'is', null)
    .order('actualizado_en', { ascending: false, nullsFirst: false })
    .limit(24)
  return (data ?? []) as { id: string; username: string | null; nombre: string | null; nombre_figurita: string | null }[]
}

const MINIMO_FIGURITAS = 3   // con menos, la fila no se muestra
const FIGURITAS_POR_VUELTA = 8   // se repiten hasta llenar el ancho de una pantalla grande

// Pantallas reales de la app (public/app, sacadas de capturas del celular sin la barra de Android)
const CELULARES = [
  { src: '/app/estadisticas.webp', alt: 'Tus estadísticas en la app', lugar: 'izquierda' },
  { src: '/app/inicio.webp', alt: 'Inicio de la app con la cuenta regresiva al próximo partido', lugar: 'centro' },
  { src: '/app/figurita.webp', alt: 'Tu figurita en la app', lugar: 'derecha' },
] as const

const FEATURES = [
  {
    icono: '/ic-cal.webp',
    title: 'Organizá partidos',
    body: 'Programá tus partidos semanales, mandá convocatorias automáticas y manejá la lista de espera sin un solo mensaje de WhatsApp.',
  },
  {
    icono: '/ic-stats.webp',
    title: 'Seguí tus stats',
    body: 'Goles, asistencias, partidos jugados, premios del partido. Tu historial completo, partido a partido.',
  },
  {
    icono: '/ic-contacts.webp',
    title: 'Conectá con jugadores',
    body: 'Buscá jugadores por zona, mirá sus figuritas y sumá nuevos cracks a tu grupo cuando alguien no puede.',
  },
]

// Los 10 clubes con más hinchas entre los usuarios. Recorre todos los perfiles: se recalcula cada 10 minutos.
const NO_SON_CLUBES = new Set(['otro', 'ninguno'])
const getHinchas = unstable_cache(async () => {
  const supabase = createServiceClient()
  const conteo = new Map<string, number>()
  for (let desde = 0; ; desde += 1000) {
    const { data } = await supabase
      .from('perfiles')
      .select('hincha_de')
      .not('hincha_de', 'is', null)
      .range(desde, desde + 999)
    for (const { hincha_de } of data ?? []) {
      const club = (hincha_de as string).trim()
      if (club && !NO_SON_CLUBES.has(club.toLowerCase())) conteo.set(club, (conteo.get(club) ?? 0) + 1)
    }
    if (!data || data.length < 1000) break
  }
  return [...conteo]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, 10)
    .map(([club, hinchas]) => ({ club, hinchas }))
}, ['home-hinchas'], { revalidate: 600 })

// Las últimas novedades, debajo de los clubes: la más nueva grande y las dos anteriores al costado.
// Con menos publicadas el bloque no se muestra. Sin caché: aparece apenas se publica
const NOVEDADES_HOME = 3
async function getUltimasNovedades() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('novedades')
    .select('id, titulo, slug, resumen, imagen_url, categoria, creado_en')
    .eq('publicado', true)
    .order('creado_en', { ascending: false })
    .limit(NOVEDADES_HOME)
  const novedades = (data ?? []) as {
    id: string; titulo: string; slug: string; resumen: string | null; imagen_url: string | null; categoria: string | null; creado_en: string
  }[]
  // La fecha en hora argentina, como en /novedades: 15/09/2026
  return novedades.map(n => ({
    ...n,
    fecha: new Date(n.creado_en).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }),
  }))
}

export default async function Home() {
  const [slides, stats, hinchas, figuritas, novedades] = await Promise.all([getSlides(), getStats(), getHinchas(), getFiguritasPublicas(), getUltimasNovedades()])
  const maxHinchas = hinchas[0]?.hinchas ?? 1
  const figuritasFila = figuritas.length >= MINIMO_FIGURITAS
    ? Array.from({ length: Math.ceil(FIGURITAS_POR_VUELTA / figuritas.length) }, () => figuritas).flat()
    : []

  // Zócalo: datos de la comunidad pasando como en la tele (los que dan 0 no se muestran)
  const zocalo = [
    stats.partidosSemana > 0 && { icono: '/ic-bati.webp', texto: `${plural(stats.partidosSemana, 'partido jugado', 'partidos jugados')} esta semana` },
    stats.jugadoresSemana > 0 && { icono: '/ic-grupos.webp', texto: `${plural(stats.jugadoresSemana, 'jugador nuevo', 'jugadores nuevos')} esta semana` },
    hinchas[0] && { icono: '/ic-premios.webp', texto: `${hinchas[0].club}, el club con más hinchas` },
    stats.grupos > 0 && { icono: '/ic-equipos.webp', texto: `${plural(stats.grupos, 'grupo organiza', 'grupos organizan')} su fútbol acá` },
    { icono: '/ic-cal.webp', texto: 'Convocatorias automáticas, sin perseguir a nadie por WhatsApp' },
    { icono: '/ic-fig.webp', texto: 'Tu figurita de jugador, generada con IA' },
  ].filter((item): item is { icono: string; texto: string } => !!item)

  return (
    <>
      <Header />
      <HeroSlider slides={slides} />

      {/* ── Zócalo: la lista va dos veces seguidas para que la vuelta no se note; en pantallas anchas cada
          copia repite los datos para cubrir el ancho ── */}
      <div className={styles.zocalo} role="marquee" aria-label="Futboleros en números">
        <div className={styles.zocaloPista}>
          {[0, 1].map(copia => (
            <ul key={copia} className={styles.zocaloGrupo} aria-hidden={copia === 1 || undefined}>
              {[...zocalo, ...zocalo].map((item, i) => (
                <li key={i} className={styles.zocaloItem} aria-hidden={i >= zocalo.length || undefined}>
                  <span className={styles.zocaloIcono} style={{ '--icono': `url(${item.icono})` } as React.CSSProperties} />
                  {item.texto}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <section className={styles.statsBar}>
        <div className={styles.statsInner}>
          <div className={styles.stat}>
            <ContadorAnimado valor={stats.jugadores} className={styles.statNum} />
            <span className={styles.statLabel}>Jugadores</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <ContadorAnimado valor={stats.partidos} className={styles.statNum} />
            <span className={styles.statLabel}>Partidos jugados</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <ContadorAnimado valor={stats.grupos} className={styles.statNum} />
            <span className={styles.statLabel}>Grupos activos</span>
          </div>
        </div>
      </section>

      {/* ── Publicidad principal ── */}
      <section style={{ padding: '30px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <BloquePublicidad slot="home_principal" />
      </section>

      {/* ── Features: sobre la pelota dorada de la app, con el fondo fijo mientras se baja ── */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={styles.sectionTitle} data-revelar>¿QUÉ ES FUTBOLEROS?</h2>
          <p className={`${styles.sectionSub} ${styles.subOscuro}`} data-revelar>
            La plataforma para organizar tu fútbol semanal sin el quilombo de siempre.
          </p>
          <Filete className={styles.fileteSeccion} />
          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div key={f.title} data-revelar style={{ '--retraso': `${i * 0.12}s` } as React.CSSProperties}>
                <div className={styles.featureCard}>
                  <span className={styles.featureIcono} style={{ '--icono': `url(${f.icono})` } as React.CSSProperties} />
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureBody}>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── La app: tres pantallas reales en celulares que flotan ── */}
      <section className={styles.app}>
        <div className={styles.appInner}>
          <h2 className={styles.sectionTitle} data-revelar>LA APP DEL FULBITO Y LOS DOLORES</h2>
          <p className={styles.sectionSub} data-revelar>
            Tu próximo partido, tus estadísticas y tu figurita, siempre a mano.
          </p>
          <Filete className={styles.fileteSeccion} />
          <div className={styles.celulares}>
            {CELULARES.map((c, i) => (
              <div
                key={c.src}
                className={`${styles.celularLugar} ${styles[c.lugar]}`}
                data-revelar
                style={{ '--retraso': `${[0.15, 0, 0.3][i]}s` } as React.CSSProperties}
              >
                <div className={styles.celular}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.src} alt={c.alt} width={720} height={1528} loading="lazy" />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.appBotones} data-revelar>
            <a href={URL_GOOGLE_PLAY} target="_blank" rel="noopener noreferrer" className={styles.ctaPrimaryLarge}>
              Descargá la app
            </a>
          </div>
        </div>
      </section>

      {/* ── Figurita ── */}
      <section className={styles.figurita}>
        <div className={styles.separador} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/filete-flor.webp" alt="" width={145} height={55} />
        </div>
        <div className={styles.figuritaInner}>
          <div className={styles.figuritaText} data-revelar>
            <span className={styles.figuritaBadge}>Plan 10</span>
            <h2 className={styles.figuritaTitle}>TU FIGURITA,<br />GENERADA CON IA</h2>
            <p className={styles.figuritaBody}>
              Subí una foto, elegí tu pose y la inteligencia artificial genera tu figurita de jugador.
              Un álbum digital donde cada crack tiene su carta.
            </p>
            <ul className={styles.figuritaList}>
              <li>Generada con IA a partir de tu selfie</li>
              <li>4 poses disponibles para elegir</li>
              <li>Visible en tu perfil y en el de tu grupo</li>
            </ul>
            <Link href="/registro" className={styles.figuritaCta}>Conseguí tu figurita</Link>
          </div>

          <FiguritaStack />
        </div>

        {/* Fila de figuritas de jugadores con perfil público: pasan solas, brillan con el mouse y llevan al
            perfil. La lista va dos veces seguidas para que la vuelta no se note */}
        {figuritasFila.length > 0 && (
          <div className={styles.album} data-revelar>
            <p className={styles.albumTitulo}>Las figuritas de la comunidad</p>
            <div className={styles.albumPista} style={{ animationDuration: `${figuritasFila.length * 6}s` }}>
              {[0, 1].map(copia => (
                <ul key={copia} className={styles.albumGrupo} aria-hidden={copia === 1 || undefined}>
                  {figuritasFila.map((f, i) => {
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

      {/* ── Partido en vivo ── */}
      <section className={styles.liveMatch}>
        <div className={styles.liveMatchInner}>
          {/* Partido de muestra que corre solo, a la izquierda */}
          <WidgetEnVivo />

          {/* Texto derecha */}
          <div className={styles.liveMatchText} data-revelar>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              EN VIVO
            </span>
            <h2 className={styles.liveTitle}>EL PARTIDO,<br />EN TIEMPO REAL</h2>
            <p className={styles.liveBody}>
              Mientras juegan, el administrador registra goles, asistencias y eventos al instante desde el banco. Todos los jugadores siguen el partido desde sus teléfonos.
            </p>
            <ul className={styles.liveFeatures}>
              <li>Marcador actualizado en tiempo real</li>
              <li>Registro de goles y asistencias por jugador</li>
              <li>Premios del partido: figura, tronco y leñador</li>
              <li>Historial completo generado automáticamente al finalizar</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Los más hinchados, con una publicidad abajo ── */}
      <section className={styles.hinchas}>
        {hinchas.length > 0 && (
          <div className={styles.hinchasInner}>
            <h2 className={styles.sectionTitle} data-revelar>LOS MÁS HINCHADOS</h2>
            <p className={styles.sectionSub} data-revelar>Los clubes con más hinchas entre los jugadores de Futboleros.</p>
            <Filete className={styles.fileteSeccion} />
            <ol className={styles.hinchasLista} style={{ gridTemplateRows: `repeat(${Math.ceil(hinchas.length / 2)}, auto)` }}>
              {hinchas.map((h, i) => {
                // Los colores del club pintan la barra como una bufanda y el círculo junto al nombre
                // (sin colores conocidos quedan dorados)
                const colores = coloresClub(h.club)
                const estilo = {
                  '--retraso': `${i * 0.06}s`,
                  ...(colores ? { '--c1': colores[0], '--c2': colores[1] } : {}),
                } as React.CSSProperties
                return (
                // Cada fila entra un poco después de la anterior y su barra se llena al aparecer
                <li key={h.club} className={styles.hinchaFila} data-revelar style={estilo}>
                  <span className={styles.hinchaPos}>{i + 1}</span>
                  <div className={styles.hinchaInfo}>
                    <p className={styles.hinchaClub}>
                      <span className={styles.hinchaColores} aria-hidden="true" />
                      {h.club}
                    </p>
                    <div className={styles.hinchaBarra}>
                      <span style={{ width: `${(h.hinchas / maxHinchas) * 100}%` }} />
                    </div>
                  </div>
                  <p className={styles.hinchaCant}>
                    {h.hinchas}
                    <span>{h.hinchas === 1 ? 'hincha' : 'hinchas'}</span>
                  </p>
                </li>
                )
              })}
            </ol>
          </div>
        )}
        <div className={styles.hinchasPubli}>
          <BloquePublicidad slot="home_hinchas" />
        </div>
      </section>

      {/* ── Últimas novedades: la más nueva grande a la izquierda y las dos anteriores a la derecha
          (en el celular, la grande arriba y las otras dos abajo) ── */}
      {novedades.length === NOVEDADES_HOME && (
        <section className={styles.novedades}>
          <div className={styles.novedadesInner}>
            <h2 className={styles.sectionTitle} data-revelar>ÚLTIMAS NOVEDADES</h2>
            <p className={styles.sectionSub} data-revelar>Actualizaciones, mejoras y noticias de Futboleros.</p>
            <Filete className={styles.fileteSeccion} />
            <div className={styles.novedadesGrid}>
              {novedades.map((n, i) => (
                <Link
                  key={n.id}
                  href={`/novedades/${n.slug}`}
                  className={i === 0 ? `${styles.novedad} ${styles.novedadPrincipal}` : styles.novedad}
                  data-revelar
                  style={{ '--retraso': `${i * 0.12}s` } as React.CSSProperties}
                >
                  {/* Sin foto, la del encabezado de /novedades */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.imagen_url || '/fondos/novedades.webp'} alt="" loading="lazy" className={styles.novedadImg} />
                  {n.categoria && <span className={styles.novedadCategoria}>{n.categoria}</span>}
                  <time className={styles.novedadFecha} dateTime={n.creado_en}>{n.fecha}</time>
                  <h3 className={styles.novedadTitulo}>{n.titulo}</h3>
                  {i === 0 && n.resumen && <p className={styles.novedadResumen}>{n.resumen}</p>}
                </Link>
              ))}
            </div>
            <div className={styles.novedadesBotones} data-revelar>
              <Link href="/novedades" className={styles.ctaPrimaryLarge}>Ver todas las novedades</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA: sobre una foto de cancha con el fondo fijo, como "¿Qué es Futboleros?" ── */}
      <section className={styles.cta}>
        <div className={styles.ctaInner} data-revelar>
          <h2 className={styles.ctaTitle}>¿LISTO PARA JUGAR?</h2>
          <p className={styles.ctaSub}>Creá tu cuenta, armá tu grupo y empezá a organizar.</p>
          <Filete className={styles.fileteCta} />
          <div className={styles.ctaBotones}>
            <Link href="/registro" className={styles.ctaPrimaryLarge}>Crear cuenta gratis</Link>
            <a href={URL_GOOGLE_PLAY} target="_blank" rel="noopener noreferrer" className={styles.ctaSecondaryLarge}>
              Descargá la app
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <AnimarAlScroll />
    </>
  )
}
