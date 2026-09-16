import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BackLink from '../components/BackLink'
import styles from './contacto.module.css'

const OPCIONES = [
  {
    titulo: 'Soporte técnico',
    subtitulo: 'Bugs, problemas con la app',
    href: 'mailto:soporte@futboleros.com.ar?subject=Soporte Futboleros',
    color: '#2196f3',
    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.653-4.655m5.8-5.8 1.5-1.5a2.121 2.121 0 0 1 3 3l-1.5 1.5M5.587 8.659l3.03-2.496m0 0a3.75 3.75 0 1 1 5.304 5.304m-5.304-5.304L3.28 4.516" />,
  },
  {
    titulo: 'Consultas y Plan 10',
    subtitulo: 'Info sobre funcionalidades y planes',
    href: 'mailto:contacto@futboleros.com.ar?subject=Consulta Futboleros',
    color: '#c9a84c',
    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />,
  },
  {
    titulo: 'Facebook',
    subtitulo: 'futboleros.amateur',
    href: 'https://www.facebook.com/futboleros.amateur',
    color: '#2196f3',
    svg: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
    filled: true,
  },
  {
    titulo: 'Instagram',
    subtitulo: '@futboleros.app',
    href: 'https://www.instagram.com/futboleros.app/',
    color: '#e63946',
    svg: <>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </>,
    filled: true,
  },
  {
    titulo: 'TikTok',
    subtitulo: '@futboleros.app',
    href: 'https://www.tiktok.com/@futboleros.app',
    color: '#00e5ff',
    svg: <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />,
  },
  {
    titulo: 'WhatsApp',
    subtitulo: '+54 11 5134-8909',
    href: 'https://wa.me/541151348909',
    color: '#4caf50',
    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.556 0 8.25-3.694 8.25-8.25S16.556 3.75 12 3.75 3.75 7.444 3.75 12c0 1.516.41 2.935 1.128 4.155L3.75 20.25l4.138-1.093A8.22 8.22 0 0 0 12 20.25Z" />,
  },
]

export default function Contacto() {
  return (
    <>
      <Header darkLinks />
      <main className={styles.page}>
        <div className={styles.inner}>
          <BackLink href="/" className={styles.back}>Inicio</BackLink>
          <h1 className={styles.title}>CONTACTO</h1>
          <p className={styles.subtitle}>¿En qué te podemos ayudar?</p>
          <div className={styles.grid}>
            {OPCIONES.map(op => (
              <a key={op.titulo} href={op.href} target={op.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer" className={styles.card}>
                <div className={styles.iconWrap} style={{ backgroundColor: op.color + '22', borderColor: op.color + '55' }}>
                  <svg
                    width="22" height="22"
                    viewBox="0 0 24 24"
                    fill={op.filled ? op.color : 'none'}
                    stroke={op.filled ? 'none' : op.color}
                    strokeWidth="1.5"
                  >
                    {op.svg}
                  </svg>
                </div>
                <div className={styles.info}>
                  <span className={styles.cardTitle}>{op.titulo}</span>
                  <span className={styles.cardSub}>{op.subtitulo}</span>
                </div>
                <span className={styles.arrow}>›</span>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
