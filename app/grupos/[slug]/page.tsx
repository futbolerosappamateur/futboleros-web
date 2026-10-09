import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ParallaxHero from '../../components/ParallaxHero'
import { createServiceClient } from '@/lib/supabase/service'
import { FONDO_GRUPO } from '@/lib/perfil-opciones'
import { resolverGrupo } from '@/lib/grupos'
import { formatoRating } from '@/lib/formato'
import styles from './grupo.module.css'

export const revalidate = 60

// Página pública del grupo, solo lectura: todo sale de lo que se carga en la app
const getGrupo = cache(async (id: number) => {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('grupos')
    .select('id, nombre, descripcion, foto_url, admin_id, creado_en, activo')
    .eq('id', id)
    .maybeSingle()
  return data?.activo ? data : null
})

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const ruta = await resolverGrupo(slug)
  const grupo = ruta ? await getGrupo(ruta.id) : null
  return { title: grupo?.nombre?.trim() || 'Grupo' }
}

// "2026-09-26T00:00:00" → "26/09/2026" (a mano: con new Date() se puede correr un día por zona horaria)
function fechaCorta(fecha?: string | null) {
  const m = fecha?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

type Perfil = { id: string; nombre: string | null; apodo: string | null; username: string | null; avatar_url: string | null; es_pro: boolean | null }
type Rating = { usuario_id: string; partidos_jugados: number | null; total_goles: number | null; total_asistencias: number | null; rating: number | string | null }

const linkJugador = (p: Perfil) => `/jugadores/${p.username ?? p.id}`

export default async function GrupoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ruta = await resolverGrupo(slug)
  if (!ruta) notFound()
  // Links viejos (/grupos/1) o escritos distinto: a la dirección actual del grupo.
  // Temporal (307): si el grupo cambia de nombre, la dirección cambia.
  if (slug !== ruta.ruta) redirect(`/grupos/${ruta.ruta}`)
  const id = ruta.id
  const grupo = await getGrupo(id)
  if (!grupo) notFound()
  const supabase = createServiceClient()

  const [{ data: miembrosData }, { data: ratingsData }, { data: partidosData }, { data: fondoData }] = await Promise.all([
    supabase.from('grupo_jugadores').select('usuario_id').eq('grupo_id', id).eq('activo', true).eq('estado', 'aceptado'),
    supabase.from('ratings').select('usuario_id, partidos_jugados, total_goles, total_asistencias, rating').eq('grupo_id', id),
    supabase
      .from('partidos')
      .select('id, fecha, lugar, goles_equipo1, goles_equipo2')
      .eq('grupo_id', id)
      .eq('estado', 'finalizado')
      .order('fecha', { ascending: false })
      .order('id', { ascending: false })
      .limit(1000),
    // Aparte: si la columna fondo_url todavía no existe, la página se ve igual
    supabase.from('grupos').select('fondo_url').eq('id', id).maybeSingle(),
  ])

  const integrantesIds = [...new Set(((miembrosData ?? []) as { usuario_id: string }[]).map(m => m.usuario_id))]
  const esIntegrante = new Set(integrantesIds)
  const partidos = (partidosData ?? []) as any[]
  const ultimos = partidos.slice(0, 10)
  const golesTotales = partidos.reduce((s, p) => s + (p.goles_equipo1 ?? 0) + (p.goles_equipo2 ?? 0), 0)

  // La figura de cada uno de los últimos partidos
  const { data: figurasData } = ultimos.length
    ? await supabase.from('estadisticas').select('partido_id, usuario_id').in('partido_id', ultimos.map(p => p.id)).eq('es_figura', true)
    : { data: [] }
  const figuraDe = new Map(((figurasData ?? []) as any[]).map(f => [f.partido_id, f.usuario_id as string]))

  // Perfiles de integrantes, admin y figuras (las figuras pueden ser invitados con cuenta)
  const perfilIds = [...new Set([
    ...integrantesIds,
    grupo.admin_id,
    ...[...figuraDe.values()].filter(u => !u.startsWith('invitado_')),
  ].filter(Boolean))]
  const { data: perfilesData } = perfilIds.length
    ? await supabase.from('perfiles').select('id, nombre, apodo, username, avatar_url, es_pro').in('id', perfilIds)
    : { data: [] }
  const perfilDe = new Map(((perfilesData ?? []) as Perfil[]).map(p => [p.id, p]))
  const admin = perfilDe.get(grupo.admin_id)

  // Stats de cada integrante en este grupo. Los invitados también tienen fila en ratings, pero no cuentan.
  const ratings = ((ratingsData ?? []) as Rating[]).filter(r => esIntegrante.has(r.usuario_id))
  const ratingDe = new Map(ratings.map(r => [r.usuario_id, r]))
  const integrantes = integrantesIds
    .map(uid => perfilDe.get(uid))
    .filter((p): p is Perfil => !!p)
    .sort((a, b) =>
      (ratingDe.get(b.id)?.partidos_jugados ?? 0) - (ratingDe.get(a.id)?.partidos_jugados ?? 0) ||
      (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es')
    )

  // Premios, como los líderes del grupo en la app (con empates)
  const maxRating = Math.max(0, ...ratings.map(r => Number(r.rating) || 0))
  const maxGoles = Math.max(0, ...ratings.map(r => r.total_goles ?? 0))
  const maxAsist = Math.max(0, ...ratings.map(r => r.total_asistencias ?? 0))
  const quienes = (filas: Rating[]) => filas.map(r => perfilDe.get(r.usuario_id)).filter((p): p is Perfil => !!p)
  const diegos = maxRating > 0 ? quienes(ratings.filter(r => Math.abs((Number(r.rating) || 0) - maxRating) < 0.01)) : []
  const batis = maxGoles > 0 ? quienes(ratings.filter(r => (r.total_goles ?? 0) === maxGoles)) : []
  const romans = maxAsist > 0 ? quienes(ratings.filter(r => (r.total_asistencias ?? 0) === maxAsist)) : []

  const fondo = (fondoData as { fondo_url: string | null } | null)?.fondo_url
  const desde = grupo.creado_en
    ? new Date(grupo.creado_en).toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })
    : ''

  return (
    <>
      <Header />
      <main className={styles.page}>

        {/* ── Hero ── */}
        <ParallaxHero src={fondo || FONDO_GRUPO} className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroBottom}>
              <div className={styles.fotoCircle}>
                {grupo.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={grupo.foto_url} alt={grupo.nombre} />
                ) : (
                  <span>{grupo.nombre?.charAt(0)?.toUpperCase() ?? '?'}</span>
                )}
              </div>
              <div className={styles.heroInfo}>
                <p className={styles.badge}>Grupo</p>
                <h1 className={styles.nombre}>{grupo.nombre}</h1>
              </div>
            </div>
          </div>
        </ParallaxHero>

        {/* ── Body ── */}
        <div className={styles.body}>
          <div className={styles.layout}>

            <div className={styles.idRow}>
              {admin && (
                <p className={styles.meta}>
                  Admin: <Link href={linkJugador(admin)} className={styles.link}>{admin.nombre}</Link>
                </p>
              )}
              {desde && <p className={styles.meta}>En Futboleros desde {desde}</p>}
            </div>

            <div className={styles.main}>
              <div className={styles.numeros}>
                <Numero valor={integrantes.length} label={integrantes.length === 1 ? 'Integrante' : 'Integrantes'} />
                <Numero valor={partidos.length} label="Partidos jugados" />
                <Numero valor={golesTotales} label="Goles" />
                <Numero valor={partidos.length > 0 ? (golesTotales / partidos.length).toFixed(1) : '0'} label="Goles por partido" />
              </div>

              {grupo.descripcion?.trim() && (
                <section className={styles.seccion} aria-labelledby="descripcion-titulo">
                  <h2 id="descripcion-titulo" className={styles.tituloBloque}>Descripción</h2>
                  <p className={styles.descripcion}>{grupo.descripcion}</p>
                </section>
              )}

              {(diegos.length > 0 || batis.length > 0 || romans.length > 0) && (
                <section className={styles.seccion} aria-labelledby="premios-titulo">
                  <h2 id="premios-titulo" className={styles.tituloBloque}>Premios</h2>
                  <div className={styles.premios}>
                    <Premio icono="/ic-goat.webp" color="var(--gold)" titulo="El Diego" detalle="Mejor rating"
                      jugadores={diegos} valor={maxRating > 0 ? formatoRating(maxRating / 10) : ''} />
                    <Premio icono="/ic-bati.webp" color="#4caf50" titulo="El Bati" detalle="Goleador"
                      jugadores={batis} valor={`${maxGoles} ${maxGoles === 1 ? 'gol' : 'goles'}`} />
                    <Premio icono="/ic-roman.webp" color="#2196f3" titulo="Román" detalle="Más asistencias"
                      jugadores={romans} valor={`${maxAsist} ${maxAsist === 1 ? 'asistencia' : 'asistencias'}`} />
                  </div>
                </section>
              )}

              <div className={styles.cierre}>
                <section className={styles.seccion} aria-labelledby="integrantes-titulo">
                  <h2 id="integrantes-titulo" className={styles.tituloBloque}>Integrantes</h2>
                  {integrantes.length > 0 ? (
                    <ul className={styles.lista}>
                      {integrantes.map(p => {
                        const r = ratingDe.get(p.id)
                        return (
                          <li key={p.id}>
                            <Link href={linkJugador(p)} className={styles.integrante}>
                              <Avatar perfil={p} />
                              <div className={styles.filaInfo}>
                                <p className={styles.filaTitulo}>
                                  {p.nombre}
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  {p.es_pro && <img src="/ic-10.webp" alt="Plan 10" className={styles.plan10} />}
                                </p>
                                {p.apodo && <p className={styles.filaMeta}>"{p.apodo}"</p>}
                              </div>
                              <div className={styles.filaStats}>
                                <span><b>{r?.partidos_jugados ?? 0}</b>PJ</span>
                                <span><b>{r?.total_goles ?? 0}</b>G</span>
                                <span><b>{r?.total_asistencias ?? 0}</b>A</span>
                                <span><b>{r?.rating != null && (r.partidos_jugados ?? 0) > 0 ? formatoRating(Number(r.rating) / 10) : '—'}</b>RAT</span>
                              </div>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className={styles.vacio}>Todavía no tiene integrantes.</p>
                  )}
                </section>

                <section className={styles.seccion} aria-labelledby="partidos-titulo">
                  <h2 id="partidos-titulo" className={styles.tituloBloque}>Últimos partidos</h2>
                  {ultimos.length > 0 ? (
                    <ul className={styles.lista}>
                      {ultimos.map(p => {
                        const uid = figuraDe.get(p.id)
                        const figura = uid ? perfilDe.get(uid) : undefined
                        return (
                          <li key={p.id} className={styles.partido}>
                            <div className={styles.filaInfo}>
                              <p className={styles.filaTitulo}>Claro {p.goles_equipo1 ?? 0} - {p.goles_equipo2 ?? 0} Oscuro</p>
                              <p className={styles.filaMeta}>{[p.lugar, fechaCorta(p.fecha)].filter(Boolean).join(' • ')}</p>
                            </div>
                            {uid && (
                              <p className={styles.figura} title="La figura del partido">
                                <Icono src="/ic-figura.webp" className={styles.figuraIcono} />
                                {figura ? (
                                  <Link href={linkJugador(figura)} className={styles.link}>{figura.nombre}</Link>
                                ) : 'Invitado'}
                              </p>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className={styles.vacio}>Todavía no jugó partidos.</p>
                  )}
                </section>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Numero({ valor, label }: { valor: number | string; label: string }) {
  return (
    <div className={styles.numero}>
      <span className={styles.numeroValor}>{valor}</span>
      <span className={styles.numeroLabel}>{label}</span>
    </div>
  )
}

function Premio({ icono, color, titulo, detalle, jugadores, valor }: {
  icono: string; color: string; titulo: string; detalle: string; jugadores: Perfil[]; valor: string
}) {
  return (
    <div className={styles.premio}>
      <span className={styles.premioIcono} style={{ '--icono': `url(${icono})`, background: color } as React.CSSProperties} aria-hidden="true" />
      <p className={styles.premioTitulo} style={{ color }}>{titulo}</p>
      <p className={styles.premioDetalle}>{detalle}</p>
      {jugadores.length > 0 ? (
        <>
          <p className={styles.premioNombres}>
            {jugadores.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ', '}
                <Link href={linkJugador(p)} className={styles.link}>{p.nombre}</Link>
              </span>
            ))}
          </p>
          <p className={styles.premioValor}>{valor}</p>
        </>
      ) : (
        <p className={styles.premioDetalle}>Todavía nadie</p>
      )}
    </div>
  )
}

function Avatar({ perfil }: { perfil: Perfil }) {
  return (
    <span className={styles.avatar}>
      {perfil.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={perfil.avatar_url} alt="" loading="lazy" />
      ) : (
        <span>{perfil.nombre?.charAt(0)?.toUpperCase() ?? '?'}</span>
      )}
    </span>
  )
}

// Íconos de la app (PNG/WebP con transparencia) teñidos con el color del diseño
function Icono({ src, className }: { src: string; className: string }) {
  return <span className={`${styles.icono} ${className}`} style={{ '--icono': `url(${src})` } as React.CSSProperties} aria-hidden="true" />
}
