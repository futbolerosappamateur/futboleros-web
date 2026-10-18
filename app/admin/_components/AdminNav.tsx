import Link from 'next/link'
import BackLink from '../../components/BackLink'

// Primero lo mismo que el panel de admin de la app; después lo que se carga en la web
const PANEL = [
  { href: '/admin', texto: 'ESTADÍSTICAS' },
  { href: '/admin/usuarios', texto: 'USUARIOS' },
  { href: '/admin/grupos', texto: 'GRUPOS' },
  { href: '/admin/sorteos', texto: 'SORTEOS' },
]
const WEB = [
  { href: '/admin/slides', texto: 'SLIDES' },
  { href: '/admin/novedades', texto: 'NOVEDADES' },
  { href: '/admin/publicidades', texto: 'PUBLICIDADES' },
  { href: '/admin/newsletter', texto: 'NEWSLETTER' },
]

const enlace: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  color: 'var(--text-muted)',
  fontSize: '1rem',
  letterSpacing: '0.06em',
}

export default function AdminNav() {
  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--gold-border)',
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        minHeight: 56,
        padding: '10px 0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 22,
        rowGap: 8,
      }}>
        <BackLink href="/" style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--gold)',
          fontSize: '1.2rem',
          letterSpacing: '0.06em',
        }}>
          FUTBOLEROS
        </BackLink>
        {PANEL.map(l => <Link key={l.href} href={l.href} style={enlace}>{l.texto}</Link>)}
        <span aria-hidden="true" style={{ width: 1, height: 18, background: 'var(--gold-border)' }} />
        {WEB.map(l => <Link key={l.href} href={l.href} style={enlace}>{l.texto}</Link>)}
      </div>
    </nav>
  )
}
