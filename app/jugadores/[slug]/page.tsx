import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import ParallaxHero from '../../components/ParallaxHero'
import AvatarModal from './AvatarModal'
import { createServiceClient } from '@/lib/supabase/service'
import styles from './jugador.module.css'

export const revalidate = 60

const PERFIL_FIELDS = 'id, nombre, nombre_figurita, apodo, username, avatar_url, imagen_ia, estilo_juego, caracteristicas, plan, pais, fecha_nacimiento, altura, hincha_de, idolo, es_pro, descripcion_propia'
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

const PAISES: Record<string, string> = {
  AR: 'Argentina', BR: 'Brasil', UY: 'Uruguay', PY: 'Paraguay', CL: 'Chile',
  CO: 'Colombia', PE: 'Perú', BO: 'Bolivia', VE: 'Venezuela', EC: 'Ecuador',
  MX: 'México', ES: 'España', IT: 'Italia', DE: 'Alemania', FR: 'Francia',
  PT: 'Portugal', GB: 'Inglaterra', US: 'EE.UU.',
}

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

  const [{ data: statsData }, { data: historial }, { data: testimonios }] =
    await Promise.all([

      supabase.rpc('get_stats_globales', { p_usuario_id: id }),

      supabase
        .from('estadisticas')
        .select('goles, asistencias, nota_admin, resultado, es_figura, partidos(fecha, lugar, grupos(nombre))')
        .eq('usuario_id', id)
        .order('id', { ascending: false })
        .limit(8),

      supabase
        .from('testimonios')
        .select('id, texto, creado_en, autor_id, perfiles!autor_id(nombre, avatar_url)')
        .eq('destinatario_id', id)
        .eq('estado', 'aprobado')
        .order('creado_en', { ascending: false })
        .limit(6),
    ])


  const stats = statsData && (statsData.partidos ?? 0) > 0 ? statsData : null
  const premios = statsData ? {
    figura: statsData.figura ?? 0,
    palo: statsData.palo ?? 0,
    lenador: statsData.lenador ?? 0,
  } : null
  const edad = perfil.fecha_nacimiento ? calcEdad(perfil.fecha_nacimiento) : null
  const tags: string[] = (perfil.caracteristicas ?? []).slice(0, 8)
  const apodo: string = perfil.apodo?.trim() ?? ''
  const estilo: string = (perfil.estilo_juego?.[0] ?? '').replace(/[^\p{L}\s]/gu, '').trim()
  const tenis = (testimonios ?? []) as any[]

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
                      alt={PAISES[perfil.pais] ?? perfil.pais}
                      title={PAISES[perfil.pais] ?? perfil.pais}
                      className={styles.fichaBandera}
                    />
                  </div>
                )}
                {estilo && <p className={styles.fichaEstilo}>{estilo}</p>}
              </aside>
            )}

            <div className={styles.main}>

              {/* Info personal */}
              {(perfil.hincha_de || perfil.idolo) && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Perfil</h2>
                  <div className={styles.infoGrid}>
                    {perfil.hincha_de && <InfoItem label="Hincha de" value={perfil.hincha_de} />}
                    {perfil.idolo && <InfoItem label="Ídolo" value={perfil.idolo} />}
                  </div>
                </section>
              )}

              {/* Stats */}
              {stats && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Estadísticas</h2>

                  <div className={styles.ratingCard}>
                    <div className={styles.ratingMain}>
                      <p className={styles.ratingLabel}>RATING GLOBAL</p>
                      <p className={styles.ratingNum}>{parseFloat(stats.rating).toFixed(1)}</p>
                    </div>
                    <div className={styles.gepRow}>
                      <div className={styles.gepItem}>
                        <span className={styles.gepLetraG}>G</span>
                        <span className={styles.gepVal}>{stats.ganados}</span>
                      </div>
                      <div className={styles.gepItem}>
                        <span className={styles.gepLetraE}>E</span>
                        <span className={styles.gepVal}>{stats.empatados}</span>
                      </div>
                      <div className={styles.gepItem}>
                        <span className={styles.gepLetraP}>P</span>
                        <span className={styles.gepVal}>{stats.perdidos}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.statsGrid}>
                    <StatCard value={stats.partidos} label="Partidos" />
                    <StatCard value={stats.goles} label="Goles" />
                    <StatCard value={stats.asistencias} label="Asistencias" />
                    <StatCard
                      value={`${stats.partidos > 0 ? Math.round(stats.ganados / stats.partidos * 100) : 0}%`}
                      label="% Ganados"
                    />
                    <StatCard
                      value={stats.partidos > 0 ? (stats.goles / stats.partidos).toFixed(2) : '0.00'}
                      label="Goles/partido"
                    />
                  </div>

                  {/* Premios */}
                  {premios && (premios.figura + premios.palo + premios.lenador) > 0 && (
                    <div className={styles.premiosRow}>
                      {premios.figura > 0 && (
                        <div className={styles.premioCard}>
                          <span className={styles.premioEmoji}>⭐</span>
                          <span className={styles.premioNum}>{premios.figura}</span>
                          <span className={styles.premioLabel}>La figura</span>
                        </div>
                      )}
                      {premios.palo > 0 && (
                        <div className={styles.premioCard}>
                          <span className={styles.premioEmoji}>🪵</span>
                          <span className={styles.premioNum}>{premios.palo}</span>
                          <span className={styles.premioLabel}>El tronco</span>
                        </div>
                      )}
                      {premios.lenador > 0 && (
                        <div className={styles.premioCard}>
                          <span className={styles.premioEmoji}>🪓</span>
                          <span className={styles.premioNum}>{premios.lenador}</span>
                          <span className={styles.premioLabel}>El leñador</span>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Historial */}
              {(historial ?? []).length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Últimos partidos</h2>
                  <div className={styles.historialList}>
                    {(historial as any[]).map((e, i) => {
                      const color = e.resultado === 'ganado' ? '#4caf50' : e.resultado === 'perdido' ? '#e63946' : '#ff9800'
                      const letra = e.resultado === 'ganado' ? 'G' : e.resultado === 'perdido' ? 'P' : 'E'
                      const fecha = e.partidos?.fecha
                        ? new Date(e.partidos.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                        : ''
                      return (
                        <div key={i} className={styles.historialRow}>
                          <span className={styles.historialLetra} style={{ color, borderColor: color + '55', background: color + '15' }}>
                            {letra}
                          </span>
                          <div className={styles.historialInfo}>
                            <p className={styles.historialGrupo}>{e.partidos?.grupos?.nombre ?? 'Grupo'}</p>
                            <p className={styles.historialMeta}>{[e.partidos?.lugar, fecha].filter(Boolean).join(' · ')}</p>
                          </div>
                          <div className={styles.historialStats}>
                            {e.goles > 0 && <span className={styles.hStat}>{e.goles}G</span>}
                            {e.asistencias > 0 && <span className={styles.hStat}>{e.asistencias}A</span>}
                            {e.nota_admin && <span className={styles.hNota}>{Number(e.nota_admin).toFixed(1)}</span>}
                            {e.es_figura && <span className={styles.hFigura}>FIG</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Testimonios */}
              {tenis.length > 0 && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Testimonios</h2>
                  <div className={styles.testimoniosList}>
                    {tenis.map((t: any) => (
                      <div key={t.id} className={styles.testimonioCard}>
                        {t.perfiles?.avatar_url ? (
                          <Image
                            src={t.perfiles.avatar_url}
                            alt={t.perfiles.nombre}
                            width={36}
                            height={36}
                            className={styles.testimonioAvatar}
                            unoptimized
                          />
                        ) : (
                          <div className={styles.testimonioAvatarPlaceholder}>
                            {t.perfiles?.nombre?.charAt(0) ?? '?'}
                          </div>
                        )}
                        <div className={styles.testimonioBody}>
                          <p className={styles.testimonioAutor}>{t.perfiles?.nombre ?? 'Jugador'}</p>
                          <p className={styles.testimonioTexto}>{t.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
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

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
