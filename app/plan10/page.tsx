import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BackLink from '../components/BackLink'
import PlanButtons from './PlanButtons'
import styles from './plan10.module.css'

const BENEFICIOS = [
  {
    titulo: 'Sin anuncios',
    descripcion: 'Disfrutá la app sin interrupciones publicitarias.',
    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />,
  },
  {
    titulo: 'Testimonios',
    descripcion: 'Escribí y recibí testimonios de tus compañeros.',
    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />,
  },
  {
    titulo: 'Tu figurita',
    descripcion: 'Una figurita vintage personalizada por mes.',
    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
  },
  {
    titulo: 'Sorteo mensual',
    descripcion: 'Participá en el sorteo del primer día de cada mes.',
    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />,
  },
  {
    titulo: 'Álbum impreso anual',
    descripcion: 'Tu equipo puede ganar el álbum impreso si más de la mitad son "10". Primera edición a finales de 2027.',
    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />,
  },
]

export default function Plan10() {
  return (
    <>
      <Header darkLinks />
      <main className={styles.page}>
        <div className={styles.inner}>
          <BackLink href="/" className={styles.back}>Inicio</BackLink>

          <div className={styles.hero}>
            <span className={styles.badge}>PLAN 10</span>
            <h1 className={styles.title}>LLEVÁ TU JUEGO<br />AL SIGUIENTE NIVEL</h1>
            <p className={styles.subtitle}>Todo lo que necesitás para destacarte en la cancha y fuera de ella.</p>
          </div>

          <div className={styles.benefits}>
            {BENEFICIOS.map(b => (
              <div key={b.titulo} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                    {b.svg}
                  </svg>
                </div>
                <div className={styles.benefitInfo}>
                  <p className={styles.benefitTitle}>{b.titulo}</p>
                  <p className={styles.benefitDesc}>{b.descripcion}</p>
                </div>
              </div>
            ))}
          </div>

          <p className={styles.plansTitle}>ELEGÍ TU PLAN</p>

          <PlanButtons />

          <p className={styles.planNote}>
            El pago es procesado de forma segura por MercadoPago. ¿Tenés dudas?{' '}
            <Link href="/contacto">Escribinos</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
