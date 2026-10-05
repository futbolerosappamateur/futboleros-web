import Link from 'next/link'
import BackLink from '../../components/BackLink'

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
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 32,
      }}>
        <BackLink href="/" style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--gold)',
          fontSize: '1.2rem',
          letterSpacing: '0.06em',
        }}>
          FUTBOLEROS
        </BackLink>
        <Link href="/admin/slides" style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-muted)',
          fontSize: '1rem',
          letterSpacing: '0.06em',
        }}>
          SLIDES
        </Link>
        <Link href="/admin/novedades" style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-muted)',
          fontSize: '1rem',
          letterSpacing: '0.06em',
        }}>
          NOVEDADES
        </Link>
        <Link href="/admin/publicidades" style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-muted)',
          fontSize: '1rem',
          letterSpacing: '0.06em',
        }}>
          PUBLICIDADES
        </Link>
      </div>
    </nav>
  )
}
