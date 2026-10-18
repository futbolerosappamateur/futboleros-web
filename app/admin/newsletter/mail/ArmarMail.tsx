'use client'

import { useEffect, useRef, useState } from 'react'
import { armarMail, type CabeceraMail, type NovedadMail, type SeccionesMail } from '@/lib/newsletter-mail'
import { subirCabeceraMail } from '../../_actions/newsletter'

type Modelo = { vistaPrevia: string; titulo: string; texto: string; secciones: SeccionesMail; novedades: number }

// Dos puntos de partida: el del lanzamiento (como la home) y el de cada envío de novedades
const LANZAMIENTO: Modelo = {
  vistaPrevia: 'La app para organizar tu fútbol semanal: convocatorias automáticas, estadísticas, premios y tu propia figurita.',
  titulo: '¡LLEGÓ FUTBOLEROS!',
  texto: 'Ya está disponible Futboleros, la app para organizar tu fútbol semanal.\n\n'
    + 'Armás el grupo, programás el partido y la convocatoria sale sola. Mientras juegan se cargan los goles y las asistencias, '
    + 'y al final cada uno suma sus estadísticas, su puntaje y sus premios. Porque hasta el fulbito de los jueves merece estadísticas.',
  secciones: { queEs: true, comoFunciona: true, app: true, figurita: true, enVivo: true, cierre: true },
  novedades: 0,
}
const NOVEDADES: Modelo = {
  vistaPrevia: 'Lo último de Futboleros: novedades de la app y de la web.',
  titulo: 'NOVEDADES DE FUTBOLEROS',
  texto: 'Te contamos lo último que pasó en la app y en la web.',
  secciones: { queEs: false, comoFunciona: false, app: false, figurita: false, enVivo: false, cierre: true },
  novedades: 3,
}

const SECCIONES: { clave: keyof SeccionesMail; nombre: string }[] = [
  { clave: 'queEs', nombre: '¿Qué es Futboleros?' },
  { clave: 'comoFunciona', nombre: 'Cómo funciona' },
  { clave: 'app', nombre: 'La app (tres pantallas)' },
  { clave: 'figurita', nombre: 'Tu figurita (Plan 10)' },
  { clave: 'enVivo', nombre: 'El partido en vivo' },
  { clave: 'cierre', nombre: '¿Listo para jugar? (crear cuenta y bajar la app)' },
]

const etiqueta: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.85rem',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
}
const campo: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--gold-border)',
  borderRadius: 6,
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: '0.95rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  width: '100%',
}
const casilla: React.CSSProperties = { width: 18, height: 18, accentColor: 'var(--gold)', cursor: 'pointer', flexShrink: 0 }
const fila: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', cursor: 'pointer' }
const botonChico = (activo: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontSize: '0.9rem',
  letterSpacing: '0.08em',
  padding: '8px 16px 6px',
  borderRadius: 6,
  border: '1px solid var(--gold-border)',
  background: activo ? 'var(--gold)' : 'none',
  color: activo ? '#0a0a1a' : 'var(--text-muted)',
})

const miniatura = (elegida: boolean): React.CSSProperties => ({
  padding: 3,
  borderRadius: 6,
  border: `2px solid ${elegida ? 'var(--gold)' : 'transparent'}`,
  background: 'none',
})

export default function ArmarMail({ novedades, cabeceras, sitio, googlePlay }: {
  novedades: NovedadMail[]
  cabeceras: CabeceraMail[]
  sitio: string
  googlePlay: string
}) {
  const [cabecera, setCabecera] = useState<CabeceraMail | null>(null)
  const [subidas, setSubidas] = useState(cabeceras)
  const [subiendo, setSubiendo] = useState(false)
  const [vistaPrevia, setVistaPrevia] = useState(LANZAMIENTO.vistaPrevia)
  const [titulo, setTitulo] = useState(LANZAMIENTO.titulo)
  const [texto, setTexto] = useState(LANZAMIENTO.texto)
  const [secciones, setSecciones] = useState(LANZAMIENTO.secciones)
  const [elegidas, setElegidas] = useState<string[]>([])
  const [ancho, setAncho] = useState(600)
  const [origen, setOrigen] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const marco = useRef<HTMLIFrameElement>(null)
  const scroll = useRef(0)

  // La vista previa toma las imágenes de esta misma web: en la PC se ven aunque public/mail no esté subida
  useEffect(() => setOrigen(window.location.origin), [])

  const usar = (m: Modelo) => {
    setVistaPrevia(m.vistaPrevia)
    setTitulo(m.titulo)
    setTexto(m.texto)
    setSecciones(m.secciones)
    setElegidas(novedades.slice(0, m.novedades).map(n => n.slug))
  }

  // Las novedades van en el orden de la lista (la más nueva primero): la primera marcada sale grande
  const contenido = { vistaPrevia, cabecera, titulo, texto, secciones, novedades: novedades.filter(n => elegidas.includes(n.slug)) }
  const html = armarMail(contenido, { sitio, googlePlay })
  const vista = origen ? armarMail(contenido, { sitio, googlePlay, imagenes: origen }) : ''
  const peso = Math.round(new Blob([html]).size / 1024)

  // Cada cambio recarga la vista previa: se va anotando por dónde estaba y al recargar se vuelve ahí
  const alCargar = () => {
    const w = marco.current?.contentWindow
    if (!w) return
    w.scrollTo(0, scroll.current)
    w.addEventListener('scroll', () => { scroll.current = w.scrollY })
  }

  // La imagen se achica y se pasa a JPG en el servidor; queda en la lista para los próximos mails
  const subir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''   // así se puede volver a elegir el mismo archivo
    if (!archivo) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('file', archivo)
      const nueva = await subirCabeceraMail(fd)
      setSubidas([nueva, ...subidas])
      setCabecera(nueva)
    } catch {
      alert('No se pudo subir la imagen. Probá de nuevo.')
    } finally {
      setSubiendo(false)
    }
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(html)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      alert('No se pudo copiar. Probá de nuevo.')
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={etiqueta}>EMPEZAR DESDE:</span>
          <button type="button" style={botonChico(false)} onClick={() => usar(LANZAMIENTO)}>LANZAMIENTO</button>
          <button type="button" style={botonChico(false)} onClick={() => usar(NOVEDADES)}>NOVEDADES</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={etiqueta}>CABECERA</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {[null, ...subidas].map(c => (
              <button
                key={c?.url ?? 'vestuario'}
                type="button"
                title={c ? 'Cabecera subida' : 'El vestuario (la de siempre)'}
                onClick={() => setCabecera(c)}
                style={miniatura(cabecera?.url === c?.url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c?.url ?? '/mail/cabecera.jpg'} alt="" style={{ display: 'block', width: 104, height: 52, objectFit: 'cover', borderRadius: 3 }} />
              </button>
            ))}
            <label style={{ ...botonChico(false), cursor: subiendo ? 'wait' : 'pointer' }}>
              {subiendo ? 'SUBIENDO…' : '+ SUBIR'}
              <input type="file" accept="image/*" onChange={subir} disabled={subiendo} style={{ display: 'none' }} />
            </label>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Va arriba de todo, a lo ancho del mail. Ideal: horizontal, de 1200 px de ancho o más. Se guarda en JPG y,
            si es más alta que ancha, se recorta al centro.
          </span>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={etiqueta}>VISTA PREVIA EN LA BANDEJA</span>
          <input style={campo} value={vistaPrevia} onChange={e => setVistaPrevia(e.target.value)} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>El renglón que se ve al lado del asunto, antes de abrir el mail.</span>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={etiqueta}>TÍTULO</span>
          <input style={campo} value={titulo} onChange={e => setTitulo(e.target.value)} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={etiqueta}>TEXTO</span>
          <textarea style={{ ...campo, minHeight: 170, resize: 'vertical', lineHeight: 1.5 }} value={texto} onChange={e => setTexto(e.target.value)} />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Dejá una línea en blanco entre párrafos. Sin título ni texto, el mail arranca en la primera sección.</span>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={etiqueta}>SECCIONES DE LA HOME</span>
          {SECCIONES.map(s => (
            <label key={s.clave} style={fila}>
              <input
                type="checkbox"
                style={casilla}
                checked={secciones[s.clave]}
                onChange={e => setSecciones({ ...secciones, [s.clave]: e.target.checked })}
              />
              {s.nombre}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={etiqueta}>NOVEDADES (LA PRIMERA MARCADA VA GRANDE)</span>
          {novedades.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay novedades publicadas.</p>}
          {novedades.map(n => (
            <label key={n.slug} style={{ ...fila, alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                style={{ ...casilla, marginTop: 2 }}
                checked={elegidas.includes(n.slug)}
                onChange={e => setElegidas(e.target.checked ? [...elegidas, n.slug] : elegidas.filter(s => s !== n.slug))}
              />
              <span>
                {n.titulo}
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.fecha}</span>
              </span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, borderTop: '1px solid var(--gold-border)' }}>
          <button
            type="button"
            onClick={copiar}
            style={{
              alignSelf: 'flex-start',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              letterSpacing: '0.08em',
              background: 'var(--gold)',
              color: '#0a0a1a',
              padding: '12px 28px 10px',
              borderRadius: 8,
              marginTop: 12,
            }}
          >
            {copiado ? '¡COPIADO!' : 'COPIAR EL HTML'}
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Pesa {peso} KB (Gmail corta los mails de más de 102 KB). En el plugin, creá la newsletter con la opción
            «Raw HTML» y pegalo ahí: en el editor de bloques el código de arriba aparece como texto. Poné el asunto y
            mandate una prueba antes de enviarla. El link para darse de baja y el de «ver en el navegador» los
            completa el plugin.
          </p>
        </div>
      </div>

      <div style={{ flex: '0 1 auto', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: '100%' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={botonChico(ancho === 600)} onClick={() => setAncho(600)}>COMPU</button>
          <button type="button" style={botonChico(ancho === 375)} onClick={() => setAncho(375)}>CELULAR</button>
        </div>
        {vista && (
          <iframe
            ref={marco}
            title="Vista previa del mail"
            srcDoc={vista}
            onLoad={alCargar}
            style={{ width: ancho, maxWidth: '100%', height: 820, border: '1px solid var(--gold-border)', borderRadius: 10, background: '#fff' }}
          />
        )}
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 600 }}>
          Gmail y Outlook no cargan la letra de Futboleros: ahí los títulos salen con una parecida.
        </p>
      </div>
    </div>
  )
}
