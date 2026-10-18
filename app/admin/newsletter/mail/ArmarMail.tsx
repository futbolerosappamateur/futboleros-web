'use client'

import { useEffect, useRef, useState } from 'react'
import {
  armarMail,
  type BloqueLibre,
  type BotonMail,
  type ClaveSeccion,
  type FondoBloque,
  type ImagenMail,
  type NovedadMail,
} from '@/lib/newsletter-mail'
import { subirImagenMail } from '../../_actions/newsletter'

// El orden de la home; en la pantalla se cambia con las flechas
const ORDEN: ClaveSeccion[] = ['queEs', 'comoFunciona', 'app', 'figurita', 'enVivo', 'novedades', 'bloque', 'cierre']

const NOMBRES: Record<ClaveSeccion, string> = {
  queEs: '¿Qué es Futboleros?',
  comoFunciona: 'Cómo funciona',
  app: 'La app (tres pantallas)',
  figurita: 'Tu figurita (Plan 10)',
  enVivo: 'El partido en vivo',
  novedades: 'Últimas novedades',
  bloque: 'Bloque libre (imagen, texto y botón)',
  cierre: '¿Listo para jugar? (crear cuenta y bajar la app)',
}

type Modelo = { vistaPrevia: string; titulo: string; texto: string; activas: ClaveSeccion[]; novedades: number }

// Dos puntos de partida: el del lanzamiento (como la home) y el de cada envío de novedades
const LANZAMIENTO: Modelo = {
  vistaPrevia: 'La app para organizar tu fútbol semanal: convocatorias automáticas, estadísticas, premios y tu propia figurita.',
  titulo: '¡LLEGÓ FUTBOLEROS!',
  texto: 'Ya está disponible Futboleros, la app para organizar tu fútbol semanal.\n\n'
    + 'Armás el grupo, programás el partido y la convocatoria sale sola. Mientras juegan se cargan los goles y las asistencias, '
    + 'y al final cada uno suma sus estadísticas, su puntaje y sus premios. Porque hasta el fulbito de los jueves merece estadísticas.',
  activas: ['queEs', 'comoFunciona', 'app', 'figurita', 'enVivo', 'cierre'],
  novedades: 0,
}
const NOVEDADES: Modelo = {
  vistaPrevia: 'Lo último de Futboleros: novedades de la app y de la web.',
  titulo: 'NOVEDADES DE FUTBOLEROS',
  texto: 'Te contamos lo último que pasó en la app y en la web.',
  activas: ['novedades', 'cierre'],
  novedades: 3,
}

const seccionesDe = (m: Modelo) => ORDEN.map(clave => ({ clave, activa: m.activas.includes(clave) }))

const BLOQUE_VACIO: BloqueLibre = { imagen: null, titulo: '', texto: '', boton: { texto: '', url: '' }, fondo: 'oscuro' }
const FONDOS: { valor: FondoBloque; nombre: string }[] = [
  { valor: 'oscuro', nombre: 'OSCURO' },
  { valor: 'blanco', nombre: 'BLANCO' },
  { valor: 'dorado', nombre: 'DORADO' },
]

const etiqueta: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '0.85rem',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
}
const ayuda: React.CSSProperties = { fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }
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
const flecha = (habilitada: boolean): React.CSSProperties => ({
  width: 30,
  height: 30,
  borderRadius: 6,
  border: '1px solid var(--gold-border)',
  color: habilitada ? 'var(--text)' : 'var(--surface-2)',
  cursor: habilitada ? 'pointer' : 'default',
  flexShrink: 0,
})
const miniatura = (elegida: boolean): React.CSSProperties => ({
  padding: 3,
  borderRadius: 6,
  border: `2px solid ${elegida ? 'var(--gold)' : 'transparent'}`,
  background: 'none',
})

// Miniaturas de las imágenes subidas más una fija (el vestuario o "sin imagen"), y el botón para subir otra.
// La imagen se achica y se pasa a JPG en el servidor; queda en la lista para los próximos mails
function ElegirImagen({ elegida, onElegir, subidas, onSubida, fija }: {
  elegida: ImagenMail | null
  onElegir: (imagen: ImagenMail | null) => void
  subidas: ImagenMail[]
  onSubida: (imagen: ImagenMail) => void
  fija: { titulo: string; src: string | null }   // src null: un recuadro que dice "SIN IMAGEN"
}) {
  const [subiendo, setSubiendo] = useState(false)

  const subir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''   // así se puede volver a elegir el mismo archivo
    if (!archivo) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('file', archivo)
      const nueva = await subirImagenMail(fd)
      onSubida(nueva)
      onElegir(nueva)
    } catch {
      alert('No se pudo subir la imagen. Probá de nuevo.')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {[null, ...subidas].map(c => (
        <button
          key={c?.url ?? 'fija'}
          type="button"
          title={c ? 'Imagen subida' : fija.titulo}
          onClick={() => onElegir(c)}
          style={miniatura(elegida?.url === c?.url)}
        >
          {c || fija.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c?.url ?? fija.src ?? ''} alt="" style={{ display: 'block', width: 104, height: 52, objectFit: 'cover', borderRadius: 3 }} />
          ) : (
            <span style={{ ...etiqueta, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 104, height: 52, border: '1px dashed var(--gold-border)', borderRadius: 3 }}>
              SIN IMAGEN
            </span>
          )}
        </button>
      ))}
      <label style={{ ...botonChico(false), cursor: subiendo ? 'wait' : 'pointer' }}>
        {subiendo ? 'SUBIENDO…' : '+ SUBIR'}
        <input type="file" accept="image/*" onChange={subir} disabled={subiendo} style={{ display: 'none' }} />
      </label>
    </div>
  )
}

export default function ArmarMail({ novedades, imagenes, sitio, googlePlay }: {
  novedades: NovedadMail[]
  imagenes: ImagenMail[]
  sitio: string
  googlePlay: string
}) {
  // Los botones de arriba arrancan como en la home: bajar la app y entrar a la web
  const botonesIniciales: BotonMail[] = [
    { texto: 'DESCARGÁ LA APP', url: googlePlay },
    { texto: 'ENTRÁ A LA WEB', url: sitio },
  ]
  const [subidas, setSubidas] = useState(imagenes)
  const [cabecera, setCabecera] = useState<ImagenMail | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState(LANZAMIENTO.vistaPrevia)
  const [titulo, setTitulo] = useState(LANZAMIENTO.titulo)
  const [texto, setTexto] = useState(LANZAMIENTO.texto)
  const [botones, setBotones] = useState(botonesIniciales)
  const [secciones, setSecciones] = useState(() => seccionesDe(LANZAMIENTO))
  const [elegidas, setElegidas] = useState<string[]>([])
  const [bloque, setBloque] = useState(BLOQUE_VACIO)
  const [ancho, setAncho] = useState(600)
  const [origen, setOrigen] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const marco = useRef<HTMLIFrameElement>(null)
  const scroll = useRef(0)

  // La vista previa toma las imágenes de esta misma web: en la PC se ven aunque public/mail no esté subida
  useEffect(() => setOrigen(window.location.origin), [])

  // Un modelo cambia los textos, los botones, las secciones (y su orden) y las novedades; la cabecera y lo
  // escrito en el bloque libre quedan
  const usar = (m: Modelo) => {
    setVistaPrevia(m.vistaPrevia)
    setTitulo(m.titulo)
    setTexto(m.texto)
    setBotones(botonesIniciales)
    setSecciones(seccionesDe(m))
    setElegidas(novedades.slice(0, m.novedades).map(n => n.slug))
  }

  const cambiarBoton = (i: number, cambio: Partial<BotonMail>) =>
    setBotones(botones.map((b, j) => (j === i ? { ...b, ...cambio } : b)))
  const activar = (i: number, activa: boolean) =>
    setSecciones(secciones.map((s, j) => (j === i ? { ...s, activa } : s)))
  const mover = (i: number, paso: -1 | 1) => {
    const j = i + paso
    if (j < 0 || j >= secciones.length) return
    const nuevas = [...secciones]
    ;[nuevas[i], nuevas[j]] = [nuevas[j], nuevas[i]]
    setSecciones(nuevas)
  }
  const cambiarBloque = (cambio: Partial<BloqueLibre>) => setBloque(b => ({ ...b, ...cambio }))
  const sumarSubida = (imagen: ImagenMail) => setSubidas(actuales => [imagen, ...actuales])

  // Las novedades van en el orden de la lista (la más nueva primero): la primera marcada sale grande
  const contenido = {
    vistaPrevia,
    cabecera,
    titulo,
    texto,
    botones,
    secciones: secciones.filter(s => s.activa).map(s => s.clave),
    novedades: novedades.filter(n => elegidas.includes(n.slug)),
    bloque,
  }
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
          <ElegirImagen
            elegida={cabecera}
            onElegir={setCabecera}
            subidas={subidas}
            onSubida={sumarSubida}
            fija={{ titulo: 'El vestuario (la de siempre)', src: '/mail/cabecera.jpg' }}
          />
          <span style={ayuda}>
            Va arriba de todo, a lo ancho del mail. Ideal: horizontal, de 1200 px de ancho o más. Se guarda en JPG y,
            si es más alta que ancha, se recorta al centro.
          </span>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={etiqueta}>VISTA PREVIA EN LA BANDEJA</span>
          <input style={campo} value={vistaPrevia} onChange={e => setVistaPrevia(e.target.value)} />
          <span style={ayuda}>El renglón que se ve al lado del asunto, antes de abrir el mail.</span>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={etiqueta}>TÍTULO</span>
          <input style={campo} value={titulo} onChange={e => setTitulo(e.target.value)} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={etiqueta}>TEXTO</span>
          <textarea style={{ ...campo, minHeight: 170, resize: 'vertical', lineHeight: 1.5 }} value={texto} onChange={e => setTexto(e.target.value)} />
          <span style={ayuda}>Dejá una línea en blanco entre párrafos. Sin título, texto ni botones, el mail arranca en la primera sección.</span>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={etiqueta}>BOTONES</span>
          {botones.map((b, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)', gap: 8 }}>
              <input style={campo} aria-label={`Texto del botón ${i + 1}`} placeholder="Texto" value={b.texto} onChange={e => cambiarBoton(i, { texto: e.target.value })} />
              <input style={campo} aria-label={`Link del botón ${i + 1}`} placeholder="Link" value={b.url} onChange={e => cambiarBoton(i, { url: e.target.value })} />
            </div>
          ))}
          <span style={ayuda}>
            El primero va dorado y el segundo con borde. Sin texto, el botón no va. El link puede ser una dirección
            completa o una página de la web, como /plan10.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={etiqueta}>SECCIONES (CON LAS FLECHAS CAMBIÁS EL ORDEN)</span>
          {secciones.map((s, i) => (
            <div key={s.clave} style={{ border: '1px solid var(--gold-border)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ ...fila, flex: 1 }}>
                  <input type="checkbox" style={casilla} checked={s.activa} onChange={e => activar(i, e.target.checked)} />
                  {NOMBRES[s.clave]}
                </label>
                <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)} style={flecha(i > 0)}>↑</button>
                <button type="button" aria-label="Bajar" disabled={i === secciones.length - 1} onClick={() => mover(i, 1)} style={flecha(i < secciones.length - 1)}>↓</button>
              </div>

              {s.activa && s.clave === 'novedades' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 28 }}>
                  <span style={ayuda}>La primera marcada va grande.</span>
                  {novedades.length === 0 && <span style={ayuda}>No hay novedades publicadas.</span>}
                  {novedades.map(n => (
                    <label key={n.slug} style={{ ...fila, alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        style={{ ...casilla, marginTop: 2 }}
                        checked={elegidas.includes(n.slug)}
                        onChange={e => setElegidas(e.target.checked ? [...elegidas, n.slug] : elegidas.filter(x => x !== n.slug))}
                      />
                      <span>
                        {n.titulo}
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.fecha}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {s.activa && s.clave === 'bloque' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 28 }}>
                  <span style={etiqueta}>IMAGEN</span>
                  <ElegirImagen
                    elegida={bloque.imagen}
                    onElegir={imagen => cambiarBloque({ imagen })}
                    subidas={subidas}
                    onSubida={sumarSubida}
                    fija={{ titulo: 'Sin imagen', src: null }}
                  />
                  <input style={campo} placeholder="Título (opcional)" value={bloque.titulo} onChange={e => cambiarBloque({ titulo: e.target.value })} />
                  <textarea
                    style={{ ...campo, minHeight: 100, resize: 'vertical', lineHeight: 1.5 }}
                    placeholder="Texto (opcional)"
                    value={bloque.texto}
                    onChange={e => cambiarBloque({ texto: e.target.value })}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)', gap: 8 }}>
                    <input style={campo} placeholder="Texto del botón" value={bloque.boton.texto} onChange={e => cambiarBloque({ boton: { ...bloque.boton, texto: e.target.value } })} />
                    <input style={campo} placeholder="Link" value={bloque.boton.url} onChange={e => cambiarBloque({ boton: { ...bloque.boton, url: e.target.value } })} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={etiqueta}>FONDO:</span>
                    {FONDOS.map(f => (
                      <button key={f.valor} type="button" style={botonChico(bloque.fondo === f.valor)} onClick={() => cambiarBloque({ fondo: f.valor })}>
                        {f.nombre}
                      </button>
                    ))}
                  </div>
                  <span style={ayuda}>Todo es opcional. La imagen va de borde a borde y lleva al link; sin texto en el botón, el link queda solo en la imagen.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fija al bajar, para ver los cambios y copiar sin volver arriba */}
      <div style={{ flex: '0 1 auto', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: '100%', position: 'sticky', top: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={botonChico(ancho === 600)} onClick={() => setAncho(600)}>COMPU</button>
          <button type="button" style={botonChico(ancho === 375)} onClick={() => setAncho(375)}>CELULAR</button>
          <button
            type="button"
            onClick={copiar}
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              letterSpacing: '0.08em',
              background: 'var(--gold)',
              color: '#0a0a1a',
              padding: '9px 22px 7px',
              borderRadius: 8,
            }}
          >
            {copiado ? '¡COPIADO!' : 'COPIAR EL HTML'}
          </button>
        </div>
        {vista && (
          <iframe
            ref={marco}
            title="Vista previa del mail"
            srcDoc={vista}
            onLoad={alCargar}
            style={{ width: ancho, maxWidth: '100%', height: 'calc(100vh - 170px)', minHeight: 480, border: '1px solid var(--gold-border)', borderRadius: 10, background: '#fff' }}
          />
        )}
        <p style={{ ...ayuda, maxWidth: 600 }}>
          Pesa {peso} KB (Gmail corta los mails de más de 102 KB). En el plugin, creá la newsletter con la opción
          «Raw HTML» y pegalo ahí: en el editor de bloques el código de arriba aparece como texto. Poné el asunto y
          mandate una prueba antes de enviarla. El link para darse de baja y el de «ver en el navegador» los completa
          el plugin. Gmail y Outlook no cargan la letra de Futboleros: ahí los títulos salen con una parecida.
        </p>
      </div>
    </div>
  )
}
