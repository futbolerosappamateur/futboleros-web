import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ParallaxHero from '../../components/ParallaxHero'
import AvatarModal from './AvatarModal'
import BotonEditar from './BotonEditar'
import CarruselFiguritas from './CarruselFiguritas'
import BloquePublicidad from '../../components/BloquePublicidad'
import { createServiceClient } from '@/lib/supabase/service'
import { NOMBRE_PAIS, REDES, urlRed } from '@/lib/perfil-opciones'
import { formatoRating } from '@/lib/formato'
import styles from './jugador.module.css'

export const revalidate = 60

const PERFIL_FIELDS = 'id, nombre, nombre_figurita, apodo, username, avatar_url, imagen_ia, estilo_juego, caracteristicas, plan, pais, fecha_nacimiento, altura, hincha_de, idolo, es_pro, descripcion_propia, redes'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Try username first, fall back to id. Cached so generateMetadata and the page share one lookup.
const getPerfil = cache(async (slug: string) => {
  const supabase = createServiceClient()
  const { data } = await supabase.from('perfiles').select(PERFIL_FIELDS).eq('username', slug).maybeSingle()
  if (data || !UUID_RE.test(slug)) return data
  const res = await supabase.from('perfiles').select(PERFIL_FIELDS).eq('id', slug).maybeSingle()
  return res.data
})

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const perfil = await getPerfil(slug)
  const nombre = perfil?.nombre?.trim() || 'Jugador'
  return { title: nombre }
}

// "2026-09-26T00:00:00" → "26/09/2026" (a mano: con new Date() se puede correr un día por zona horaria)
function fechaCorta(fecha?: string | null) {
  const m = fecha?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

// Timestamp de Supabase → "4 de julio de 2026", en hora argentina
function fechaLarga(ts?: string | null) {
  return ts
    ? new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
    : ''
}

// 10 → "10", 7.5 → "7.5"
const formatoNota = (n: number | string) => (Number(n) % 1 === 0 ? String(Number(n)) : Number(n).toFixed(1))

function calcEdad(fechaNac: string) {
  const [y, m, d] = fechaNac.split('-').map(Number)
  const hoy = new Date()
  let edad = hoy.getFullYear() - y
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) edad--
  return edad
}

export default async function JugadorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()

  const perfil = await getPerfil(slug)
  if (!perfil) notFound()
  const id = perfil.id
  // Figuritas y testimonios son de Plan 10; sin plan, en lugar de testimonios va publicidad
  const esPro = !!perfil.es_pro
  const sinFilas = Promise.resolve({ data: [] as any[] })

  const [{ data: statsData }, { data: historial }, { data: testimonios }, { count: seguidores }, { count: grupos }, { data: figusData }] =
    await Promise.all([

      supabase.rpc('get_stats_globales', { p_usuario_id: id }),

      supabase
        .from('estadisticas')
        .select('goles, asistencias, nota_admin, resultado, es_figura, partidos(fecha, lugar, grupos(nombre))')
        .eq('usuario_id', id)
        .order('id', { ascending: false })
        .limit(5),

      esPro
        ? supabase
            .from('testimonios')
            .select('id, texto, creado_en, autor_id')
            .eq('destinatario_id', id)
            .eq('estado', 'aprobado')
            .order('creado_en', { ascending: false })
            .limit(4)
        : sinFilas,

      // Seguidores y grupos se cuentan igual que en la app (VerPerfil y Contactos)
      supabase
        .from('perfiles')
        .select('id', { count: 'exact', head: true })
        .contains('siguiendo', [id]),

      supabase
        .from('grupo_jugadores')
        .select('grupo_id', { count: 'exact', head: true })
        .eq('usuario_id', id)
        .eq('activo', true)
        .eq('estado', 'aceptado'),

      // Historial de figuritas generadas en la app (imagen IA + datos del perfil de ese momento)
      esPro
        ? supabase
            .from('figuritas_generadas')
            .select('id, url')
            .eq('user_id', id)
            .order('created_at', { ascending: false })
            .limit(20)
        : sinFilas,
    ])

  const s = {
    partidos: statsData?.partidos ?? 0,
    goles: statsData?.goles ?? 0,
    asistencias: statsData?.asistencias ?? 0,
    ganados: statsData?.ganados ?? 0,
    empatados: statsData?.empatados ?? 0,
    perdidos: statsData?.perdidos ?? 0,
    figura: statsData?.figura ?? 0,
    lenador: statsData?.lenador ?? 0,
    palo: statsData?.palo ?? 0,
  }
  const rating = s.partidos > 0 && statsData?.rating != null ? formatoRating(statsData.rating) : '–'
  const redes = REDES.filter(r => perfil.redes?.[r.key]?.trim())
  const edad = perfil.fecha_nacimiento ? calcEdad(perfil.fecha_nacimiento) : null
  const tags: string[] = (perfil.caracteristicas ?? []).slice(0, 8)
  const apodo: string = perfil.apodo?.trim() ?? ''
  const estilo: string = (perfil.estilo_juego?.[0] ?? '').replace(/[^\p{L}\s]/gu, '').trim()
  // Los autores van aparte, como en la app: testimonios no tiene clave foránea a perfiles y el join falla
  const autorIds = [...new Set((testimonios ?? []).map((t: any) => t.autor_id as string))]
  const { data: autores } = autorIds.length
    ? await supabase.from('perfiles').select('id, nombre, avatar_url, username').in('id', autorIds)
    : { data: [] }
  const autorPorId = new Map((autores ?? []).map((a: any) => [a.id, a]))
  const tenis = (testimonios ?? []).map((t: any) => ({ ...t, autor: autorPorId.get(t.autor_id) })) as any[]
  const partidos = (historial ?? []) as any[]

  // Colección: la imagen fiel a la app la arma /api/figurita (la misma que la figurita PNG);
  // miniatura y versión grande en WebP. Si la actual no está en el historial, va primera.
  const figu = (q: string) => `/api/figurita/${id}?${q}`
  const sinQuery = (url: string) => url.split('?')[0]
  const historialFigus = (figusData ?? []) as { id: string; url: string }[]
  const figuritas = historialFigus.map(f => ({
    key: f.id,
    src: figu(`f=${f.id}&ancho=320`),
    grande: figu(`f=${f.id}&ancho=629`),
  }))
  if (esPro && perfil.imagen_ia && !historialFigus.some(f => sinQuery(f.url) === sinQuery(perfil.imagen_ia))) {
    figuritas.unshift({ key: 'actual', src: figu('ancho=320'), grande: figu('ancho=629') })
  }
  const primerNombre = perfil.nombre?.trim().split(' ')[0] ?? ''

  return (
    <>
      <Header />
      <main className={styles.page}>

        {/* ── Hero ── */}
        <ParallaxHero src="/fondos/jugador.webp" className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroBottom}>
              <AvatarModal
                avatarUrl={perfil.avatar_url}
                imagenIa={perfil.imagen_ia}
                nombre={perfil.nombre}
                esPro={perfil.es_pro}
              />
              <div className={styles.profileInfo}>
                {apodo && <p className={styles.apodo}>{apodo}</p>}
                <h1 className={styles.nombre}>
                  {perfil.nombre}
                  {perfil.es_pro && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/ic-10.webp" alt="Plan 10" className={styles.starIcon} />
                  )}
                </h1>
              </div>
            </div>
          </div>
        </ParallaxHero>

        {/* ── Body ── */}
        <div className={styles.body}>
          <div className={styles.layout}>

            {/* Usuario + tags / características */}
            <div className={styles.idRow}>
              {perfil.username && <p className={styles.username}>@{perfil.username}</p>}
              {tags.map((t, i) => (
                <span key={i} className={styles.tagCyan}>{t.replace(/[^\p{L}\s]/gu, '').trim()}</span>
              ))}
              {redes.length > 0 && (
                <div className={styles.redes}>
                  {redes.map(r => (
                    <a
                      key={r.key}
                      href={urlRed(r.key, perfil.redes[r.key])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.red}
                      aria-label={r.label}
                      title={r.label}
                    >
                      <Icono src={r.icono} className={styles.redIcono} />
                    </a>
                  ))}
                </div>
              )}
              <BotonEditar perfilId={perfil.id} />
            </div>

            {/* Ficha (columna izquierda) */}
            {(edad != null || perfil.altura || perfil.pais || estilo) && (
              <aside className={styles.ficha}>
                {edad != null && <FichaDato label="Edad" value={String(edad)} />}
                {perfil.altura && <FichaDato label="Altura" value={(perfil.altura / 100).toFixed(2)} />}
                {perfil.pais && (
                  <div className={styles.fichaDato}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://flagcdn.com/${perfil.pais.toLowerCase()}.svg`}
                      alt={NOMBRE_PAIS[perfil.pais] ?? perfil.pais}
                      title={NOMBRE_PAIS[perfil.pais] ?? perfil.pais}
                      className={styles.fichaBandera}
                    />
                  </div>
                )}
                {estilo && <p className={styles.fichaEstilo}>{estilo}</p>}
              </aside>
            )}

            <div className={styles.main}>

              <div className={styles.resumen}>
                {/* Hincha de · Ídolo */}
                {(perfil.hincha_de || perfil.idolo) && (
                  <p className={styles.datosLinea}>
                    {perfil.hincha_de && <span>Hincha de: <strong>{perfil.hincha_de}</strong></span>}
                    {perfil.idolo && <span>Ídolo: <strong>{perfil.idolo}</strong></span>}
                  </p>
                )}

                {/* Estadísticas */}
                <section className={styles.stats} aria-label="Estadísticas">
                  <div className={styles.statsIzq}>
                    <div className={styles.partidos}>
                      <div className={styles.partidosCard}>
                        <p className={styles.partidosTitulo}>Partidos</p>
                        <div className={styles.gep}>
                          <span className={styles.gepG}>G</span>
                          <span className={styles.gepE}>E</span>
                          <span className={styles.gepP}>P</span>
                          <span>{s.ganados}</span>
                          <span>{s.empatados}</span>
                          <span>{s.perdidos}</span>
                        </div>
                      </div>
                      <div className={styles.rating}>
                        <span className={styles.ratingLabel}>Rating global</span>
                        <span className={styles.ratingNum}>{rating}</span>
                      </div>
                    </div>
                    <div className={styles.contadores}>
                      <Contador icono="/ic-contacts.webp" valor={seguidores ?? 0} label={seguidores === 1 ? 'Seguidor' : 'Seguidores'} />
                      <Contador icono="/ic-grupos2.webp" valor={grupos ?? 0} label={grupos === 1 ? 'Grupo' : 'Grupos'} />
                    </div>
                  </div>

                  <div className={styles.statsDer}>
                    <h2 className={styles.statsTitulo}>Estadísticas</h2>
                    <div className={styles.cards3}>
                      <StatCard valor={s.partidos} label="Jugados" />
                      <StatCard valor={s.goles} label="Goles" />
                      <StatCard valor={s.asistencias} label="Asistencias" />
                    </div>
                    <div className={styles.cards2}>
                      <StatCard valor={`${s.partidos > 0 ? Math.round(s.ganados / s.partidos * 100) : 0}%`} label="Partidos ganados" />
                      <StatCard valor={s.partidos > 0 ? (s.goles / s.partidos).toFixed(2) : '0.00'} label="Goles por partido" />
                    </div>
                    <div className={styles.cards3}>
                      <PremioCard icono="/ic-figura.webp" valor={s.figura} label="La figura" />
                      <PremioCard icono="/ic-lena.webp" valor={s.lenador} label="El leñador" />
                      <PremioCard icono="/ic-tronco.webp" valor={s.palo} label="El tronco" />
                    </div>
                  </div>
                </section>
              </div>

              {/* Figuritas (Plan 10) */}
              {esPro && figuritas.length > 0 && (
                <CarruselFiguritas
                  figuritas={figuritas}
                  subtitulo={`La colección de figuritas de ${primerNombre}`}
                  alt={`Figurita de ${primerNombre}`}
                />
              )}

              {/* Últimos partidos + testimonios (Plan 10) o publicidad */}
              <div className={styles.cierre}>
                <section className={styles.ultimos} aria-labelledby="ultimos-titulo">
                  <h2 id="ultimos-titulo" className={styles.tituloBloque}>Últimos partidos</h2>
                  {partidos.length > 0 ? (
                    <ul className={styles.partidosLista}>
                      {partidos.map((e, i) => {
                        const letra = e.resultado === 'ganado' ? 'G' : e.resultado === 'perdido' ? 'P' : 'E'
                        return (
                          <li key={i} className={styles.partidoFila}>
                            <span className={`${styles.partidoLetra} ${styles[`gep${letra}`]}`}>{letra}</span>
                            <div className={styles.partidoInfo}>
                              <p className={styles.partidoGrupo}>{e.partidos?.grupos?.nombre ?? 'Partido'}</p>
                              <p className={styles.partidoMeta}>
                                {[e.partidos?.lugar, fechaCorta(e.partidos?.fecha)].filter(Boolean).join(' • ')}
                              </p>
                            </div>
                            <div className={styles.partidoStats}>
                              {e.nota_admin != null && <span title="Nota"><IcoEstrella />{formatoNota(e.nota_admin)}</span>}
                              {e.goles > 0 && <span title="Goles"><IcoPelota />{e.goles}</span>}
                              {e.asistencias > 0 && <span title="Asistencias"><IcoDiana />{e.asistencias}</span>}
                              {e.es_figura && (
                                <span title="La figura del partido">
                                  <Icono src="/ic-figura.webp" className={styles.partidoCopa} />
                                </span>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className={styles.vacio}>Todavía no jugó partidos.</p>
                  )}
                </section>

                {esPro ? (
                  <section className={styles.testimonios} aria-labelledby="testimonios-titulo">
                    <h2 id="testimonios-titulo" className={styles.tituloBloque}>Testimonios</h2>
                    {tenis.length > 0 ? (
                      <ul className={styles.testimoniosLista}>
                        {tenis.map((t: any) => (
                          <li key={t.id} className={styles.testimonio}>
                            {t.autor?.avatar_url ? (
                              <Image
                                src={t.autor.avatar_url}
                                alt=""
                                width={46}
                                height={46}
                                className={styles.testimonioAvatar}
                                unoptimized
                              />
                            ) : (
                              <span className={styles.testimonioAvatar} aria-hidden="true" />
                            )}
                            <div>
                              <p className={styles.testimonioAutor}>
                                {t.autor ? (
                                  <Link href={`/jugadores/${t.autor.username ?? t.autor.id}`}>{t.autor.nombre?.trim() || 'Jugador'}</Link>
                                ) : 'Jugador'}
                              </p>
                              <p className={styles.testimonioFecha}>{fechaLarga(t.creado_en)}</p>
                              <p className={styles.testimonioTexto}>“{t.texto}”</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.vacio}>Todavía no tiene testimonios.</p>
                    )}
                  </section>
                ) : (
                  <BloquePublicidad slot="perfil_testimonios" esPro={esPro} className={styles.publicidad} />
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function FichaDato({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fichaDato}>
      <span className={styles.fichaLabel}>{label}</span>
      <span className={styles.fichaValor}>{value}</span>
    </div>
  )
}

function StatCard({ valor, label }: { valor: string | number; label: string }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValor}>{valor}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function PremioCard({ icono, valor, label }: { icono: string; valor: number; label: string }) {
  return (
    <div className={styles.premio}>
      <Icono src={icono} className={styles.premioIcono} />
      <span className={styles.statValor}>{valor}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function Contador({ icono, valor, label }: { icono: string; valor: number; label: string }) {
  return (
    <div className={styles.contador}>
      <Icono src={icono} className={styles.contadorIcono} />
      <div>
        <p className={styles.contadorValor}>{valor}</p>
        <p className={styles.statLabel}>{label}</p>
      </div>
    </div>
  )
}

// Íconos de línea de las filas de partidos (nota, goles, asistencias)
const icoProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

function IcoEstrella() {
  return <svg {...icoProps}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
}

function IcoPelota() {
  return (
    <svg {...icoProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5l3.8 2.8-1.5 4.4H9.7l-1.5-4.4z" />
      <path d="M12 7.5V3M15.8 10.3l4.3-1.4M14.3 14.7l2.6 3.7M9.7 14.7l-2.6 3.7M8.2 10.3L3.9 8.9" />
    </svg>
  )
}

function IcoDiana() {
  return (
    <svg {...icoProps}>
      <circle cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="4.5" />
      <path d="M11 13l8.5-8.5M15.5 4.5h4v4" />
    </svg>
  )
}

// Íconos de la app (PNG/WebP con transparencia) teñidos con el color del diseño
function Icono({ src, className }: { src: string; className: string }) {
  return <span className={`${styles.icono} ${className}`} style={{ '--icono': `url(${src})` } as React.CSSProperties} aria-hidden="true" />
}
