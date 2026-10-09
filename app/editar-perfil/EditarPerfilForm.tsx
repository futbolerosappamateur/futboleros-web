'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CARACT_FEM, CARACT_MASC, ESTILOS_FEM, ESTILOS_MASC, FONDO_PERFIL, GENEROS, MAX_CARACTERISTICAS,
  PAISES, REDES, TALLES, buscarClubes, sinEmojis,
} from '@/lib/perfil-opciones'
import { guardarFondo, guardarFoto, guardarPerfil, type DatosPerfil } from './actions'
import RecortarFoto from './RecortarFoto'
import styles from './editar.module.css'

export type PerfilEditable = {
  id: string
  nombre: string | null
  apodo: string | null
  username: string | null
  avatar_url: string | null
  fecha_nacimiento: string | null
  altura: number | null
  peso: number | null
  whatsapp: string | null
  sexo: string | null
  pais: string | null
  hincha_de: string | null
  idolo: string | null
  estilo_juego: string[] | null
  caracteristicas: string[] | null
  redes: Record<string, string> | null
  talle_remera: string | null
  talle_pantalon: string | null
  talle_calzado: string | null
  nombre_camiseta: string | null
  numero_camiseta: number | null
  domicilio: string | null
  es_pro: boolean | null
}

type Props = {
  userId: string
  perfil: PerfilEditable | null
  fondoUrl: string | null
  tienePassword: boolean
}

type ErrorForm = { mensaje: string; campo?: string }

function datosIniciales(p: PerfilEditable | null): DatosPerfil {
  return {
    nombre: p?.nombre ?? '',
    apodo: p?.apodo ?? '',
    username: p?.username ?? '',
    fechaNacimiento: p?.fecha_nacimiento ?? '',
    altura: p?.altura?.toString() ?? '',
    peso: p?.peso?.toString() ?? '',
    whatsapp: p?.whatsapp ?? '',
    sexo: p?.sexo ?? '',
    pais: p?.pais || 'AR',
    hinchaDe: p?.hincha_de ?? '',
    idolo: p?.idolo ?? '',
    estilo: sinEmojis(p?.estilo_juego?.[0] ?? ''),
    caracteristicas: p?.caracteristicas ?? [],
    redes: Object.fromEntries(REDES.map(r => [r.key, p?.redes?.[r.key] ?? ''])),
    talleRemera: p?.talle_remera ?? '',
    tallePantalon: p?.talle_pantalon ?? '',
    talleCalzado: p?.talle_calzado ?? '',
    nombreCamiseta: p?.nombre_camiseta ?? '',
    numeroCamiseta: p?.numero_camiseta?.toString() ?? '',
    domicilio: p?.domicilio ?? '',
  }
}

// Pichero ↔ Pichera, Adicto ↔ Adicta: las listas van en el mismo orden
function traducir(valor: string, desde: string[], hacia: string[]) {
  const i = desde.indexOf(valor)
  return i >= 0 ? hacia[i] : valor
}

const soloNumeros = (v: string) => v.replace(/\D/g, '')

const ANCHO_FONDO = 1920   // ancho máximo del fondo que se sube (el de la medida sugerida)

// Achica el fondo en el navegador antes de subirlo (hasta 1920 px de ancho, en JPG), así el perfil carga rápido
function achicarFondo(archivo: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const escala = Math.min(1, ANCHO_FONDO / img.naturalWidth)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * escala)
      canvas.height = Math.round(img.naturalHeight * escala)
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Sin canvas')); return }
      ctx.fillStyle = '#1a1a14'   // lo transparente de un PNG queda oscuro y no negro puro
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', 0.85)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')) }
    img.src = url
  })
}

export default function EditarPerfilForm({ userId, perfil, fondoUrl, tienePassword }: Props) {
  const router = useRouter()
  const [d, setD] = useState<DatosPerfil>(() => datosIniciales(perfil))
  const [error, setError] = useState<ErrorForm | null>(null)
  const [guardando, startGuardar] = useTransition()

  const [foto, setFoto] = useState(perfil?.avatar_url ?? null)
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState('')
  const inputFoto = useRef<HTMLInputElement>(null)

  const [fondo, setFondo] = useState(fondoUrl)
  const [subiendoFondo, setSubiendoFondo] = useState(false)
  const [errorFondo, setErrorFondo] = useState('')
  const inputFondo = useRef<HTMLInputElement>(null)

  const [busquedaClub, setBusquedaClub] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)

  const set = <K extends keyof DatosPerfil>(campo: K, valor: DatosPerfil[K]) => {
    setD(prev => ({ ...prev, [campo]: valor }))
    if (error?.campo === campo) setError(null)
  }
  const invalido = (campo: string) => error?.campo === campo || undefined
  const errorDe = (campo: string) =>
    error?.campo === campo ? <p className={styles.errorCampo}>{error.mensaje}</p> : null

  const fem = d.sexo === 'Femenino'
  const estilos = fem ? ESTILOS_FEM : ESTILOS_MASC
  const caracts = fem ? CARACT_FEM : CARACT_MASC
  // Valores que no están en las listas (cargados con una versión vieja de la app): se muestran para poder sacarlos
  const opcionesEstilo = !d.estilo || estilos.includes(d.estilo) ? estilos : [...estilos, d.estilo]
  const opcionesCaract = [...caracts, ...d.caracteristicas.filter(c => !caracts.includes(c))]
  const clubes = buscarClubes(busquedaClub)

  const cambiarSexo = (sexo: string) => {
    const [desdeE, haciaE, desdeC, haciaC] = sexo === 'Femenino'
      ? [ESTILOS_MASC, ESTILOS_FEM, CARACT_MASC, CARACT_FEM]
      : [ESTILOS_FEM, ESTILOS_MASC, CARACT_FEM, CARACT_MASC]
    setD(prev => ({
      ...prev,
      sexo,
      estilo: traducir(prev.estilo, desdeE, haciaE),
      caracteristicas: prev.caracteristicas.map(c => traducir(c, desdeC, haciaC)),
    }))
    if (error?.campo === 'sexo') setError(null)
  }

  const toggleCaracteristica = (c: string) => {
    if (d.caracteristicas.includes(c)) set('caracteristicas', d.caracteristicas.filter(x => x !== c))
    else if (d.caracteristicas.length < MAX_CARACTERISTICAS) set('caracteristicas', [...d.caracteristicas, c])
  }

  const elegirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''   // para poder volver a elegir el mismo archivo
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) {
      setErrorFoto('Elegí una imagen (JPG o PNG).')
      return
    }
    setErrorFoto('')
    setArchivoFoto(archivo)
  }

  // Igual que la app: la foto se guarda apenas se elige, sin esperar a "Guardar perfil"
  const subirFoto = async (blob: Blob) => {
    setArchivoFoto(null)
    setSubiendoFoto(true)
    setErrorFoto('')
    try {
      const supabase = createClient()
      const nombreArchivo = `perfil_${userId}_${Date.now()}.jpg`
      const { error: errSubida } = await supabase.storage
        .from('avatares')
        .upload(nombreArchivo, blob, { contentType: 'image/jpeg', upsert: true })
      if (errSubida) throw errSubida
      const url = supabase.storage.from('avatares').getPublicUrl(nombreArchivo).data.publicUrl
      const res = await guardarFoto(url)
      if (res.error) throw new Error(res.error)
      setFoto(url)
    } catch {
      setErrorFoto('No se pudo subir la foto. Probá de nuevo.')
    } finally {
      setSubiendoFoto(false)
    }
  }

  // El fondo también se guarda apenas se elige
  const elegirFondo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''   // para poder volver a elegir el mismo archivo
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) {
      setErrorFondo('Elegí una imagen (JPG o PNG).')
      return
    }
    setErrorFondo('')
    setSubiendoFondo(true)
    try {
      const blob = await achicarFondo(archivo)
      const supabase = createClient()
      const nombreArchivo = `perfil_${userId}_fondo_${Date.now()}.jpg`
      const { error: errSubida } = await supabase.storage
        .from('avatares')
        .upload(nombreArchivo, blob, { contentType: 'image/jpeg', upsert: true })
      if (errSubida) throw errSubida
      const url = supabase.storage.from('avatares').getPublicUrl(nombreArchivo).data.publicUrl
      const res = await guardarFondo(url)
      if (res.error) throw new Error(res.error)
      setFondo(url)
      router.refresh()   // el encabezado de esta página también usa el fondo
    } catch {
      setErrorFondo('No se pudo subir el fondo. Probá de nuevo.')
    } finally {
      setSubiendoFondo(false)
    }
  }

  const quitarFondo = async () => {
    setErrorFondo('')
    setSubiendoFondo(true)
    const res = await guardarFondo(null)
    if (res.error) setErrorFondo(res.error)
    else { setFondo(null); router.refresh() }
    setSubiendoFondo(false)
  }

  const mostrarError = (mensaje: string, campo?: string) => {
    setError({ mensaje, campo })
    const el = campo ? document.getElementById(campo) : null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus({ preventScroll: true })
  }

  const guardar = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password && password.length < 6) {
      mostrarError('La contraseña nueva tiene que tener al menos 6 caracteres.', 'password')
      return
    }
    startGuardar(async () => {
      const res = await guardarPerfil(d)
      if ('error' in res) {
        mostrarError(res.error, res.campo)
        return
      }
      if (password) {
        const { error: errPass } = await createClient().auth.updateUser({ password })
        if (errPass) {
          mostrarError(`Tu perfil se guardó, pero no se pudo cambiar la contraseña: ${errPass.message}`, 'password')
          return
        }
      }
      router.push(res.ruta)
      router.refresh()
    })
  }

  const anioMax = new Date().getFullYear() - 5
  const volverA = perfil ? `/jugadores/${perfil.username ?? perfil.id}` : '/'

  return (
    <form className={styles.form} onSubmit={guardar} noValidate>

      {/* ── Foto ── */}
      <section className={styles.seccion}>
        <TituloSeccion icono="/ic-camara.webp">Tu foto</TituloSeccion>
        <div className={styles.foto}>
          <div className={styles.fotoCirculo}>
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="Tu foto de perfil" />
            ) : (
              <span>{d.nombre.trim().charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>
          <div className={styles.fotoAcciones}>
            <button
              type="button"
              className={styles.btnSecundario}
              onClick={() => inputFoto.current?.click()}
              disabled={subiendoFoto}
            >
              {subiendoFoto ? 'Subiendo...' : foto ? 'Cambiar foto' : 'Subir foto'}
            </button>
            <input ref={inputFoto} type="file" accept="image/*" hidden onChange={elegirFoto} />
            <p className={styles.ayuda}>Se guarda apenas la elegís.</p>
            {errorFoto && <p className={styles.errorCampo}>{errorFoto}</p>}
          </div>
        </div>
      </section>

      {/* ── Fondo del encabezado del perfil ── */}
      <section className={styles.seccion}>
        <TituloSeccion icono="/ic-galeria.webp">Fondo de tu perfil</TituloSeccion>
        {/* Con la misma capa oscura que le pone ParallaxHero en el perfil */}
        <div
          className={styles.fondoPreview}
          role="img"
          aria-label={fondo ? 'Tu fondo de perfil' : 'Fondo predeterminado'}
          style={{ backgroundImage: `linear-gradient(rgba(10,10,18,0.58), rgba(10,10,18,0.58)), url('${fondo ?? FONDO_PERFIL}')` }}
        />
        <div className={styles.fondoAcciones}>
          <button
            type="button"
            className={styles.btnSecundario}
            onClick={() => inputFondo.current?.click()}
            disabled={subiendoFondo}
          >
            {subiendoFondo ? 'Guardando...' : fondo ? 'Cambiar fondo' : 'Subir fondo'}
          </button>
          {fondo && (
            <button type="button" className={styles.btnSecundario} onClick={quitarFondo} disabled={subiendoFondo}>
              Volver al predeterminado
            </button>
          )}
          <input ref={inputFondo} type="file" accept="image/*" hidden onChange={elegirFondo} />
        </div>
        <p className={styles.ayuda}>
          Medida sugerida: 1920 × 820 px, horizontal (JPG o PNG). En pantallas angostas se recorta a los costados: dejá lo importante en el centro.
        </p>
        <p className={styles.ayuda}>Le ponemos una capa oscura encima para que se lean tu nombre y tu apodo. Se guarda apenas la elegís.</p>
        {errorFondo && <p className={styles.errorCampo}>{errorFondo}</p>}
      </section>

      {/* ── Datos personales ── */}
      <section className={styles.seccion}>
        <TituloSeccion icono="/ic-timeline.webp">Datos personales</TituloSeccion>
        <div className={styles.grid}>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="nombre">Nombre completo *</label>
            <input
              id="nombre" className={styles.input} placeholder="Tu nombre y apellido" autoComplete="name"
              value={d.nombre} onChange={e => set('nombre', e.target.value)} aria-invalid={invalido('nombre')}
            />
            {errorDe('nombre')}
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="apodo">¿Cómo te dicen?</label>
            <input
              id="apodo" className={styles.input} placeholder="Tu apodo"
              value={d.apodo} onChange={e => set('apodo', e.target.value)}
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="username">Nombre de usuario</label>
            <div className={styles.inputGrupo}>
              <span className={styles.prefijo}>@</span>
              <input
                id="username" className={styles.input} placeholder="tu_usuario" maxLength={30}
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
                value={d.username}
                onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                aria-invalid={invalido('username')}
              />
            </div>
            <p className={styles.ayuda}>Letras minúsculas, números y _ · mínimo 3 caracteres</p>
            {errorDe('username')}
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="whatsapp">WhatsApp</label>
            <input
              id="whatsapp" className={styles.input} type="tel" placeholder="Ej: +54 9 11 1234 5678" autoComplete="tel"
              value={d.whatsapp} onChange={e => set('whatsapp', e.target.value)} aria-invalid={invalido('whatsapp')}
            />
            <p className={styles.ayuda}>Solo para fines administrativos</p>
            {errorDe('whatsapp')}
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="fechaNacimiento">¿Cuándo naciste? *</label>
            <input
              id="fechaNacimiento" className={styles.input} type="date" min="1920-01-01" max={`${anioMax}-12-31`}
              value={d.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)}
              aria-invalid={invalido('fechaNacimiento')}
            />
            {errorDe('fechaNacimiento')}
          </div>

          <div className={styles.par}>
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="altura">Altura *</label>
              <div className={styles.inputGrupo}>
                <input
                  id="altura" className={styles.input} inputMode="numeric" placeholder="175" maxLength={3}
                  value={d.altura} onChange={e => set('altura', soloNumeros(e.target.value))}
                  aria-invalid={invalido('altura')}
                />
                <span className={styles.sufijo}>cm</span>
              </div>
            </div>
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="peso">Peso</label>
              <div className={styles.inputGrupo}>
                <input
                  id="peso" className={styles.input} inputMode="numeric" placeholder="75" maxLength={3}
                  value={d.peso} onChange={e => set('peso', soloNumeros(e.target.value))}
                  aria-invalid={invalido('peso')}
                />
                <span className={styles.sufijo}>kg</span>
              </div>
            </div>
            {errorDe('altura')}
            {errorDe('peso')}
          </div>

          <div className={`${styles.campo} ${styles.ancho}`}>
            <span className={styles.label} id="sexo-label">Género *</span>
            <div className={styles.chips} id="sexo" tabIndex={-1} role="group" aria-labelledby="sexo-label">
              {GENEROS.map(g => (
                <button
                  key={g} type="button" className={styles.chip}
                  aria-pressed={d.sexo === g} onClick={() => cambiarSexo(g)}
                >
                  {g}
                </button>
              ))}
            </div>
            {errorDe('sexo')}
          </div>

          <div className={`${styles.campo} ${styles.ancho}`}>
            <span className={styles.label} id="pais-label">País</span>
            <div className={styles.chips} role="group" aria-labelledby="pais-label">
              {PAISES.map(p => (
                <button
                  key={p.code} type="button" className={`${styles.chip} ${styles.chipPais}`}
                  aria-pressed={d.pais === p.code} onClick={() => set('pais', p.code)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://flagcdn.com/${p.code.toLowerCase()}.svg`} alt="" />
                  {p.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="hinchaDe">¿De quién sos hincha? *</label>
            {d.hinchaDe ? (
              <div className={styles.seleccion}>
                <span>{d.hinchaDe}</span>
                <button
                  type="button" className={styles.cambiar}
                  onClick={() => { set('hinchaDe', ''); setBusquedaClub('') }}
                >
                  Cambiar ✕
                </button>
              </div>
            ) : (
              <div className={styles.buscador}>
                <input
                  id="hinchaDe" className={styles.input} placeholder="Buscá tu equipo..." autoComplete="off"
                  value={busquedaClub} onChange={e => setBusquedaClub(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (clubes[0]) { set('hinchaDe', clubes[0]); setBusquedaClub('') }
                    }
                  }}
                  aria-invalid={invalido('hinchaDe')}
                />
                {clubes.length > 0 && (
                  <div className={styles.resultados}>
                    {clubes.map(c => (
                      <button
                        key={c} type="button" className={styles.resultado}
                        onClick={() => { set('hinchaDe', c); setBusquedaClub('') }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
                {busquedaClub.length >= 2 && clubes.length === 0 && (
                  <p className={styles.ayuda}>No encontramos ese equipo</p>
                )}
              </div>
            )}
            {errorDe('hinchaDe')}
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="idolo">¿Cuál es tu ídolo?</label>
            <input
              id="idolo" className={styles.input} placeholder="Ej: Messi, Maradona, Riquelme..."
              value={d.idolo} onChange={e => set('idolo', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ── Tu juego ── */}
      <section className={styles.seccion}>
        <TituloSeccion icono="/ic-bati.webp">Tu juego</TituloSeccion>
        <div className={styles.campo}>
          <span className={styles.label} id="estilo-label">¿Cómo jugás? *</span>
          <div className={styles.chips} id="estilo" tabIndex={-1} role="group" aria-labelledby="estilo-label">
            {opcionesEstilo.map(e => (
              <button
                key={e} type="button" className={styles.chip}
                aria-pressed={d.estilo === e} onClick={() => set('estilo', e)}
              >
                {e}
              </button>
            ))}
          </div>
          {errorDe('estilo')}
        </div>
      </section>

      {/* ── Tu sello ── */}
      <section className={styles.seccion}>
        <TituloSeccion icono="/ic-sello.webp">Tu sello</TituloSeccion>
        <div className={styles.campo}>
          <span className={styles.label} id="caract-label">
            Elegí hasta {MAX_CARACTERISTICAS} características que te definen ({d.caracteristicas.length}/{MAX_CARACTERISTICAS})
          </span>
          <div className={styles.chips} role="group" aria-labelledby="caract-label">
            {opcionesCaract.map(c => {
              const elegida = d.caracteristicas.includes(c)
              return (
                <button
                  key={c} type="button" className={styles.chip}
                  aria-pressed={elegida} onClick={() => toggleCaracteristica(c)}
                  disabled={!elegida && d.caracteristicas.length >= MAX_CARACTERISTICAS}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Redes ── */}
      <section className={styles.seccion}>
        <TituloSeccion icono="/ic-red.webp">Tus redes</TituloSeccion>
        <p className={styles.seccionNota}>Poné el usuario de cada red y van a aparecer en tu perfil</p>
        <div className={styles.grid}>
          {REDES.map(r => (
            <div key={r.key} className={styles.campo}>
              <label className={styles.label} htmlFor={`red-${r.key}`}>{r.label}</label>
              <input
                id={`red-${r.key}`} className={styles.input} placeholder={r.placeholder}
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
                value={d.redes[r.key] ?? ''}
                onChange={e => set('redes', { ...d.redes, [r.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Datos para sorteos ── */}
      <section className={styles.seccion}>
        <TituloSeccion icono="/ic-sorteo.webp">Datos para sorteos</TituloSeccion>
        <p className={styles.seccionNota}>Solo los ve el equipo de Futboleros si ganás un premio</p>
        <div className={styles.grid}>
          <div className={styles.campo}>
            <span className={styles.label} id="remera-label">Talle de remera / buzo</span>
            <div className={styles.chips} role="group" aria-labelledby="remera-label">
              {TALLES.map(t => (
                <button
                  key={t} type="button" className={styles.chip} aria-pressed={d.talleRemera === t}
                  onClick={() => set('talleRemera', d.talleRemera === t ? '' : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.campo}>
            <span className={styles.label} id="pantalon-label">Talle de pantalón</span>
            <div className={styles.chips} role="group" aria-labelledby="pantalon-label">
              {TALLES.map(t => (
                <button
                  key={t} type="button" className={styles.chip} aria-pressed={d.tallePantalon === t}
                  onClick={() => set('tallePantalon', d.tallePantalon === t ? '' : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.campo}>
            <label className={styles.label} htmlFor="talleCalzado">Número de calzado</label>
            <input
              id="talleCalzado" className={styles.input} inputMode="numeric" placeholder="Ej: 42" maxLength={3}
              value={d.talleCalzado} onChange={e => set('talleCalzado', soloNumeros(e.target.value))}
            />
          </div>

          <div className={styles.par}>
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="nombreCamiseta">Nombre en la camiseta</label>
              <input
                id="nombreCamiseta" className={styles.input} placeholder="Ej: MESSI" maxLength={20}
                value={d.nombreCamiseta} onChange={e => set('nombreCamiseta', e.target.value.toUpperCase())}
              />
            </div>
            <div className={styles.campo}>
              <label className={styles.label} htmlFor="numeroCamiseta">Número</label>
              <input
                id="numeroCamiseta" className={styles.input} inputMode="numeric" placeholder="Ej: 10" maxLength={3}
                value={d.numeroCamiseta} onChange={e => set('numeroCamiseta', soloNumeros(e.target.value))}
                aria-invalid={invalido('numeroCamiseta')}
              />
            </div>
            {errorDe('numeroCamiseta')}
          </div>

          <div className={`${styles.campo} ${styles.ancho}`}>
            <label className={styles.label} htmlFor="domicilio">Domicilio para envío de premios</label>
            {perfil?.es_pro && !d.domicilio.trim() && (
              <p className={styles.aviso}>
                Tenés Plan 10 y podés ganar sorteos. Cargá tu domicilio para que podamos enviarte el premio.
              </p>
            )}
            <input
              id="domicilio" className={styles.input} placeholder="Ej: Av. Corrientes 1234, CABA" maxLength={150}
              autoComplete="street-address"
              value={d.domicilio} onChange={e => set('domicilio', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ── Contraseña (solo cuentas con email; con Google no hay contraseña) ── */}
      {tienePassword && (
        <section className={styles.seccion}>
          <TituloSeccion icono="/lock.png">Cambiar contraseña</TituloSeccion>
          <div className={styles.campo}>
            <label className={styles.label} htmlFor="password">Nueva contraseña</label>
            <div className={styles.inputGrupo}>
              <input
                id="password" className={styles.input} type={verPassword ? 'text' : 'password'}
                autoComplete="new-password" placeholder="Dejala vacía si no la querés cambiar"
                value={password}
                onChange={e => { setPassword(e.target.value); if (error?.campo === 'password') setError(null) }}
                aria-invalid={invalido('password')}
              />
              <button
                type="button" className={styles.ojo} onClick={() => setVerPassword(v => !v)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={verPassword ? '/ic-ojoc.webp' : '/ic-ojo.webp'} alt="" />
              </button>
            </div>
            {errorDe('password')}
          </div>
        </section>
      )}

      <div className={styles.acciones}>
        {error && !error.campo && <p className={styles.errorGeneral}>{error.mensaje}</p>}
        <Link href={volverA} className={styles.btnSecundario}>Cancelar</Link>
        <button type="submit" className={styles.btnPrimario} disabled={guardando || subiendoFoto || subiendoFondo}>
          {guardando ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>

      {archivoFoto && (
        <RecortarFoto archivo={archivoFoto} onListo={subirFoto} onCancelar={() => setArchivoFoto(null)} />
      )}
    </form>
  )
}

function TituloSeccion({ icono, children }: { icono: string; children: React.ReactNode }) {
  return (
    <h2 className={styles.seccionTitulo}>
      <span className={styles.icono} style={{ '--icono': `url(${icono})` } as React.CSSProperties} />
      {children}
    </h2>
  )
}
