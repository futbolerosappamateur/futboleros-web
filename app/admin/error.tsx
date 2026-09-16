'use client'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center', fontFamily: 'var(--font-display)' }}>
      <p style={{ color: '#ff6b6b', fontSize: '1.1rem', marginBottom: 8 }}>Error</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24, fontFamily: 'monospace' }}>
        {error.message || 'Error desconocido'}
      </p>
      <button
        onClick={reset}
        style={{
          background: 'var(--gold)',
          color: '#0a0a1a',
          border: 'none',
          padding: '10px 24px',
          borderRadius: 8,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.06em',
          cursor: 'pointer',
        }}
      >
        REINTENTAR
      </button>
    </div>
  )
}
