// Replicates the app's FiguritaCard layout.
// Card canvas: 629 × 907 px. All positions are scaled proportionally.

type Props = {
  perfil: {
    nombre?: string | null
    nombre_figurita?: string | null
    apodo?: string | null
    imagen_ia?: string | null
    pais?: string | null
    fecha_nacimiento?: string | null
    altura?: number | null
    estilo_juego?: string[] | null
    descripcion_propia?: string | null
  }
  width?: number
}

function flagEmoji(iso: string) {
  return iso.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  )
}

function calcEdad(fechaNac: string): string {
  const [y, m, d] = fechaNac.split('-').map(Number)
  const hoy = new Date()
  let e = hoy.getFullYear() - y
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e--
  return String(e)
}

export default function FiguritaCard({ perfil, width = 260 }: Props) {
  const s = width / 629          // scale factor
  const height = Math.round(width * 907 / 629)

  const nombre   = perfil.nombre_figurita?.trim() || perfil.nombre?.split(' ')[0] || 'Nombre'
  const apodo    = perfil.apodo || ''
  const posicion = (perfil.estilo_juego?.[0] || '').replace(/[^\p{L}\s]/gu, '').trim().toUpperCase() || '—'
  const pais     = perfil.pais || 'AR'
  const quote    = (perfil.descripcion_propia || '').slice(0, 28)
  const edad     = perfil.fecha_nacimiento ? calcEdad(perfil.fecha_nacimiento) : '—'
  const alturaStr = perfil.altura
    ? `${Math.floor(perfil.altura / 100)},${String(perfil.altura % 100).padStart(2, '0')}`
    : '—'

  const px = (n: number) => Math.round(n * s)

  const bebasLabel: React.CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize:   px(19),
    color:      '#1a0f03',
    letterSpacing: '0.5px',
    lineHeight: 1,
    position:   'absolute',
  }
  const bebasValue: React.CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize:   px(42),
    color:      '#1a0f03',
    lineHeight: 1,
    position:   'absolute',
  }

  return (
    <div style={{ width, height, position: 'relative', borderRadius: px(54), overflow: 'hidden', flexShrink: 0 }}>

      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#022232' }} />

      {/* Player photo */}
      {perfil.imagen_ia && (
        <div style={{ position: 'absolute', left: 0, top: px(143), width, height: px(630), overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={perfil.imagen_ia}
            alt=""
            aria-hidden
            style={{
              position:  'absolute',
              top:       -px(40),
              left:      -Math.round(width * 0.175),
              width:     Math.round(width * 1.35),
              height:    Math.round(width * 2.025),
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Country flag emoji */}
      <span style={{
        position:   'absolute',
        left:       px(506),
        top:        px(638),
        fontSize:   px(38),
        lineHeight: 1,
      }}>
        {flagEmoji(pais)}
      </span>

      {/* Marco overlay — stretches to fill exactly */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/marco-figurita.webp"
        alt=""
        aria-hidden
        style={{ position: 'absolute', top: 0, left: 0, width, height, objectFit: 'fill' }}
      />

      {/* Name + apodo */}
      <div style={{
        position:       'absolute',
        left:           px(12),
        right:          px(12),
        top:            px(76),
        display:        'flex',
        alignItems:     'flex-end',
        justifyContent: 'center',
        gap:            px(8),
      }}>
        <span style={{
          fontFamily:  'Limelight, serif',
          fontSize:    px(58),
          color:       '#F8D8A7',
          textShadow:  `${px(4)}px ${px(2)}px 1px rgba(25,99,114,0.81)`,
          lineHeight:  1,
          overflow:    'hidden',
          whiteSpace:  'nowrap',
          textOverflow:'ellipsis',
        }}>
          {nombre}
        </span>
        {apodo && (
          <span style={{
            fontFamily:  '"Playfair Display", serif',
            fontStyle:   'italic',
            fontSize:    px(30),
            color:       '#F8D8A7',
            marginBottom: px(6),
            textShadow:  `${px(3)}px 0px 1px rgba(25,99,114,0.81)`,
            whiteSpace:  'nowrap',
          }}>
            {apodo}
          </span>
        )}
      </div>

      {/* EDAD */}
      <span style={{ ...bebasLabel, left: px(254), top: px(782) }}>EDAD</span>
      <span style={{ ...bebasValue, left: px(252), top: px(801) }}>{edad}</span>

      {/* ALTURA */}
      <span style={{ ...bebasLabel, left: px(352), top: px(784) }}>ALTURA</span>
      <span style={{ ...bebasValue, left: px(350), top: px(803) }}>{alturaStr}</span>

      {/* CÓMO JUEGA */}
      <span style={{ ...bebasLabel, left: px(472), top: px(792) }}>CÓMO JUEGA</span>
      <span style={{ ...bebasLabel, left: px(472), top: px(811), fontSize: px(24) }}>{posicion}</span>

      {/* Quote */}
      {quote && (
        <span style={{
          position:   'absolute',
          left:       0,
          top:        px(841),
          width,
          fontFamily: 'Georgia, serif',
          fontSize:   px(20),
          color:      '#1a0f03',
          textAlign:  'center',
          display:    'block',
          padding:    `0 ${px(12)}px`,
          overflow:   'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}>
          {quote}
        </span>
      )}
    </div>
  )
}
