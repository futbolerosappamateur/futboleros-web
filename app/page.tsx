import Image from 'next/image'
import Link from 'next/link'
import Header from './components/Header'
import HeroSlider from './components/HeroSlider'
import FiguritaStack from './components/FiguritaStack'
import Footer from './components/Footer'
import { createClient } from '@/lib/supabase/server'
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

async function getStats() {
  const supabase = await createClient()
  const [{ count: jugadores }, { count: partidos }, { count: grupos }] = await Promise.all([
    supabase.from('perfiles').select('*', { count: 'exact', head: true }),
    supabase.from('partidos').select('*', { count: 'exact', head: true }).eq('estado', 'finalizado'),
    supabase.from('grupos').select('*', { count: 'exact', head: true }),
  ])
  return { jugadores: jugadores ?? 0, partidos: partidos ?? 0, grupos: grupos ?? 0 }
}

export default async function Home() {
  const [slides, stats] = await Promise.all([getSlides(), getStats()])

  return (
    <>
      <Header />
      <HeroSlider slides={slides} />

      {/* ── Stats ── */}
      <section className={styles.statsBar}>
        <div className={styles.statsInner}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.jugadores.toLocaleString('es-AR')}</span>
            <span className={styles.statLabel}>Jugadores</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.partidos.toLocaleString('es-AR')}</span>
            <span className={styles.statLabel}>Partidos jugados</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.grupos.toLocaleString('es-AR')}</span>
            <span className={styles.statLabel}>Grupos activos</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={styles.sectionTitle}>¿QUÉ ES FUTBOLEROS?</h2>
          <p className={styles.sectionSub}>
            La plataforma para organizar tu fútbol semanal sin el quilombo de siempre.
          </p>
          <div className={styles.featuresGrid}>
            {[
              {
                title: 'Organizá partidos',
                body: 'Programá tus partidos semanales, mandá convocatorias automáticas y manejá la lista de espera sin un solo mensaje de WhatsApp.',
              },
              {
                title: 'Seguí tus stats',
                body: 'Goles, asistencias, partidos jugados, premios del partido. Tu historial completo, partido a partido.',
              },
              {
                title: 'Conectá con jugadores',
                body: 'Buscá jugadores por zona, mirá sus figuritas y sumá nuevos cracks a tu grupo cuando alguien no puede.',
              },
            ].map(f => (
              <div key={f.title} className={styles.featureCard}>
                <Image src="/cor-left-top.webp"     alt="" width={42} height={42} className={styles.corLT} aria-hidden />
                <Image src="/cor-right-top.webp"    alt="" width={42} height={42} className={styles.corRT} aria-hidden />
                <Image src="/cor-left-bottom.webp"  alt="" width={42} height={42} className={styles.corLB} aria-hidden />
                <Image src="/cor-right-bottom.webp" alt="" width={42} height={42} className={styles.corRB} aria-hidden />
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Figurita ── */}
      <section className={styles.figurita}>
        <div className={styles.figuritaInner}>
          <div className={styles.figuritaText}>
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
      </section>

      {/* ── Partido en vivo ── */}
      <section className={styles.liveMatch}>
        <div className={styles.liveMatchInner}>
          {/* Imagen / placeholder izquierda */}
          <div className={styles.liveWidget}>
            <div className={styles.widgetHeader}>
              <span className={styles.widgetLiveTag}>
                <span className={styles.widgetDot} />
                EN VIVO
              </span>
              <span className={styles.widgetTime}>38'</span>
            </div>
            <div className={styles.widgetScore}>
              <div className={styles.widgetTeam}>
                <span className={styles.widgetTeamName}>AZUL</span>
                <span className={styles.widgetGoal}>2</span>
              </div>
              <span className={styles.widgetDash}>–</span>
              <div className={styles.widgetTeam}>
                <span className={styles.widgetTeamName}>ROJO</span>
                <span className={styles.widgetGoal}>1</span>
              </div>
            </div>
            <div className={styles.widgetEvents}>
              {[
                { time: "34'", name: 'Limay U.' },
                { time: "21'", name: 'Ibarak F.' },
                { time: "12'", name: 'Andrés M.' },
              ].map(e => (
                <div key={e.time} className={styles.widgetEvent}>
                  <span className={styles.widgetEventTime}>{e.time}</span>
                  <span className={styles.widgetEventIcon}>⚽</span>
                  <span className={styles.widgetEventName}>{e.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Texto derecha */}
          <div className={styles.liveMatchText}>
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

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>¿LISTO PARA JUGAR?</h2>
          <p className={styles.ctaSub}>Creá tu cuenta, armá tu grupo y empezá a organizar.</p>
          <Link href="/registro" className={styles.ctaPrimaryLarge}>Crear cuenta gratis</Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
