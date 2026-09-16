import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BackLink from '../../components/BackLink'
import { createServiceClient } from '@/lib/supabase/service'
import styles from './jugador.module.css'

export const revalidate = 60

const PAISES: Record<string, string> = {
  AR: 'Argentina', BR: 'Brasil', UY: 'Uruguay', PY: 'Paraguay', CL: 'Chile',
  CO: 'Colombia', PE: 'Perú', BO: 'Bolivia', VE: 'Venezuela', EC: 'Ecuador',
  MX: 'México', ES: 'España', IT: 'Italia', DE: 'Alemania', FR: 'Francia',
  PT: 'Portugal', GB: 'Inglaterra', US: 'EE.UU.',
}

function flagEmoji(iso: string) {
  return iso.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  )
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

  // Try username first, fall back to id
  let { data: perfil } = await supabase
    .from('perfiles')
    .select('id, nombre, nombre_figurita, apodo, username, avatar_url, imagen_ia, estilo_juego, caracteristicas, plan, pais, fecha_nacimiento, altura, hincha_de, idolo, es_pro, descripcion_propia')
    .eq('username', slug)
    .maybeSingle()

  if (!perfil) {
    const res = await supabase
      .from('perfiles')
      .select('id, nombre, nombre_figurita, apodo, username, avatar_url, imagen_ia, estilo_juego, caracteristicas, plan, pais, fecha_nacimiento, altura, hincha_de, idolo, es_pro, descripcion_propia')
      .eq('id', slug)
      .maybeSingle()
    perfil = res.data
  }

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
  const tags = [...(perfil.estilo_juego ?? []), ...(perfil.caracteristicas ?? [])].slice(0, 5)
  const tenis = (testimonios ?? []) as any[]

  return (
    <>
      <Header />
      <main className={styles.page}>

        {/* ── Hero ── */}
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <BackLink href="/jugadores" className={styles.back}>Jugadores</BackLink>

            <div className={styles.profile}>
              {/* Figurita o avatar */}
              {perfil.imagen_ia ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/figurita/${perfil.id}`}
                  alt={`Figurita de ${perfil.nombre}`}
                  className={styles.figurita}
                />
              ) : perfil.avatar_url ? (
                <Image
                  src={perfil.avatar_url}
                  alt={perfil.nombre}
                  width={120}
                  height={120}
                  className={styles.avatar}
                  unoptimized
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <span>{perfil.nombre?.charAt(0)?.toUpperCase()}</span>
                </div>
              )}

              <div className={styles.profileInfo}>
                <h1 className={styles.nombre}>
                  {perfil.nombre}
                  {perfil.plan === 10 && (
                    <svg className={styles.starIcon} viewBox="0 0 24 24" fill="currentColor" aria-label="Plan 10">
                      <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z" />
                    </svg>
                  )}
                </h1>
                {perfil.apodo && <p className={styles.apodo}>"{perfil.apodo}"</p>}
                {perfil.username && <p className={styles.username}>@{perfil.username}</p>}
                {tags.length > 0 && (
                  <div className={styles.tags}>
                    {tags.map((t, i) => (
                      <span key={i} className={styles.tag}>{t.replace(/[^\p{L}\s]/gu, '').trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          <div className={styles.inner}>

            {/* Info personal */}
            {(edad || perfil.altura || perfil.pais || perfil.hincha_de || perfil.idolo) && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Perfil</h2>
                <div className={styles.infoGrid}>
                  {edad && <InfoItem label="Edad" value={`${edad} años`} />}
                  {perfil.altura && <InfoItem label="Altura" value={`${(perfil.altura / 100).toFixed(2)} m`} />}
                  {perfil.pais && (
                    <InfoItem
                      label="País"
                      value={`${flagEmoji(perfil.pais)} ${PAISES[perfil.pais] ?? perfil.pais}`}
                    />
                  )}
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

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
