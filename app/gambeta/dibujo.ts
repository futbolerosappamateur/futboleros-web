// Dibujo de Gambeta en un canvas 2D, con la estética de los afiches de Don Fulbio: azul marino, crema y
// dorado, contornos de tinta y grano de papel. Los muñecos se arman con poses (ángulos de cada articulación).
import {
  type Juego, type Rival, type Remate, type Tiro, type Definicion, progresoJugada, metros, arqueroEn, miraEn,
  META, META_METROS, DISTANCIA_ARCO, DURACION_LLEGADA, DURACION_VUELO, ESPERA_REMATE, PUNTOS_POR_GOL,
  UNIDADES_POR_METRO,
} from './motor'

export interface Vista {
  ancho: number        // lo que se ve del mundo, en unidades
  alto: number
  escala: number       // píxeles CSS por unidad
  piso: number         // altura de la línea por la que corre (en unidades, desde arriba)
  xJugador: number     // a cuánto del borde izquierdo corre Don Fulbio
  cssAncho: number
  cssAlto: number
  dpr: number
}

// Lo mínimo que se ve de ancho: con el celular parado se acerca un poco más para que los jugadores no
// queden chiquitos, y Don Fulbio corre más a la izquierda para no perder distancia hacia adelante
const ANCHO_MINIMO = 640
const ANCHO_MINIMO_PARADO = 540
const ALTO_MINIMO = 420
const ESCALA_MAXIMA = 1.6

// reservaAbajo: píxeles CSS que ocupan los botones táctiles con el celular acostado
export function calcularVista(cssAncho: number, cssAlto: number, dpr: number, reservaAbajo = 0): Vista {
  const parado = cssAlto > cssAncho
  const escala = Math.min(cssAncho / (parado ? ANCHO_MINIMO_PARADO : ANCHO_MINIMO), cssAlto / ALTO_MINIMO, ESCALA_MAXIMA)
  const ancho = cssAncho / escala
  const alto = cssAlto / escala
  // Celular parado: la cancha baja hasta los botones y arriba queda el cielo con el escudo y el marcador
  const piso = parado
    ? alto * 0.6
    : alto - Math.max(72, alto * 0.17, reservaAbajo ? reservaAbajo / escala + 14 : 0)
  return { ancho, alto, escala, piso, xJugador: parado ? 85 : 110, cssAncho, cssAlto, dpr }
}

// ---- Colores del afiche ----

const TINTA = '#1a1612'
const NAVY = '#13284a'
const AZUL = '#3a6ea5'
const ORO = '#d4a54a'
const CREMA = '#efe3c6'
const ROJO = '#a83a2e'

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const cacheOscuro = new Map<string, string>()
function oscuro(hex: string, f = 0.72) {
  if (f === 1) return hex
  const clave = hex + f
  let c = cacheOscuro.get(clave)
  if (!c) {
    const [r, g, b] = rgb(hex)
    c = '#' + [r, g, b].map((v) => Math.round(v * f).toString(16).padStart(2, '0')).join('')
    cacheOscuro.set(clave, c)
  }
  return c
}

// ---- Los dos tipos de jugador ----

interface Aspecto {
  cuerpo: 'fulbio' | 'rival'
  bastones: string[]   // franjas verticales de la camiseta
  manga: string
  puño: string
  short: string
  franjaShort: string
  medias: string
  bandaMedias: string
  pelo: string
  // Medidas (unidades): Don Fulbio es petiso, de piernas cortas, panzón y cabezón
  muslo: number
  pierna: number
  brazo: number
  antebrazo: number
  torso: number
  cabeza: number
  anchoPierna: number
  anchoBrazo: number
  panza: [number, number]  // semiejes del torso
}

const DON_FULBIO: Aspecto = {
  cuerpo: 'fulbio',
  bastones: [NAVY, AZUL, ORO, AZUL, NAVY],
  manga: NAVY, puño: ORO, short: '#162544', franjaShort: ORO, medias: '#2f6aa3', bandaMedias: NAVY, pelo: '#1d1b1f',
  muslo: 13, pierna: 13, brazo: 10, antebrazo: 10, torso: 23, cabeza: 11.5, anchoPierna: 8.5, anchoBrazo: 6.5,
  panza: [13, 15],
}

const RIVAL: Aspecto = {
  cuerpo: 'rival',
  bastones: [ROJO, CREMA, ROJO, CREMA, ROJO],
  manga: ROJO, puño: CREMA, short: '#1d1b1f', franjaShort: ROJO, medias: ROJO, bandaMedias: CREMA, pelo: '#2a1d14',
  muslo: 17, pierna: 17, brazo: 12, antebrazo: 11, torso: 24, cabeza: 8.5, anchoPierna: 7, anchoBrazo: 5.5,
  panza: [8, 14],
}

const PIEL_FULBIO = '#e2a877'

// ---- Decorado fijo (siempre el mismo, no depende del día) ----

function azarFijo(semilla: number) {
  let s = semilla
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const PERIODO_CIUDAD = 1400
const PARALAJE_CIUDAD = 0.08
const PLAZA = [530, 890]   // un claro en la tira: ahí van los lugares conocidos
const EDIFICIOS = (() => {
  const azar = azarFijo(7)
  const lista: { x: number; ancho: number; alto: number; antena: boolean; ventanas: [number, number, number][] }[] = []
  let x = 0
  while (x < PERIODO_CIUDAD) {
    const ancho = 34 + azar() * 70
    const alto = 40 + azar() * 120
    if (x + ancho > PLAZA[0] && x < PLAZA[1]) {
      x = PLAZA[1]
      continue
    }
    const ventanas: [number, number, number][] = []
    for (let vy = 10; vy < alto - 8; vy += 11) {
      for (let vx = 6; vx < ancho - 6; vx += 9) {
        if (azar() < 0.2) ventanas.push([vx, vy, 0.25 + azar() * 0.45])
      }
    }
    lista.push({ x, ancho, alto, antena: azar() < 0.3, ventanas })
    x += ancho + azar() * 14
  }
  return lista
})()

const ESTRELLAS = (() => {
  const azar = azarFijo(11)
  return Array.from({ length: 80 }, () => ({ x: azar(), y: azar(), brillo: 0.25 + azar() * 0.6, fase: azar() * 6 }))
})()

const MANCHAS = (() => {
  const azar = azarFijo(23)
  return Array.from({ length: 9 }, () => ({ x: azar() * 1800, y: azar(), rx: 30 + azar() * 70, ry: 0.15 + azar() * 0.2 }))
})()

// Frases de los afiches de Don Fulbio
const CARTELES = [
  '★ FUTBOLEROS ★', 'LA APP DEL FULBITO Y LOS DOLORES', 'SIN CALENTAMIENTO DESDE 1998',
  '★ FUTBOLEROS ★', 'EL LUNES NO CUENTO', 'HOY JUEGO TRANQUILO',
]

// Grano de papel para la capa que va encima del canvas (Juego.tsx la pone de fondo): se arma una sola vez
let grano: string | null = null
export function texturaGrano() {
  if (grano) return grano
  const c = document.createElement('canvas')
  c.width = c.height = 180
  const g = c.getContext('2d')
  if (!g) return ''
  const azar = azarFijo(5)
  for (let i = 0; i < 2600; i++) {
    const claro = azar() < 0.5
    g.fillStyle = claro ? `rgba(239,227,198,${0.04 + azar() * 0.09})` : `rgba(10,8,6,${0.05 + azar() * 0.1})`
    g.fillRect(azar() * 180, azar() * 180, 1 + azar() * 1.2, 1 + azar() * 1.2)
  }
  // Algunas rayitas, como un afiche gastado
  g.strokeStyle = 'rgba(239,227,198,0.08)'
  g.lineWidth = 0.6
  for (let i = 0; i < 6; i++) {
    const x = azar() * 180
    const y = azar() * 180
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + (azar() - 0.5) * 40, y + azar() * 30)
    g.stroke()
  }
  grano = c.toDataURL('image/png')
  return grano
}

// ---- Escena ----

function escudo(v: Vista) {
  const radio = Math.min(v.ancho * 0.32, v.piso * 0.28, 170)
  return { x: v.ancho / 2, y: Math.max(radio + 40, v.piso * 0.42), radio }
}

function estrella(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, giro = 0) {
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = giro - Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.45 : r
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fill()
}

// Lo que no cambia de un cuadro a otro (cielo, ciudad, torre de luz, tejido del alambrado) se dibuja una
// vez en un canvas aparte y después solo se copia: dibujarlo entero en cada cuadro le cuesta al celular
interface Capas {
  clave: string
  cielo: HTMLCanvasElement
  ciudad: HTMLCanvasElement
  torre: HTMLCanvasElement
  tejido: CanvasPattern | null
  hitos: (HTMLCanvasElement | undefined)[]   // los lugares conocidos, solo los que están cerca
}

const ALTO_CIUDAD = 180
let capas: Capas | null = null
let imagenEscudo: HTMLImageElement | null = null   // el escudo redondo de los afiches (lo carga cargarImagenes)

function lienzo(ancho: number, alto: number, k: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.ceil(ancho * k))
  c.height = Math.max(1, Math.ceil(alto * k))
  const g = c.getContext('2d') as CanvasRenderingContext2D
  g.scale(k, k)
  return [c, g]
}

const alturaTorre = (v: Vista) => Math.max(200, Math.min(460, v.piso - 120))   // más altas con más cielo

function obtenerCapas(ctx: CanvasRenderingContext2D, v: Vista): Capas {
  const k = v.escala * v.dpr
  // Si el escudo todavía no cargó, el cielo se vuelve a armar cuando llegue. El mano a mano tiene el piso en
  // otra altura (vistaRemate): al pasar de la carrera al arco también se arma de nuevo
  const clave = `${Math.round(v.ancho)}x${Math.round(v.alto)}/${Math.round(v.piso)}@${k.toFixed(3)}|${imagenEscudo ? 'escudo' : ''}`
  if (capas && capas.clave === clave) return capas

  const [cielo, gc] = lienzo(v.ancho, v.piso, k)
  dibujarCielo(gc, v)
  const [ciudad, gu] = lienzo(PERIODO_CIUDAD + 120, ALTO_CIUDAD, k)
  dibujarCiudad(gu)
  const alto = alturaTorre(v)
  const [torre, gt] = lienzo(340, alto + 194, k)
  dibujarTorre(gt, 170, 110, alto)
  const [trama, gm] = lienzo(12, 12, k)
  gm.strokeStyle = 'rgba(200,210,225,0.13)'
  gm.lineWidth = 0.8
  gm.beginPath()
  gm.moveTo(0, 0)
  gm.lineTo(12, 12)
  gm.moveTo(12, 0)
  gm.lineTo(0, 12)
  gm.stroke()
  const tejido = ctx.createPattern(trama, 'repeat')
  tejido?.setTransform(new DOMMatrix().scale(1 / k))

  capas = { clave, cielo, ciudad, torre, tejido, hitos: [] }
  return capas
}

function dibujarCielo(g: CanvasRenderingContext2D, v: Vista) {
  const fondo = g.createLinearGradient(0, 0, 0, v.piso)
  fondo.addColorStop(0, '#0a1528')
  fondo.addColorStop(0.6, '#13284a')
  fondo.addColorStop(1, '#27466f')
  g.fillStyle = fondo
  g.fillRect(0, 0, v.ancho, v.piso)

  // Rayos del afiche, saliendo de atrás del escudo
  const e = escudo(v)
  const largo = Math.hypot(v.ancho, v.piso) * 1.2
  for (let i = 0; i < 12; i++) {
    const a1 = 0.2 + (i * Math.PI * 2) / 12
    const a2 = a1 + Math.PI / 12
    g.fillStyle = i % 2 ? 'rgba(239,227,198,0.06)' : 'rgba(58,110,165,0.13)'
    g.beginPath()
    g.moveTo(e.x, e.y)
    g.lineTo(e.x + Math.cos(a1) * largo, e.y + Math.sin(a1) * largo)
    g.lineTo(e.x + Math.cos(a2) * largo, e.y + Math.sin(a2) * largo)
    g.closePath()
    g.fill()
  }

  // Estrellas
  const techo = Math.max(0, v.piso - 200)
  g.fillStyle = CREMA
  for (const s of ESTRELLAS) {
    g.globalAlpha = s.brillo
    g.fillRect(s.x * v.ancho, s.y * techo, 1.6, 1.6)
  }
  g.globalAlpha = 1

  // El escudo de Futboleros, con un resplandor atrás para que el aro oscuro se despegue del cielo
  if (imagenEscudo) {
    const halo = g.createRadialGradient(e.x, e.y, e.radio * 0.85, e.x, e.y, e.radio * 1.5)
    halo.addColorStop(0, 'rgba(239,227,198,0.2)')
    halo.addColorStop(1, 'rgba(239,227,198,0)')
    g.fillStyle = halo
    g.fillRect(e.x - e.radio * 1.5, e.y - e.radio * 1.5, e.radio * 3, e.radio * 3)
    g.imageSmoothingQuality = 'high'
    g.drawImage(imagenEscudo, e.x - e.radio, e.y - e.radio, e.radio * 2, e.radio * 2)
  }
}

// La tira de edificios, con la base abajo de todo
function dibujarCiudad(g: CanvasRenderingContext2D) {
  for (const e of EDIFICIOS) {
    g.fillStyle = '#0c1830'
    g.fillRect(e.x, ALTO_CIUDAD - e.alto, e.ancho, e.alto)
    if (e.antena) g.fillRect(e.x + e.ancho / 2 - 1, ALTO_CIUDAD - e.alto - 16, 2, 16)
    for (const [vx, vy, a] of e.ventanas) {
      g.fillStyle = `rgba(224,184,102,${a})`
      g.fillRect(e.x + vx, ALTO_CIUDAD - e.alto + vy, 3.5, 4.5)
    }
  }
}

// Una torre de luz con su haz y su resplandor; x es el centro y tope, la punta del poste
function dibujarTorre(g: CanvasRenderingContext2D, x: number, tope: number, alto: number) {
  const base = tope + alto
  const haz = g.createLinearGradient(0, tope, 0, base + 60)
  haz.addColorStop(0, 'rgba(255,236,190,0.10)')
  haz.addColorStop(1, 'rgba(255,236,190,0)')
  g.fillStyle = haz
  g.beginPath()
  g.moveTo(x - 16, tope + 10)
  g.lineTo(x + 16, tope + 10)
  g.lineTo(x + 170, base + 60)
  g.lineTo(x - 170, base + 60)
  g.closePath()
  g.fill()
  const brillo = g.createRadialGradient(x, tope, 0, x, tope, 110)
  brillo.addColorStop(0, 'rgba(255,240,200,0.45)')
  brillo.addColorStop(1, 'rgba(255,240,200,0)')
  g.fillStyle = brillo
  g.fillRect(x - 110, tope - 110, 220, 220)
  // Poste de reticulado y reflectores redondos
  g.strokeStyle = '#0b1426'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(x - 4, base)
  g.lineTo(x - 2, tope)
  g.moveTo(x + 4, base)
  g.lineTo(x + 2, tope)
  for (let y = base; y > tope + 8; y -= 16) {
    g.moveTo(x - 4, y)
    g.lineTo(x + 4, y - 16)
  }
  g.stroke()
  g.fillStyle = '#0b1426'
  g.fillRect(x - 20, tope - 14, 40, 22)
  for (let fila = 0; fila < 2; fila++) {
    for (let col = 0; col < 3; col++) circulo(g, x - 12 + col * 12, tope - 7 + fila * 10, 4, '#fff4d6')
  }
}

function ciudad(ctx: CanvasRenderingContext2D, v: Vista, distancia: number, fijas: Capas) {
  const recorrido = distancia * PARALAJE_CIUDAD
  let usados = 0
  for (let n = Math.floor(recorrido / PERIODO_CIUDAD), x = -(recorrido % PERIODO_CIUDAD); x < v.ancho; n++, x += PERIODO_CIUDAD) {
    ctx.drawImage(fijas.ciudad, x, v.piso - 26 - ALTO_CIUDAD, PERIODO_CIUDAD + 120, ALTO_CIUDAD)
    // En la plaza de cada vuelta de la tira va el lugar que sigue
    const i = n % HITOS.length
    const h = HITOS[i]
    const ancho = (h.ancho + MARGEN_HITO * 2) * ESCALA_HITOS
    const izq = x + (PLAZA[0] + PLAZA[1]) / 2 - ancho / 2
    if (izq > v.ancho || izq + ancho < 0) continue
    usados |= 1 << i
    const sprite = fijas.hitos[i] ?? (fijas.hitos[i] = spriteHito(h, v))
    const arriba = v.piso - 26 - (h.alto + MARGEN_HITO) * ESCALA_HITOS
    ctx.drawImage(sprite, izq, arriba, ancho, (h.alto + MARGEN_HITO * 2) * ESCALA_HITOS)
  }
  // Los que no se ven no ocupan memoria
  for (let i = 0; i < HITOS.length; i++) if (!(usados & (1 << i))) fijas.hitos[i] = undefined
}

// ---- Lugares de Buenos Aires ----
// La tira de edificios tiene una plaza, y cada vez que pasa (cada 437 m) trae el lugar conocido que
// sigue, en orden: en 2500 m se ve cada uno una vez. Van iluminados, como de noche.

interface Hito {
  ancho: number
  alto: number
  dibujar: (g: CanvasRenderingContext2D) => void   // con el piso en y = 0 y el borde izquierdo en x = 0
}

const HITOS: Hito[] = [
  { ancho: 300, alto: 228, dibujar: congreso },
  { ancho: 40, alto: 222, dibujar: obelisco },
  { ancho: 260, alto: 142, dibujar: casaRosada },
  { ancho: 300, alto: 152, dibujar: puenteDeLaMujer },
  { ancho: 220, alto: 146, dibujar: bibliotecaNacional },
  { ancho: 140, alto: 124, dibujar: planetario },
]

const ESCALA_HITOS = 0.85   // con el celular acostado hay poco cielo y pasan por delante del escudo
const MARGEN_HITO = 4       // para que no se corten los bordes suavizados

function spriteHito(h: Hito, v: Vista) {
  const e = ESCALA_HITOS
  const [c, g] = lienzo((h.ancho + MARGEN_HITO * 2) * e, (h.alto + MARGEN_HITO * 2) * e, v.escala * v.dpr)
  g.scale(e, e)
  g.translate(MARGEN_HITO, h.alto + MARGEN_HITO)
  h.dibujar(g)
  return c
}

const PIEDRA_LUZ = '#cfc19d'
const PIEDRA = '#a69878'
const PIEDRA_SOMBRA = '#6c6352'
const VENTANA_OSCURA = '#2a2f40'
const VENTANA_LUZ = 'rgba(232,192,110,0.85)'

// Un polígono con los puntos seguidos: x0, y0, x1, y1...
function poligono(g: CanvasRenderingContext2D, relleno: string | CanvasGradient, puntos: number[]) {
  g.fillStyle = relleno
  g.beginPath()
  for (let i = 0; i < puntos.length; i += 2) g.lineTo(puntos[i], puntos[i + 1])
  g.closePath()
  g.fill()
}

// El Congreso: las alas, el pórtico de columnas con la cuadriga arriba y la cúpula verde
function congreso(g: CanvasRenderingContext2D) {
  // Tambor y cúpula, atrás del cuerpo del medio
  g.fillStyle = PIEDRA_SOMBRA
  g.fillRect(114, -154, 72, 76)
  g.fillStyle = PIEDRA_LUZ
  for (let x = 117; x < 184; x += 9) g.fillRect(x, -150, 3, 68)
  g.fillRect(110, -158, 80, 5)
  const verde = g.createLinearGradient(112, 0, 188, 0)
  verde.addColorStop(0, '#93b6a2')
  verde.addColorStop(1, '#3d675b')
  g.fillStyle = verde
  g.beginPath()
  g.moveTo(112, -158)
  g.bezierCurveTo(112, -186, 130, -205, 150, -207)
  g.bezierCurveTo(170, -205, 188, -186, 188, -158)
  g.closePath()
  g.fill()
  g.strokeStyle = 'rgba(20,45,40,0.5)'
  g.lineWidth = 1
  g.beginPath()
  for (const dx of [-26, -13, 13, 26]) {
    g.moveTo(150 + dx, -158)
    g.quadraticCurveTo(150 + dx * 0.9, -196, 150, -207)
  }
  g.stroke()
  // Linterna
  g.fillStyle = PIEDRA_LUZ
  g.fillRect(143, -218, 14, 12)
  g.beginPath()
  g.arc(150, -218, 7, Math.PI, 0)
  g.fill()
  g.fillRect(149, -228, 2, 6)
  // Alas de tres pisos y pabellones en las puntas
  g.fillStyle = PIEDRA
  g.fillRect(0, -60, 300, 60)
  g.fillRect(0, -72, 40, 72)
  g.fillRect(260, -72, 40, 72)
  g.fillStyle = PIEDRA_LUZ
  g.fillRect(-2, -63, 304, 3)
  g.fillRect(-2, -75, 44, 3)
  g.fillRect(258, -75, 44, 3)
  g.fillStyle = VENTANA_OSCURA
  for (let fila = 0; fila < 3; fila++) {
    for (let x = 8; x < 296; x += 13) {
      if (x > 90 && x < 206) continue
      g.fillRect(x, -52 + fila * 17, 5, 10)
    }
  }
  // Cuerpo del medio con el pórtico: el fondo en sombra entre las columnas
  g.fillStyle = PIEDRA
  g.fillRect(94, -80, 112, 80)
  g.fillStyle = '#3e3a31'
  g.fillRect(105, -66, 90, 60)
  g.fillStyle = PIEDRA_LUZ
  for (let i = 0; i < 6; i++) g.fillRect(106 + i * 16.4, -66, 6, 60)
  g.fillRect(98, -6, 104, 6)
  g.fillRect(101, -74, 98, 8)
  poligono(g, PIEDRA_LUZ, [99, -74, 150, -92, 201, -74])
  poligono(g, PIEDRA, [111, -76, 150, -88, 189, -76])
  // La cuadriga, en bronce
  poligono(g, '#2e2b25', [
    134, -92, 135, -100, 138, -105, 140, -102, 141, -108, 144, -104, 146, -109, 148, -105, 149, -118, 151, -118,
    152, -105, 154, -109, 156, -104, 159, -108, 160, -102, 162, -105, 165, -100, 166, -92,
  ])
}

// El Obelisco, iluminado desde abajo: se ven dos caras, la de la izquierda con más luz
function obelisco(g: CanvasRenderingContext2D) {
  const luz = g.createLinearGradient(0, 0, 0, -222)
  luz.addColorStop(0, '#f3e9d0')
  luz.addColorStop(1, '#b8aa88')
  const sombra = g.createLinearGradient(0, 0, 0, -222)
  sombra.addColorStop(0, '#a59878')
  sombra.addColorStop(1, '#6c6352')
  poligono(g, luz, [9, 0, 13.5, -206, 21, -206, 22, 0])
  poligono(g, sombra, [22, 0, 21, -206, 26.5, -206, 31, 0])
  poligono(g, luz, [13.5, -206, 20, -222, 21, -206])
  poligono(g, sombra, [21, -206, 20, -222, 26.5, -206])
  g.fillStyle = VENTANA_OSCURA
  g.fillRect(15.5, -199, 3, 4)
  poligono(g, PIEDRA_SOMBRA, [3, 0, 5, -4, 35, -4, 37, 0])
}

// La Casa Rosada: el arco del medio, las ventanas encendidas y la bandera
function casaRosada(g: CanvasRenderingContext2D) {
  const rosa = '#c4878a'
  const rosaLuz = '#dca5a3'
  g.fillStyle = rosa
  g.fillRect(0, -70, 260, 70)
  g.fillStyle = rosaLuz
  g.fillRect(-2, -73, 264, 3)
  g.fillRect(-2, -81, 264, 2)
  for (let x = 0; x < 260; x += 5) g.fillRect(x, -79, 2, 6)
  g.fillStyle = VENTANA_LUZ
  for (let fila = 0; fila < 3; fila++) {
    for (let x = 8; x < 256; x += 12) {
      if (x > 88 && x < 168) continue
      g.fillRect(x, -62 + fila * 20, 5, 11)
    }
  }
  // El arco, más alto que el resto, con su frontón y la bandera
  g.fillStyle = rosaLuz
  g.fillRect(96, -100, 68, 100)
  poligono(g, rosaLuz, [92, -100, 130, -116, 168, -100])
  g.fillStyle = '#2b1f2a'
  g.beginPath()
  g.moveTo(112, 0)
  g.lineTo(112, -40)
  g.arc(130, -40, 18, Math.PI, 0)
  g.lineTo(148, 0)
  g.closePath()
  g.fill()
  g.fillStyle = VENTANA_LUZ
  g.fillRect(101, -88, 6, 12)
  g.fillRect(153, -88, 6, 12)
  g.fillRect(117, -90, 26, 10)
  g.fillStyle = '#d9cdb0'
  g.fillRect(129, -142, 1.6, 27)
  g.fillStyle = '#7fb1dd'
  g.fillRect(130.6, -142, 18, 12)
  g.fillStyle = '#f2efe6'
  g.fillRect(130.6, -138, 18, 4)
  circulo(g, 139.6, -136, 1.3, ORO)
}

// El Puente de la Mujer: el tablero sobre el dique y el mástil blanco inclinado, con sus tensores
function puenteDeLaMujer(g: CanvasRenderingContext2D) {
  const blanco = '#e6dfcc'
  const blancoSombra = '#a59d89'
  g.fillStyle = PIEDRA_SOMBRA
  g.fillRect(30, -18, 10, 18)
  g.fillRect(268, -18, 10, 18)
  poligono(g, PIEDRA_SOMBRA, [194, 0, 199, -18, 221, -18, 226, 0])
  g.strokeStyle = 'rgba(230,223,204,0.7)'
  g.lineWidth = 0.8
  g.beginPath()
  g.moveTo(0, -30)
  g.lineTo(300, -30)
  g.stroke()
  g.fillStyle = blanco
  g.fillRect(0, -24, 300, 6)
  g.fillStyle = blancoSombra
  g.fillRect(0, -19, 300, 2)
  // Tensores, del mástil al tablero
  const [bx, by, px, py] = [210, -24, 264, -152]
  g.strokeStyle = 'rgba(236,229,210,0.75)'
  g.lineWidth = 0.9
  g.beginPath()
  for (let i = 1; i <= 9; i++) {
    const t = 0.16 + i * 0.085
    g.moveTo(bx + (px - bx) * t, by + (py - by) * t)
    g.lineTo(194 - i * 17, -24)
  }
  g.stroke()
  // El mástil, una aguja que se afina hacia la punta
  poligono(g, blanco, [198, -22, 222, -22, px, py])
  poligono(g, blancoSombra, [212, -22, 222, -22, px, py])
}

// La Biblioteca Nacional: el bloque de hormigón de las salas de lectura, sobre cuatro columnas enormes
function bibliotecaNacional(g: CanvasRenderingContext2D) {
  const hormigon = '#9a958b'
  const hormigonLuz = '#bab4a6'
  const hormigonSombra = '#4b4d55'
  poligono(g, hormigon, [50, 0, 70, 0, 76, -84, 44, -84])
  poligono(g, hormigon, [150, 0, 170, 0, 176, -84, 144, -84])
  g.fillStyle = hormigonSombra
  g.fillRect(98, -84, 24, 84)
  g.fillRect(28, -94, 164, 10)
  g.fillStyle = hormigon
  g.fillRect(8, -128, 204, 34)
  g.fillRect(62, -140, 96, 12)
  g.fillRect(86, -146, 48, 6)
  g.fillStyle = hormigonLuz
  g.fillRect(6, -131, 208, 4)
  // Los ventanales de las salas de lectura, con sus parasoles
  g.fillStyle = VENTANA_LUZ
  g.fillRect(14, -120, 192, 12)
  g.fillStyle = hormigon
  for (let x = 22; x < 206; x += 10) g.fillRect(x, -120, 2, 12)
}

// El Planetario: la esfera plateada sobre sus tres patas de hormigón y el aro de la terraza
function planetario(g: CanvasRenderingContext2D) {
  poligono(g, '#5d5a54', [10, 0, 32, 0, 64, -42, 52, -46])
  poligono(g, '#5d5a54', [108, 0, 130, 0, 88, -46, 76, -42])
  poligono(g, '#8e897e', [54, 0, 86, 0, 78, -40, 62, -40])
  g.fillStyle = PIEDRA_SOMBRA
  g.fillRect(44, -4, 52, 4)
  g.fillStyle = '#8e897e'
  g.beginPath()
  g.ellipse(70, -42, 46, 5, 0, 0, Math.PI * 2)
  g.fill()
  const brillo = g.createRadialGradient(54, -96, 4, 70, -82, 44)
  brillo.addColorStop(0, '#efeadd')
  brillo.addColorStop(1, '#7f7b72')
  g.fillStyle = brillo
  g.beginPath()
  g.arc(70, -82, 40, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = 'rgba(40,40,50,0.35)'
  g.lineWidth = 1.2
  g.beginPath()
  g.ellipse(70, -82, 40, 6, 0, 0, Math.PI)
  g.stroke()
}

function torres(ctx: CanvasRenderingContext2D, v: Vista, distancia: number, capa: HTMLCanvasElement) {
  const periodo = 560
  const alto = alturaTorre(v)
  const tope = v.piso - 24 - alto
  const corrimiento = -((distancia * 0.25) % periodo)
  for (let x = corrimiento + 180; x < v.ancho + 200; x += periodo) {
    ctx.drawImage(capa, x - 170, tope - 110, 340, alto + 194)
  }
}

const anchosCartel = new Map<string, number>()

function alambrado(ctx: CanvasRenderingContext2D, v: Vista, distancia: number, tejido: CanvasPattern | null) {
  const base = v.piso - 24
  const tope = v.piso - 108
  const alto = base - tope
  if (tejido) {
    // El tejido se corre con el alambrado (la trama se repite cada 12)
    const corrimiento = (distancia * 0.55) % 12
    ctx.save()
    ctx.translate(-corrimiento, 0)
    ctx.fillStyle = tejido
    ctx.fillRect(corrimiento, tope, v.ancho, alto)
    ctx.restore()
  }
  ctx.fillStyle = '#0e1a2e'
  ctx.fillRect(0, tope - 2, v.ancho, 3)
  const postes = (distancia * 0.55) % 150
  for (let x = -postes; x < v.ancho; x += 150) ctx.fillRect(x, tope - 2, 4, alto + 2)

  // Carteles azules con letras crema, como el de "La app del fulbito y los dolores"
  const periodo = 470
  const vuelta = periodo * CARTELES.length
  const corrimientoCarteles = (distancia * 0.55) % vuelta
  ctx.font = '15px "Bebas Neue", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < CARTELES.length * 2; i++) {
    const x = i * periodo - corrimientoCarteles + 30
    if (x > v.ancho || x + 280 < 0) continue
    const texto = CARTELES[i % CARTELES.length]
    // El ancho se mide una vez (cuando ya cargó la letra)
    let ancho = anchosCartel.get(texto)
    if (ancho === undefined) {
      ancho = Math.max(120, ctx.measureText(texto).width + 34)
      if (document.fonts?.check('15px "Bebas Neue"')) anchosCartel.set(texto, ancho)
    }
    ctx.fillStyle = NAVY
    ctx.fillRect(x, base - 26, ancho, 26)
    ctx.strokeStyle = 'rgba(239,227,198,0.75)'
    ctx.lineWidth = 1.2
    ctx.strokeRect(x + 2.5, base - 23.5, ancho - 5, 21)
    ctx.strokeStyle = TINTA
    ctx.strokeRect(x + 0.5, base - 25.5, ancho - 1, 25)
    ctx.fillStyle = CREMA
    ctx.fillText(texto, x + ancho / 2, base - 12)
  }
}

// Un arco de vez en cuando, del otro lado de la cancha
function arcos(ctx: CanvasRenderingContext2D, v: Vista, distancia: number) {
  const periodo = 3300
  const base = v.piso - 20
  const corrimiento = (distancia * 0.85) % periodo
  // En los últimos 40 m no entra ninguno más: al llegar, el único arco a la vista es el del mano a mano
  const ultimo = (META - 40 * UNIDADES_POR_METRO) * 0.85 + v.ancho
  for (let x = 900 - corrimiento; x < v.ancho + 200; x += periodo) {
    if (x + 170 < 0) continue
    if (x + distancia * 0.85 > ultimo) break
    const ancho = 150
    const alto = 62
    // Red: el fondo del arco, un poco corrido hacia atrás
    ctx.strokeStyle = 'rgba(239,227,198,0.22)'
    ctx.lineWidth = 0.7
    ctx.beginPath()
    for (let i = 0; i <= ancho; i += 10) {
      ctx.moveTo(x + i, base - alto)
      ctx.lineTo(x + i + 14, base - alto - 8)
      ctx.lineTo(x + i + 14, base - 6)
    }
    for (let y = 0; y <= alto; y += 10) {
      ctx.moveTo(x + 14, base - y - 6)
      ctx.lineTo(x + ancho + 14, base - y - 6)
    }
    ctx.stroke()
    // Palos
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, base)
    ctx.lineTo(x, base - alto)
    ctx.lineTo(x + ancho, base - alto)
    ctx.lineTo(x + ancho, base)
    ctx.strokeStyle = TINTA
    ctx.lineWidth = 6
    ctx.stroke()
    ctx.strokeStyle = CREMA
    ctx.lineWidth = 3.4
    ctx.stroke()
  }
}

function cancha(ctx: CanvasRenderingContext2D, v: Vista, distancia: number) {
  const tope = v.piso - 24
  const fondo = v.alto
  const g = ctx.createLinearGradient(0, tope, 0, fondo)
  g.addColorStop(0, '#46522c')
  g.addColorStop(0.3, '#36421f')
  g.addColorStop(1, '#1b2412')
  ctx.fillStyle = g
  ctx.fillRect(0, tope, v.ancho, fondo - tope)

  // Franjas del corte, inclinadas para dar profundidad
  const inclinacion = (fondo - tope) * 0.35
  const corrimiento = distancia % 200
  ctx.fillStyle = 'rgba(239,227,198,0.03)'
  ctx.beginPath()
  for (let x = -corrimiento - inclinacion; x < v.ancho + 200; x += 200) {
    ctx.moveTo(x, tope)
    ctx.lineTo(x + 100, tope)
    ctx.lineTo(x + 100 - inclinacion, fondo)
    ctx.lineTo(x - inclinacion, fondo)
    ctx.closePath()
  }
  ctx.fill()

  // Peladas de tierra: es una cancha de barrio
  ctx.fillStyle = 'rgba(122,96,58,0.28)'
  const vuelta = distancia % 1800
  for (let k = 0; k < 2; k++) {
    for (const m of MANCHAS) {
      const x = m.x - vuelta + k * 1800
      const y = v.piso + 14 + m.y * Math.max(20, fondo - v.piso - 30)
      if (x + m.rx < 0 || x - m.rx > v.ancho) continue
      ctx.beginPath()
      ctx.ellipse(x, y, m.rx, m.rx * m.ry, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Cada tanto, la mitad de cancha: la línea cruzada (inclinada como las franjas) y el círculo central
  const periodo = 2600
  const pendiente = 0.35
  ctx.strokeStyle = 'rgba(239,227,198,0.3)'
  ctx.lineWidth = 2
  for (let k = Math.ceil((distancia - v.xJugador - 600) / periodo); k * periodo - distancia + v.xJugador < v.ancho + 600; k++) {
    if (k <= 0) continue
    const xs = k * periodo - distancia + v.xJugador
    const cy = v.piso + Math.min(150, (fondo - v.piso) * 0.45)
    ctx.beginPath()
    ctx.moveTo(xs - (tope - v.piso) * pendiente, tope)
    ctx.lineTo(xs - (fondo - v.piso) * pendiente, fondo)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(xs - (cy - v.piso) * pendiente, cy, 120, Math.min(34, (fondo - v.piso) * 0.4), 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  // Línea de cal del otro lado de la cancha
  ctx.fillStyle = 'rgba(239,227,198,0.25)'
  ctx.fillRect(0, tope + 3, v.ancho, 1.5)
}

// ---- Muñecos ----

interface Pose {
  cadera: [number, number]  // respecto de los pies
  torso: number             // inclinación (+ hacia adelante)
  piernaA: [number, number] // [ángulo del muslo desde la vertical (+ adelante), flexión de rodilla]
  piernaB: [number, number]
  brazoA: [number, number]  // [ángulo del brazo desde la vertical (+ adelante), flexión de codo]
  brazoB: [number, number]
}

type Cara = 'contento' | 'dolor'

function trazo(ctx: CanvasRenderingContext2D, color: string, ancho: number, x1: number, y1: number, x2: number, y2: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = ancho
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function circulo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, relleno: string, contorno = 0) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = relleno
  ctx.fill()
  if (contorno) {
    ctx.strokeStyle = TINTA
    ctx.lineWidth = contorno
    ctx.stroke()
  }
}

const punto = (x1: number, y1: number, x2: number, y2: number, t: number): [number, number] =>
  [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]

// Primero todos los contornos de la pierna y después los rellenos: así las articulaciones no quedan marcadas
function pierna(
  ctx: CanvasRenderingContext2D, a: Aspecto, hx: number, hy: number, [ang, flex]: [number, number],
  piel: string, lejos: boolean, extra: 'rodillera' | 'tobillera' | null,
) {
  const f = lejos ? 0.72 : 1
  const kx = hx + Math.sin(ang) * a.muslo
  const ky = hy + Math.cos(ang) * a.muslo
  const b = ang - flex
  const ax = kx + Math.sin(b) * a.pierna
  const ay = ky + Math.cos(b) * a.pierna
  const px = ax + Math.cos(b) * 8
  const py = ay - Math.sin(b) * 8
  const w = a.anchoPierna
  const wp = w * 0.82

  trazo(ctx, TINTA, w + 3, hx, hy, kx, ky)
  trazo(ctx, TINTA, wp + 3, kx, ky, ax, ay)
  trazo(ctx, TINTA, 6.5 + 3, ax, ay, px, py)

  trazo(ctx, oscuro(piel, f), w, hx, hy, kx, ky)
  const [sx, sy] = punto(hx, hy, kx, ky, a.cuerpo === 'fulbio' ? 0.6 : 0.5)
  trazo(ctx, oscuro(a.short, f), w + 2.5, hx, hy, sx, sy)
  trazo(ctx, oscuro(piel, f), wp, kx, ky, ax, ay)
  const [m1x, m1y] = punto(kx, ky, ax, ay, 0.32)
  const [m2x, m2y] = punto(kx, ky, ax, ay, 0.44)
  trazo(ctx, oscuro(a.medias, f), wp + 0.5, m1x, m1y, ax, ay)
  trazo(ctx, oscuro(a.bandaMedias, f), wp + 0.7, m1x, m1y, m2x, m2y)
  if (extra === 'rodillera') {
    // Rodillera de guerra
    const [r1x, r1y] = punto(hx, hy, kx, ky, 0.72)
    const [r2x, r2y] = punto(kx, ky, ax, ay, 0.24)
    trazo(ctx, TINTA, w + 3.5, r1x, r1y, kx, ky)
    trazo(ctx, TINTA, w + 3.5, kx, ky, r2x, r2y)
    trazo(ctx, oscuro('#33343a', f), w + 1.5, r1x, r1y, kx, ky)
    trazo(ctx, oscuro('#33343a', f), w + 1.5, kx, ky, r2x, r2y)
    circulo(ctx, kx, ky, 1.6, oscuro('#6d6f78', f))
  } else if (extra === 'tobillera') {
    // Tobillera por las dudas
    const [t1x, t1y] = punto(kx, ky, ax, ay, 0.68)
    trazo(ctx, oscuro('#f2ecdc', f), wp + 1.6, t1x, t1y, ax, ay)
  }
  // Botín negro con las tres tiras
  trazo(ctx, '#141414', 6.5, ax, ay, px, py)
  for (const t of [0.35, 0.55, 0.75]) {
    const [bx, by] = punto(ax, ay, px, py, t)
    trazo(ctx, 'rgba(239,227,198,0.8)', 0.9, bx - Math.sin(b) * 2.2, by - Math.cos(b) * 2.2, bx + Math.sin(b) * 0.4, by + Math.cos(b) * 0.4)
  }
}

function brazo(
  ctx: CanvasRenderingContext2D, a: Aspecto, sx: number, sy: number, [ang, codo]: [number, number],
  piel: string, lejos: boolean,
) {
  const f = lejos ? 0.72 : 1
  const ex = sx + Math.sin(ang) * a.brazo
  const ey = sy + Math.cos(ang) * a.brazo
  const b = ang + codo
  const mx = ex + Math.sin(b) * a.antebrazo
  const my = ey + Math.cos(b) * a.antebrazo
  const w = a.anchoBrazo
  trazo(ctx, TINTA, w + 3, sx, sy, ex, ey)
  trazo(ctx, TINTA, w + 2.5, ex, ey, mx, my)
  circulo(ctx, mx, my, w * 0.55 + 1.5, TINTA)
  trazo(ctx, oscuro(piel, f), w, sx, sy, ex, ey)
  const [cx, cy] = punto(sx, sy, ex, ey, 0.55)
  const [px, py] = punto(sx, sy, ex, ey, 0.66)
  trazo(ctx, oscuro(a.manga, f), w + 2.2, sx, sy, cx, cy)
  trazo(ctx, oscuro(a.puño, f), w + 2.2, cx, cy, px, py)
  trazo(ctx, oscuro(piel, f), w - 0.5, ex, ey, mx, my)
  circulo(ctx, mx, my, w * 0.55, oscuro(piel, f))
}

function torso(ctx: CanvasRenderingContext2D, a: Aspecto, hx: number, hy: number, inclinacion: number, piel: string) {
  const [rx, ry] = a.panza
  const adelante = a.cuerpo === 'fulbio' ? 2.5 : 0
  const cx = hx + Math.sin(inclinacion) * a.torso * 0.5 + Math.cos(inclinacion) * adelante
  const cy = hy - Math.cos(inclinacion) * a.torso * 0.5 + Math.sin(inclinacion) * adelante
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(inclinacion)
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.save()
  ctx.clip()
  const franja = (rx * 2) / a.bastones.length
  a.bastones.forEach((color, i) => {
    ctx.fillStyle = color
    ctx.fillRect(-rx + i * franja, -ry, franja + 0.5, ry * 2)
  })
  if (a.cuerpo === 'fulbio') {
    // La panza que se escapa por debajo de la camiseta
    ctx.fillStyle = piel
    ctx.beginPath()
    ctx.ellipse(rx * 0.35, ry * 0.92, rx * 0.62, 4.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = TINTA
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.ellipse(rx * 0.35, ry * 0.92, rx * 0.62, 4.2, 0, Math.PI, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.strokeStyle = TINTA
  ctx.lineWidth = 2.6
  ctx.stroke()
  if (a.cuerpo === 'fulbio') {
    // Escudito en el pecho
    circulo(ctx, rx * 0.42, -ry * 0.3, 3, NAVY)
    ctx.strokeStyle = ORO
    ctx.lineWidth = 0.9
    ctx.stroke()
  }
  ctx.restore()

  // Short
  const srx = rx * (a.cuerpo === 'fulbio' ? 0.95 : 1.05)
  ctx.beginPath()
  ctx.ellipse(hx + 1, hy + 2, srx, a.cuerpo === 'fulbio' ? 7.5 : 6, 0, 0, Math.PI * 2)
  ctx.fillStyle = a.short
  ctx.fill()
  ctx.strokeStyle = TINTA
  ctx.lineWidth = 2.4
  ctx.stroke()
  trazo(ctx, a.franjaShort, 1.6, hx - srx * 0.25, hy - 4.5, hx - srx * 0.32, hy + 8)
}

function cabezaFulbio(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, cara: Cara) {
  // Pelo despeinado por la vida (atrás)
  ctx.beginPath()
  for (let i = 0; i <= 14; i++) {
    const ang = ((150 + i * 14) * Math.PI) / 180
    const rr = i % 2 ? r + 1 : r + 5.5 + (i % 4 === 0 ? 1.5 : 0)
    ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr)
  }
  ctx.closePath()
  ctx.fillStyle = DON_FULBIO.pelo
  ctx.fill()
  ctx.strokeStyle = TINTA
  ctx.lineWidth = 1.4
  ctx.stroke()
  // Cara y oreja
  circulo(ctx, x, y, r, PIEL_FULBIO, 2.2)
  circulo(ctx, x - 2.5, y + 1.5, 2.6, oscuro(PIEL_FULBIO, 0.85), 1.1)
  // Flequillo
  ctx.beginPath()
  ctx.moveTo(x - r * 0.6, y - r * 0.75)
  ctx.lineTo(x + r * 0.15, y - r * 1.05)
  ctx.lineTo(x + r * 0.05, y - r * 0.55)
  ctx.lineTo(x + r * 0.55, y - r * 0.85)
  ctx.lineTo(x + r * 0.4, y - r * 0.45)
  ctx.lineTo(x + r * 0.85, y - r * 0.5)
  ctx.lineTo(x + r * 0.6, y - r * 1.05)
  ctx.lineTo(x - r * 0.2, y - r * 1.25)
  ctx.closePath()
  ctx.fillStyle = DON_FULBIO.pelo
  ctx.fill()
  // Cachete colorado
  ctx.fillStyle = 'rgba(216,105,92,0.35)'
  ctx.beginPath()
  ctx.arc(x + 3, y + 3.5, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = TINTA
  ctx.lineCap = 'round'
  ctx.lineWidth = 1.4
  if (cara === 'contento') {
    // Ojo cerrado de risa y ceja
    ctx.beginPath()
    ctx.arc(x + 5, y - 1, 2.2, Math.PI * 1.1, Math.PI * 1.9)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + 2.5, y - 5.5)
    ctx.quadraticCurveTo(x + 5, y - 7, x + 7.5, y - 5.8)
    ctx.stroke()
    // Sonrisa grande
    ctx.beginPath()
    ctx.moveTo(x + 3, y + 5.2)
    ctx.quadraticCurveTo(x + 7.5, y + 11, x + 10, y + 4.8)
    ctx.closePath()
    ctx.fillStyle = '#5a1f1a'
    ctx.fill()
    ctx.stroke()
    trazo(ctx, CREMA, 1.2, x + 4, y + 5.8, x + 9, y + 5.5)
  } else {
    // ¿Qué fue ese dolor?: ojos apretados y boca torcida
    trazo(ctx, TINTA, 1.4, x + 3, y - 2.5, x + 6.5, y - 1)
    trazo(ctx, TINTA, 1.4, x + 3, y + 0.5, x + 6.5, y - 1)
    ctx.beginPath()
    ctx.moveTo(x + 3, y + 7)
    ctx.lineTo(x + 5, y + 5.5)
    ctx.lineTo(x + 7, y + 7)
    ctx.lineTo(x + 9.5, y + 5.6)
    ctx.stroke()
  }
  // Nariz colorada
  circulo(ctx, x + r * 0.95, y + 0.8, 3.9, '#d8695c', 1.4)
  circulo(ctx, x + r * 0.95 + 1, y - 0.6, 1, 'rgba(255,240,220,0.8)')
}

function cabezaRival(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, piel: string) {
  circulo(ctx, x, y, r, piel, 2)
  ctx.beginPath()
  ctx.arc(x, y, r + 0.8, (150 * Math.PI) / 180, (335 * Math.PI) / 180)
  ctx.closePath()
  ctx.fillStyle = RIVAL.pelo
  ctx.fill()
  ctx.strokeStyle = TINTA
  ctx.lineWidth = 1.2
  ctx.stroke()
  circulo(ctx, x - 1, y + 1, 1.8, oscuro(piel, 0.8))
  circulo(ctx, x + 4.2, y - 0.8, 1.1, TINTA)
  ctx.lineCap = 'round'
  trazo(ctx, TINTA, 1.3, x + 2, y - 3.6, x + 6.2, y - 2.2)   // cejas de pocos amigos
  trazo(ctx, TINTA, 1.1, x + 4, y + 4, x + 6.8, y + 3.6)
}

function muñeco(
  ctx: CanvasRenderingContext2D, a: Aspecto, x: number, y: number, mirando: number, pose: Pose,
  opciones: { piel?: string; escala?: number; rotacion?: number; cara?: Cara } = {},
) {
  const piel = opciones.piel ?? PIEL_FULBIO
  const escala = opciones.escala ?? 1
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(mirando * escala, escala)
  if (opciones.rotacion) ctx.rotate(opciones.rotacion)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const [hx, hy] = pose.cadera
  const t = pose.torso
  const sx = hx + Math.sin(t) * a.torso
  const sy = hy - Math.cos(t) * a.torso
  const fulbio = a.cuerpo === 'fulbio'
  const cuello = fulbio ? 2 : 3
  const cx = hx + Math.sin(t) * (a.torso + a.cabeza + cuello)
  const cy = hy - Math.cos(t) * (a.torso + a.cabeza + cuello)

  brazo(ctx, a, sx, sy, pose.brazoB, piel, true)
  pierna(ctx, a, hx, hy, pose.piernaB, piel, true, fulbio ? 'tobillera' : null)
  torso(ctx, a, hx, hy, t, piel)
  pierna(ctx, a, hx, hy, pose.piernaA, piel, false, fulbio ? 'rodillera' : null)
  brazo(ctx, a, sx, sy, pose.brazoA, piel, false)
  // Cuello de la camiseta
  trazo(ctx, TINTA, 6, sx - 3, sy + 1.5, sx + 3.5, sy - 0.5)
  trazo(ctx, a.puño, 3.5, sx - 3, sy + 1.5, sx + 3.5, sy - 0.5)
  if (fulbio) cabezaFulbio(ctx, cx, cy, a.cabeza, opciones.cara ?? 'contento')
  else cabezaRival(ctx, cx, cy, a.cabeza, piel)
  ctx.restore()
}

// Poses de Don Fulbio (cadera baja: piernas cortas)
const correr = (p: number): Pose => {
  const rebote = Math.abs(Math.cos(p)) * 3
  return {
    cadera: [0, -29 - rebote],
    torso: 0.12,
    piernaA: [0.75 * Math.sin(p), 0.3 + 1.1 * Math.max(0, Math.cos(p))],
    piernaB: [0.75 * Math.sin(p + Math.PI), 0.3 + 1.1 * Math.max(0, Math.cos(p + Math.PI))],
    brazoA: [0.2 - 0.85 * Math.sin(p), 1.5],
    brazoB: [0.2 + 0.85 * Math.sin(p), 1.5],
  }
}

const enElAire = (vy: number): Pose => vy > 0
  ? { cadera: [0, -31], torso: 0.05, piernaA: [1.0, 1.7], piernaB: [-0.3, 1.4], brazoA: [2.4, 0.5], brazoB: [1.9, 0.6] }
  : { cadera: [0, -30], torso: 0.1, piernaA: [0.6, 0.7], piernaB: [-0.2, 0.6], brazoA: [1.9, 0.4], brazoB: [-0.6, 0.8] }

// Bicicleta: la pierna de adelante pasa por arriba de la pelota
const gambeteando = (q: number): Pose => {
  const s = Math.sin(q * Math.PI)
  return {
    cadera: [0, -29],
    torso: 0.06 - 0.16 * s,
    piernaA: [0.3 + 0.7 * Math.sin(q * Math.PI * 2), 0.5 + 0.5 * s],
    piernaB: [-0.25, 0.4],
    brazoA: [0.3 + 1.3 * s, 0.4],
    brazoB: [-0.2 - 1.2 * s, 0.4],
  }
}

// Caño: le pega con la punta para mandarla entre las piernas
const tirandoCaño = (q: number): Pose => {
  const s = Math.sin(q * Math.PI)
  const toque = Math.max(0, 1 - q * 3)
  return {
    cadera: [0, -29],
    torso: 0.15,
    piernaA: [0.25 + 0.85 * toque, 0.35 + 0.6 * (1 - toque)],
    piernaB: [-0.35, 0.6],
    brazoA: [0.2 + 1.0 * s, 0.7],
    brazoB: [-0.1 - 1.0 * s, 0.7],
  }
}

const POSE_CAIDO: Pose = { cadera: [0, -29], torso: 0.2, piernaA: [0.7, 0.9], piernaB: [-0.3, 0.8], brazoA: [2.4, 0.4], brazoB: [1.8, 0.5] }

// Poses de los rivales
const parado = (fase: number): Pose => {
  const rebote = Math.sin(fase * 9) * 1.2
  return { cadera: [0, -33 + rebote], torso: 0.28, piernaA: [0.38, 0.55], piernaB: [-0.3, 0.55], brazoA: [0.75, 0.5], brazoB: [-0.45, 0.6] }
}
const abierto = (fase: number): Pose => {
  const rebote = Math.sin(fase * 9) * 1
  return { cadera: [0, -26 + rebote], torso: 0.12, piernaA: [0.74, 0.1], piernaB: [-0.74, 0.1], brazoA: [1.6, 0.3], brazoB: [-1.4, 0.3] }
}
const POSE_SALTO_RIVAL: Pose = { cadera: [0, -36], torso: 0.05, piernaA: [0.25, 0.9], piernaB: [-0.15, 1.1], brazoA: [2.9, 0.15], brazoB: [2.7, 0.2] }
const POSE_DESPARRAMADO: Pose = { cadera: [0, -34], torso: 0.1, piernaA: [0.7, 0.3], piernaB: [0.95, 0.5], brazoA: [2.4, 0.3], brazoB: [2.0, 0.3] }
const POSE_MIRANDO: Pose = { cadera: [0, -35], torso: -0.05, piernaA: [0.12, 0.15], piernaB: [-0.12, 0.15], brazoA: [2.5, 0.6], brazoB: [2.2, 0.6] }
// Tirado hacia atrás con una pierna estirada al ras del pasto, la otra doblada abajo y un brazo apoyado
const POSE_BARRIDA: Pose = { cadera: [0, -14], torso: -1.15, piernaA: [1.5, 0.05], piernaB: [1.3, 2.5], brazoA: [-0.6, -0.4], brazoB: [2.6, 0.3] }

// ---- Personajes con imágenes (las piezas dibujadas para el juego, en public/juego) ----
// Don Fulbio se arma como un títere: cada pieza se engancha en su articulación (p) y, en brazos y piernas,
// la siguiente va donde termina (e). Los rivales son una imagen entera por pose. Las medidas son en píxeles
// del archivo .webp. Mientras las imágenes no cargan, se usan los muñecos dibujados de arriba.

interface DefPieza { src: string; w: number; h: number; p: [number, number]; e?: [number, number] }

const ESCALA_FULBIO = 0.1275   // unidades del mundo por píxel, piezas de Don Fulbio
const TAMAÑO_FULBIO = 1.15     // todo el títere, un poco más grande que la hoja (al lado de los rivales quedaba chico)
const ESCALA_SENTADO = 0.205
const ESCALA_RIVAL = 0.265

const PIEZAS = {
  cabezaContento: { src: '/juego/fulbio/cabeza-contento.webp', w: 116, h: 132, p: [64, 118] },
  cabezaDolor: { src: '/juego/fulbio/cabeza-dolor.webp', w: 114, h: 133, p: [62, 119] },
  cabezaGrito: { src: '/juego/fulbio/cabeza-grito.webp', w: 114, h: 132, p: [62, 118] },
  torso: { src: '/juego/fulbio/torso.webp', w: 144, h: 144, p: [78, 128] },
  short: { src: '/juego/fulbio/short.webp', w: 138, h: 96, p: [68, 78] },
  brazo: { src: '/juego/fulbio/brazo.webp', w: 57, h: 108, p: [31, 12], e: [25, 96] },
  antebrazo: { src: '/juego/fulbio/antebrazo.webp', w: 47, h: 104, p: [24, 10], e: [22, 94] },
  muslo: { src: '/juego/fulbio/muslo.webp', w: 70, h: 96, p: [35, 10], e: [34, 86] },
  piernaRodillera: { src: '/juego/fulbio/pierna-rodillera.webp', w: 60, h: 115, p: [32, 11], e: [23, 104] },
  piernaTobillera: { src: '/juego/fulbio/pierna-tobillera.webp', w: 56, h: 114, p: [28, 11], e: [23, 104] },
  botin: { src: '/juego/fulbio/botin.webp', w: 106, h: 61, p: [35, 10] },
  pelota: { src: '/juego/fulbio/pelota.webp', w: 82, h: 86, p: [41, 43] },
  sentado: { src: '/juego/fulbio/sentado.webp', w: 387, h: 232, p: [150, 228] },
  parado: { src: '/juego/rival/parado.webp', w: 154, h: 253, p: [77, 250] },
  abierto: { src: '/juego/rival/abierto.webp', w: 291, h: 233, p: [146, 230] },
  barrida: { src: '/juego/rival/barrida.webp', w: 286, h: 200, p: [0, 196] },
  saltando: { src: '/juego/rival/saltando.webp', w: 199, h: 301, p: [100, 298] },
  caido: { src: '/juego/rival/caido.webp', w: 314, h: 164, p: [157, 160] },
  deEspaldas: { src: '/juego/rival/de-espaldas.webp', w: 208, h: 303, p: [104, 300] },
  // Mano a mano: el arquero de frente y Don Fulbio de espaldas. En las estiradas, p queda entre los guantes
  arqueroParado: { src: '/juego/arquero/parado.webp', w: 364, h: 399, p: [180, 396] },
  arqueroBajo: { src: '/juego/arquero/volando-bajo.webp', w: 547, h: 251, p: [468, 141] },
  arqueroAlto: { src: '/juego/arquero/volando-alto.webp', w: 485, h: 464, p: [412, 60] },
  arqueroCaido: { src: '/juego/arquero/caido.webp', w: 421, h: 252, p: [210, 248] },
  arqueroAtajando: { src: '/juego/arquero/atajando.webp', w: 260, h: 563, p: [130, 560] },
  arqueroLamento: { src: '/juego/arquero/lamento.webp', w: 263, h: 422, p: [128, 418] },
  arqueroAlivio: { src: '/juego/arquero/alivio.webp', w: 296, h: 561, p: [145, 557] },
  espaldasListo: { src: '/juego/fulbio/espaldas-listo.webp', w: 291, h: 514, p: [148, 511] },
  espaldasPatea: { src: '/juego/fulbio/espaldas-patea.webp', w: 491, h: 489, p: [178, 485] },
  espaldasFesteja: { src: '/juego/fulbio/espaldas-festeja.webp', w: 365, h: 528, p: [185, 524] },
  espaldasLamenta: { src: '/juego/fulbio/espaldas-lamenta.webp', w: 290, h: 515, p: [136, 511] },
} satisfies Record<string, DefPieza>

type NombrePieza = keyof typeof PIEZAS
type Cabeza = 'cabezaContento' | 'cabezaDolor' | 'cabezaGrito'

// Puntos del torso y del short (en píxeles de su archivo)
const TORSO_HOMBRO: [number, number] = [30, 45]         // la manga que se ve: ahí va el brazo de adelante
const TORSO_HOMBRO_LEJOS: [number, number] = [112, 42]  // el brazo de atrás asoma del otro lado del pecho
const TORSO_CUELLO: [number, number] = [80, 25]
const SENTADO_CABEZA: [number, number] = [65, 50]   // dónde está la cabeza en la pose de sentado
const SHORT_CINTURA = 8

// Algunas piezas van más grandes que en la hoja: Don Fulbio es cabezón y panzón, como en los afiches
const AJUSTE: Partial<Record<NombrePieza, number>> = {
  cabezaContento: 1.3, cabezaDolor: 1.3, cabezaGrito: 1.3, torso: 1.2, short: 1.15,
  brazo: 1.1, antebrazo: 1.1, muslo: 1.05, botin: 0.95, pelota: 1.3,
}
const RIVALES = { parado: 1, abierto: 1, barrida: 1, saltando: 1, caido: 1, deEspaldas: 1 }
const DEL_REMATE = {
  arqueroParado: 1, arqueroBajo: 1, arqueroAlto: 1, arqueroCaido: 1, arqueroAtajando: 1, arqueroLamento: 1,
  arqueroAlivio: 1, espaldasListo: 1, espaldasPatea: 1, espaldasFesteja: 1, espaldasLamenta: 1,
}
const ESCALA_REMATE = 0.26   // el mano a mano agranda esto según el tamaño del arco
const escalaDe = (n: NombrePieza) =>
  (n === 'sentado' ? ESCALA_SENTADO : n in RIVALES ? ESCALA_RIVAL : n in DEL_REMATE ? ESCALA_REMATE : ESCALA_FULBIO) *
  (AJUSTE[n] ?? 1)

const imagenes = new Map<NombrePieza, HTMLImageElement>()
let personajesListos = false
let remateListo = false
let cargando: Promise<void> | null = null

const cargar = (nombres: NombrePieza[]) => Promise.all(nombres.map((n) => new Promise<void>((listo, error) => {
  const img = new Image()
  img.onload = () => { imagenes.set(n, img); listo() }
  img.onerror = () => error(new Error(`No cargó ${PIEZAS[n].src}`))
  img.src = PIEZAS[n].src
})))

export function cargarImagenes() {
  if (!cargando) {
    const escudo = new Image()
    escudo.onload = () => { imagenEscudo = escudo }
    escudo.src = '/juego/escudo-futboleros.webp'
    // Primero lo de la carrera; lo del mano a mano se pide después, que recién se ve al final
    const nombres = Object.keys(PIEZAS) as NombrePieza[]
    cargando = cargar(nombres.filter((n) => !(n in DEL_REMATE))).then(() => {
      personajesListos = true
      cargar(nombres.filter((n) => n in DEL_REMATE)).then(() => { remateListo = true }).catch(() => {})
    })
  }
  return cargando
}

// Cada pieza se pasa una vez al tamaño en que se va a ver (achicarla en cada cuadro la hace titilar), y las
// de atrás tienen además su versión oscurecida. En el mano a mano el arquero está más cerca y se ve más
// grande: ese aumento va redondeado, para que no se arme una copia por cada tamaño de ventana
let kActual = 1
let kSprites = 0
const sprites = new Map<string, HTMLCanvasElement>()

function sprite(n: NombrePieza, oscura: boolean, aumento: number) {
  if (kActual !== kSprites) {
    sprites.clear()
    kSprites = kActual
  }
  const clave = `${n}${oscura ? '·' : ''}${aumento === 1 ? '' : '×' + aumento}`
  let c = sprites.get(clave)
  if (!c) {
    const d = PIEZAS[n]
    const img = imagenes.get(n) as HTMLImageElement
    const f = escalaDe(n) * aumento * kActual * 1.25
    c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(d.w * f))
    c.height = Math.max(1, Math.round(d.h * f))
    const g = c.getContext('2d') as CanvasRenderingContext2D
    g.imageSmoothingQuality = 'high'
    g.drawImage(img, 0, 0, c.width, c.height)
    if (oscura) {
      g.globalCompositeOperation = 'source-atop'
      g.fillStyle = 'rgba(8,14,30,0.38)'
      g.fillRect(0, 0, c.width, c.height)
    }
    sprites.set(clave, c)
  }
  return c
}

function pieza(
  ctx: CanvasRenderingContext2D, n: NombrePieza, x: number, y: number,
  angulo = 0, oscura = false, escalaY = 1, aumento = 1, espejo = false,
) {
  const d = PIEZAS[n]
  const esc = escalaDe(n) * aumento
  ctx.save()
  ctx.translate(x, y)
  if (angulo) ctx.rotate(angulo)
  if (escalaY !== 1 || espejo) ctx.scale(espejo ? -1 : 1, escalaY)
  ctx.drawImage(sprite(n, oscura, aumento), -d.p[0] * esc, -d.p[1] * esc, d.w * esc, d.h * esc)
  ctx.restore()
}

// Brazo o pierna: se engancha en (x, y) y apunta en el ángulo a (desde la vertical, + adelante), como en
// las poses. Devuelve dónde termina, para enganchar la pieza siguiente
function segmento(ctx: CanvasRenderingContext2D, n: NombrePieza, x: number, y: number, a: number, oscura: boolean): [number, number] {
  const d: DefPieza = PIEZAS[n]
  const [px, py] = d.p
  const [ex, ey] = d.e ?? d.p
  const propio = Math.atan2(ex - px, ey - py)
  const largo = Math.hypot(ex - px, ey - py) * escalaDe(n)
  pieza(ctx, n, x, y, propio - a, oscura)
  return [x + Math.sin(a) * largo, y + Math.cos(a) * largo]
}

function brazoConImagen(ctx: CanvasRenderingContext2D, x: number, y: number, [a, codo]: [number, number], oscura: boolean) {
  const [ex, ey] = segmento(ctx, 'brazo', x, y, a, oscura)
  segmento(ctx, 'antebrazo', ex, ey, a + codo, oscura)
}

function piernaConImagen(
  ctx: CanvasRenderingContext2D, x: number, y: number, [a, flex]: [number, number],
  n: 'piernaRodillera' | 'piernaTobillera', oscura: boolean,
) {
  const [kx, ky] = segmento(ctx, 'muslo', x, y, a, oscura)
  const b = a - flex
  const [tx, ty] = segmento(ctx, n, kx, ky, b, oscura)
  pieza(ctx, 'botin', tx, ty, -b, oscura)
}

function fulbioConImagenes(ctx: CanvasRenderingContext2D, pose: Pose, cabeza: Cabeza) {
  const [hx, hy] = pose.cadera
  const t = pose.torso
  // El torso se apoya en el elástico del short (la panza lo tapa un poco) y se inclina desde ahí
  const st = escalaDe('torso')
  const bx = hx
  const by = hy - (PIEZAS.short.p[1] - SHORT_CINTURA) * escalaDe('short') + 2.5
  const enTorso = ([px, py]: [number, number]): [number, number] => {
    const dx = (px - PIEZAS.torso.p[0]) * st
    const dy = (py - PIEZAS.torso.p[1]) * st
    return [bx + dx * Math.cos(t) - dy * Math.sin(t), by + dx * Math.sin(t) + dy * Math.cos(t)]
  }
  const [sx, sy] = enTorso(TORSO_HOMBRO)
  const [lx, ly] = enTorso(TORSO_HOMBRO_LEJOS)
  const [cx, cy] = enTorso(TORSO_CUELLO)
  brazoConImagen(ctx, lx, ly, pose.brazoB, true)
  piernaConImagen(ctx, hx - 1.5, hy, pose.piernaB, 'piernaTobillera', true)
  pieza(ctx, 'short', hx, hy)
  pieza(ctx, cabeza, cx, cy, t * 0.5)   // antes que el torso: el cuello de la camiseta tapa el del muñeco
  pieza(ctx, 'torso', bx, by, t)
  piernaConImagen(ctx, hx + 1.5, hy, pose.piernaA, 'piernaRodillera', false)
  brazoConImagen(ctx, sx, sy, pose.brazoA, false)
}

// Don Fulbio con sus piezas si ya cargaron; si no, el muñeco dibujado
function fulbio(
  ctx: CanvasRenderingContext2D, x: number, y: number, pose: Pose,
  opciones: { escala?: number; rotacion?: number; cabeza?: Cabeza } = {},
) {
  if (!personajesListos) {
    muñeco(ctx, DON_FULBIO, x, y, 1, pose, {
      escala: opciones.escala, rotacion: opciones.rotacion,
      cara: opciones.cabeza === 'cabezaDolor' ? 'dolor' : 'contento',
    })
    return
  }
  const escala = (opciones.escala ?? 1) * TAMAÑO_FULBIO
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(escala, escala)
  if (opciones.rotacion) ctx.rotate(opciones.rotacion)
  fulbioConImagenes(ctx, pose, opciones.cabeza ?? 'cabezaContento')
  ctx.restore()
}

const radioPelota = () => (personajesListos ? (PIEZAS.pelota.w * escalaDe('pelota')) / 2 : 6.5)

const suave = (t: number) => 1 - (1 - t) * (1 - t)

function sombra(ctx: CanvasRenderingContext2D, x: number, y: number, ancho: number, altura: number) {
  const f = Math.max(0.35, 1 - altura / 200)
  ctx.fillStyle = `rgba(8,12,20,${0.4 * f})`
  ctx.beginPath()
  ctx.ellipse(x, y + 3, ancho * f, 4 * f, 0, 0, Math.PI * 2)
  ctx.fill()
}

// Pelota de cuero de otras épocas (la imagen, o dibujada mientras carga)
function pelota(ctx: CanvasRenderingContext2D, x: number, y: number, giro: number) {
  if (personajesListos) {
    pieza(ctx, 'pelota', x, y, giro)
    return
  }
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(giro)
  circulo(ctx, 0, 0, 6.5, '#8b6a45', 1.6)
  ctx.strokeStyle = 'rgba(26,22,18,0.75)'
  ctx.lineWidth = 0.9
  ctx.beginPath()
  ctx.moveTo(-6, -1.5)
  ctx.quadraticCurveTo(0, -3.5, 6, -1.5)
  ctx.moveTo(-5, 3)
  ctx.quadraticCurveTo(0, 1, 5, 3)
  ctx.moveTo(-1, -6.3)
  ctx.quadraticCurveTo(-2.5, 0, -1, 6.3)
  ctx.stroke()
  circulo(ctx, -2, -2.5, 1.4, 'rgba(239,227,198,0.35)')
  ctx.restore()
}

function signoDePregunta(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.font = '22px "Bebas Neue", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.lineWidth = 3
  ctx.strokeStyle = TINTA
  ctx.strokeText('?', x, y)
  ctx.fillStyle = CREMA
  ctx.fillText('?', x, y)
}

// Rivales con sus imágenes: una por pose. Los que esperan parados "respiran" (se achican apenas de alto)
function rivalConImagen(ctx: CanvasRenderingContext2D, r: Rival, j: Juego, v: Vista, x: number) {
  if (r.tipo === 'barrida') {
    sombra(ctx, x + 40, v.piso, 40, 0)
    pieza(ctx, 'barrida', x - 2, v.piso + 1)
    return
  }
  const centro = x + r.ancho / 2
  const fase = j.tiempo + r.x * 0.01
  const respira = 1 - 0.015 * (1 + Math.sin(fase * 9))
  sombra(ctx, centro, v.piso, r.tipo === 'abierto' ? 30 : 18, r.salto)
  if (r.pasado === 'gambeta') {
    // Queda en cuatro patas: cae desde un poco más arriba
    const c = suave(r.caida)
    pieza(ctx, 'caido', centro + 6 * c, v.piso + 1 - 10 * (1 - c))
  } else if (r.pasado === 'caño' && r.caida < 0.4) {
    pieza(ctx, 'abierto', centro, v.piso + 1, 0, false, respira)   // la pelota está pasando entre las piernas
  } else if (r.pasado === 'caño') {
    // Lo dejaste mirando: se da vuelta a buscar la pelota
    pieza(ctx, 'deEspaldas', centro, v.piso + 1)
    signoDePregunta(ctx, centro - 4, v.piso - 92)
  } else if (r.saltó && r.salto > 0) {
    pieza(ctx, 'saltando', centro, v.piso + 1 - r.salto)
  } else {
    pieza(ctx, r.tipo === 'abierto' ? 'abierto' : 'parado', centro, v.piso + 1, 0, false, respira)
  }
}

function dibujarRival(ctx: CanvasRenderingContext2D, r: Rival, j: Juego, v: Vista) {
  const x = r.x - j.distancia + v.xJugador
  if (x > v.ancho + 100 || x + r.ancho < -100) return
  if (personajesListos) {
    rivalConImagen(ctx, r, j, v, x)
    return
  }
  const piel = r.piel
  if (r.tipo === 'barrida') {
    sombra(ctx, x + 36, v.piso, 38, 0)
    muñeco(ctx, RIVAL, x + 40, v.piso, -1, POSE_BARRIDA, { piel })
    return
  }
  const centro = x + r.ancho / 2
  sombra(ctx, centro, v.piso, r.tipo === 'abierto' ? 20 : 13, r.salto)
  if (r.pasado === 'gambeta') {
    muñeco(ctx, RIVAL, centro, v.piso, -1, POSE_DESPARRAMADO, { piel, rotacion: -1.35 * suave(r.caida) })
  } else if (r.pasado === 'caño' && r.caida < 0.4) {
    // La pelota todavía está pasando entre las piernas
    muñeco(ctx, RIVAL, centro, v.piso, -1, abierto(j.tiempo + r.x * 0.01), { piel })
  } else if (r.pasado === 'caño') {
    // Lo dejaste mirando: se da vuelta a buscar la pelota
    muñeco(ctx, RIVAL, centro, v.piso, -Math.cos(((r.caida - 0.4) / 0.6) * Math.PI), POSE_MIRANDO, { piel })
    signoDePregunta(ctx, centro + 2, v.piso - 74)
  } else if (r.saltó && r.salto > 0) {
    muñeco(ctx, RIVAL, centro, v.piso - r.salto, -1, POSE_SALTO_RIVAL, { piel })
  } else {
    const fase = j.tiempo + r.x * 0.01
    muñeco(ctx, RIVAL, centro, v.piso, -1, r.tipo === 'abierto' ? abierto(fase) : parado(fase), { piel })
  }
}

function estrellitas(ctx: CanvasRenderingContext2D, x: number, y: number, tiempo: number) {
  for (let i = 0; i < 3; i++) {
    const a = tiempo * 4 + (i * Math.PI * 2) / 3
    estrella(ctx, x + Math.cos(a) * 14, y + Math.sin(a) * 5, 4.5, ORO, a)
  }
}

function dibujarJugador(ctx: CanvasRenderingContext2D, j: Juego, v: Vista) {
  const x = v.xJugador
  const pies = v.piso - j.y
  sombra(ctx, x + 4, v.piso, 17, j.y)

  if (j.estado === 'cayendo' || j.estado === 'fin') {
    const tc = j.tiempoCaida
    const haciaAdelante = j.motivo === 'barrida'
    const bx = x + 21 + tc * 260 * Math.max(0, 1 - tc * 0.4)
    const by = v.piso - radioPelota() - Math.abs(Math.sin(tc * 12)) * 22 * Math.exp(-3 * tc)
    pelota(ctx, bx, by, j.distancia / 6.5 + tc * 10)
    if (personajesListos && tc > 0.16) {
      // Sentado en el pasto agarrándose el tobillo, con un rebotecito al caer
      const t = tc - 0.16
      const rebote = Math.abs(Math.sin(t * 9)) * 8 * Math.exp(-5 * t)
      pieza(ctx, 'sentado', x + 8, v.piso + 1 - rebote)
      if (tc > 0.45) {
        const e = escalaDe('sentado')
        const [cx, cy] = SENTADO_CABEZA
        estrellitas(ctx, x + 8 + (cx - PIEZAS.sentado.p[0]) * e, v.piso + 1 + (cy - PIEZAS.sentado.p[1]) * e - 12, tc)
      }
      return
    }
    const t = Math.min(1, tc / 0.45)
    fulbio(ctx, x, pies, POSE_CAIDO, { rotacion: (haciaAdelante ? 1.45 : -1.3) * suave(t), cabeza: 'cabezaDolor' })
    if (tc > 0.4) estrellitas(ctx, x + (haciaAdelante ? 62 : -56), v.piso - 24, tc)
    return
  }

  const q = progresoJugada(j)
  if (j.jugada && q > 0) {
    const s = Math.sin(q * Math.PI)
    ctx.strokeStyle = 'rgba(212,165,74,0.6)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      const ly = pies - 16 - s * 16 - i * 13
      ctx.globalAlpha = 0.6 * s
      ctx.beginPath()
      ctx.moveTo(x - 18 - i * 6, ly)
      ctx.lineTo(x - 50 - i * 10, ly)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    const pose = j.jugada === 'caño' ? tirandoCaño(q) : gambeteando(q)
    fulbio(ctx, x, pies - s * 16, pose, { escala: 1 - 0.08 * s })
    return
  }

  if (j.enAire) {
    fulbio(ctx, x, pies, enElAire(j.vy), { cabeza: 'cabezaGrito' })
    return
  }
  fulbio(ctx, x, pies, correr(j.fasePaso))
}

// La pelota va aparte: en el caño pasa por delante del rival, entre las piernas
function dibujarPelota(ctx: CanvasRenderingContext2D, j: Juego, v: Vista) {
  if (j.estado === 'cayendo' || j.estado === 'fin') return
  const x = v.xJugador
  const pies = v.piso - j.y
  const giro = j.distancia / 6.5
  const r = radioPelota()
  const q = progresoJugada(j)
  if (j.jugada === 'caño' && q > 0) {
    // Sale por entre las piernas y Don Fulbio la va a buscar por el costado
    pelota(ctx, x + 19 + 78 * Math.sin(q * Math.PI), v.piso - r, giro * 1.6)
  } else if (j.jugada === 'gambeta' && q > 0) {
    const s = Math.sin(q * Math.PI)
    pelota(ctx, x + 19 + 7 * Math.cos(q * Math.PI * 2), pies - r + 0.5 - s * 14, giro)
  } else if (j.enAire) {
    pelota(ctx, x + 17, pies - r + 2.5, giro)
  } else {
    pelota(ctx, x + 21 + Math.sin(j.fasePaso * 2) * 2, pies - r - Math.abs(Math.sin(j.fasePaso)) * 5, giro)
  }
}

function pistas(ctx: CanvasRenderingContext2D, j: Juego, v: Vista, tactil: boolean) {
  if (j.estado !== 'jugando') return
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.lineJoin = 'round'
  for (const r of j.rivales) {
    if (!r.pista || r.pasado) continue
    const x = r.x - j.distancia + v.xJugador + r.ancho / 2
    if (x < v.xJugador + 30 || x > v.ancho - 20) continue
    const titulo = r.tipo === 'barrida' ? '↑ ' + r.pista : r.tipo === 'parado' ? r.pista + ' →' : r.pista + ' ↓'
    const tecla = tactil
      ? (r.tipo === 'barrida' ? 'BOTÓN SALTAR' : r.tipo === 'parado' ? 'BOTÓN GAMBETA' : 'BOTÓN CAÑO (O GAMBETA)')
      : (r.tipo === 'barrida' ? 'ESPACIO O ↑' : r.tipo === 'parado' ? '→ O D' : '↓ O S (O GAMBETA)')
    ctx.globalAlpha = 0.8 + 0.2 * Math.sin(j.tiempo * 8)
    ctx.font = '24px "Bebas Neue", sans-serif'
    ctx.lineWidth = 4
    ctx.strokeStyle = TINTA
    ctx.strokeText(titulo, x, v.piso - 120)
    ctx.fillStyle = ORO
    ctx.fillText(titulo, x, v.piso - 120)
    ctx.font = '700 9px Montserrat, sans-serif'
    ctx.lineWidth = 3
    ctx.strokeText(tecla, x, v.piso - 106)
    ctx.fillStyle = CREMA
    ctx.fillText(tecla, x, v.piso - 106)
    ctx.globalAlpha = 1
  }
}

function efectos(ctx: CanvasRenderingContext2D, j: Juego, v: Vista) {
  for (const p of j.particulas) {
    ctx.globalAlpha = Math.max(0, p.vida / p.total)
    ctx.fillStyle = p.color
    ctx.fillRect(p.x - j.distancia + v.xJugador, v.piso - p.y, p.tam, p.tam)
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.lineJoin = 'round'
  for (const t of j.textos) {
    ctx.globalAlpha = Math.min(1, t.vida / 0.4)
    ctx.font = `${t.grande ? 30 : 20}px "Bebas Neue", sans-serif`
    const x = t.x - j.distancia + v.xJugador
    const y = v.piso - t.y
    ctx.lineWidth = 4
    ctx.strokeStyle = TINTA
    ctx.strokeText(t.texto, x, y)
    ctx.fillStyle = t.texto.startsWith('+') ? CREMA : ORO
    ctx.fillText(t.texto, x, y)
  }
  ctx.globalAlpha = 1
}

function marcador(ctx: CanvasRenderingContext2D, j: Juego, v: Vista, arriba: number) {
  if (j.estado === 'listo') return
  ctx.textBaseline = 'alphabetic'
  ctx.lineJoin = 'round'
  const numero = (texto: string, x: number, y: number, tam: number, color: string, alineacion: CanvasTextAlign) => {
    ctx.textAlign = alineacion
    ctx.font = `${tam}px "Bebas Neue", sans-serif`
    ctx.lineWidth = 5
    ctx.strokeStyle = TINTA
    ctx.strokeText(texto, x, y)
    ctx.fillStyle = color
    ctx.fillText(texto, x, y)
  }
  const etiqueta = (texto: string, x: number, y: number, alineacion: CanvasTextAlign) => {
    ctx.textAlign = alineacion
    ctx.font = '700 9px Montserrat, sans-serif'
    ctx.fillStyle = 'rgba(239,227,198,0.8)'
    ctx.fillText(texto, x, y)
  }
  numero(String(metros(j)), v.cssAncho / 2, arriba + 52, 50, CREMA, 'center')
  etiqueta(`DE ${META_METROS} METROS`, v.cssAncho / 2, arriba + 67, 'center')
  const derecha = v.cssAncho - 18
  numero(String(j.caños), derecha, arriba + 44, 30, ORO, 'right')
  etiqueta('CAÑOS', derecha, arriba + 57, 'right')
  numero(String(j.gambetas), derecha - 50, arriba + 44, 30, CREMA, 'right')
  etiqueta('GAMBETAS', derecha - 50, arriba + 57, 'right')
}

// El arco del final del recorrido, de perfil: la boca mira a Don Fulbio y la red va hacia atrás
function arcoFinal(ctx: CanvasRenderingContext2D, v: Vista, j: Juego) {
  if (j.estado === 'listo') return
  const x = META + DISTANCIA_ARCO - j.distancia + v.xJugador
  if (x > v.ancho + 20 || x < -100) return
  const piso = v.piso + 1
  const alto = 80
  const [lx, ly] = [9, -20]   // el palo de atrás está más lejos: se ve más arriba
  const fondo = 58
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x, piso)
  ctx.lineTo(x, piso - alto)
  ctx.lineTo(x + lx, piso - alto + ly)
  ctx.lineTo(x + fondo, piso - alto * 0.55 + ly / 2)
  ctx.lineTo(x + fondo + 6, piso + ly / 2)
  ctx.closePath()
  ctx.fillStyle = 'rgba(10,16,28,0.25)'
  ctx.fill()
  ctx.clip()
  ctx.strokeStyle = 'rgba(239,227,198,0.28)'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  for (let i = -alto; i < fondo + 10; i += 8) {
    ctx.moveTo(x + i, piso)
    ctx.lineTo(x + i + alto, piso - alto)
    ctx.moveTo(x + i, piso - alto)
    ctx.lineTo(x + i + alto, piso)
  }
  ctx.stroke()
  ctx.restore()
  // Primero el palo de atrás, después el travesaño y el palo de adelante
  ctx.lineCap = 'round'
  const palo = (x1: number, y1: number, x2: number, y2: number, ancho: number) => {
    for (const [color, grosor] of [[TINTA, ancho + 2.6], [CREMA, ancho]] as const) {
      ctx.strokeStyle = color
      ctx.lineWidth = grosor
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }
  palo(x + lx, piso + ly, x + lx, piso - alto + ly, 2.6)
  palo(x, piso - alto, x + lx, piso - alto + ly, 3.4)
  palo(x, piso, x, piso - alto, 3.4)
}

// Un velo oscuro para pasar de la carrera al mano a mano (en píxeles CSS)
function velo(ctx: CanvasRenderingContext2D, v: Vista, alfa: number) {
  if (alfa <= 0) return
  ctx.fillStyle = `rgba(6,10,20,${Math.min(1, alfa)})`
  ctx.fillRect(0, 0, v.cssAncho, v.cssAlto)
}

// ---- Mano a mano ----
// La cámara mira el arco de frente, desde atrás de la pelota, con el fondo de la carrera quieto. Mientras no
// esté la hoja del arquero, el arquero es el rival de las piernas abiertas (y el que salta, girado, para la
// estirada).

// k: cuánto más grande que en la compu se ve el arco (la pelota, la mira y los carteles crecen con él)
interface Arco { cx: number; base: number; ancho: number; alto: number; pelotaY: number; radio: number; k: number }

function medidasArco(v: Vista): Arco {
  // Con el celular parado el arco ocupa casi todo el ancho; si no, quedaba chiquito
  const ancho = v.alto > v.ancho ? v.ancho * 0.86 : Math.min(v.ancho * 0.55, 400)
  const k = ancho / 400
  const base = v.piso + 6
  return {
    cx: v.ancho / 2, base, ancho, alto: ancho * 0.36,
    pelotaY: base + Math.max(34, Math.min(120 * k, (v.alto - base) * 0.6)),
    radio: 15 * k, k,
  }
}

// Un punto del arco en la pantalla: u de -1 a 1 entre los palos, w de 0 a 1 del piso al travesaño
const enArco = (a: Arco, u: number, w: number): [number, number] => [a.cx + (u * a.ancho) / 2, a.base - w * a.alto]

const PATADA = 0.06       // la pelota sale un instante después del toque
const REACCION = 0.07     // lo que tarda el arquero en tirarse
const ESTIRADA = 0.3

function pastoRemate(ctx: CanvasRenderingContext2D, v: Vista, a: Arco) {
  const tope = v.piso - 24
  const g = ctx.createLinearGradient(0, tope, 0, v.alto)
  g.addColorStop(0, '#46522c')
  g.addColorStop(0.3, '#36421f')
  g.addColorStop(1, '#1b2412')
  ctx.fillStyle = g
  ctx.fillRect(0, tope, v.ancho, v.alto - tope)
  // Franjas del corte, paralelas al arco y más anchas cuanto más cerca
  ctx.fillStyle = 'rgba(239,227,198,0.03)'
  for (let i = 0, y = a.base; y < v.alto; i++) {
    const alto = 10 + i * 9
    if (i % 2 === 0) ctx.fillRect(0, y, v.ancho, alto)
    y += alto
  }
  // Línea de fondo, área chica y los costados del área grande, que se abren hacia adelante
  const hasta = a.pelotaY - a.base
  const abre = (y: number) => 1 + ((y - a.base) / hasta) * 0.45
  const yChica = a.base + hasta * 0.42
  const chica = a.ancho * 0.39
  const grande = a.ancho * 0.75
  ctx.strokeStyle = 'rgba(239,227,198,0.4)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, a.base)
  ctx.lineTo(v.ancho, a.base)
  ctx.moveTo(a.cx - chica, a.base)
  ctx.lineTo(a.cx - chica * abre(yChica), yChica)
  ctx.lineTo(a.cx + chica * abre(yChica), yChica)
  ctx.lineTo(a.cx + chica, a.base)
  for (const lado of [-1, 1]) {
    ctx.moveTo(a.cx + lado * grande, a.base)
    ctx.lineTo(a.cx + lado * grande * abre(v.alto), v.alto)
  }
  ctx.stroke()
  // El punto del penal
  ctx.fillStyle = 'rgba(239,227,198,0.55)'
  ctx.beginPath()
  ctx.ellipse(a.cx, a.pelotaY + a.radio * 0.85, 9 * a.k, 3 * a.k, 0, 0, Math.PI * 2)
  ctx.fill()
}

// La red: el fondo un poco más chico (está más lejos) unido al marco por los costados y el techo. Si entró
// la pelota, se infla: ondas que se abren desde donde pegó
function redRemate(ctx: CanvasRenderingContext2D, a: Arco, golEn: [number, number] | null, t: number) {
  const [x0, y0] = enArco(a, -1, 1)
  const [x1, y1] = enArco(a, 1, 0)
  const fx0 = x0 + a.ancho * 0.07
  const fx1 = x1 - a.ancho * 0.07
  const fy0 = y0 + a.alto * 0.14
  const fy1 = y1 - a.alto * 0.04
  ctx.fillStyle = 'rgba(8,14,26,0.3)'
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x0, y0, x1 - x0, y1 - y0)
  ctx.clip()
  const alto = y1 - y0
  ctx.strokeStyle = 'rgba(239,227,198,0.2)'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  for (let x = x0 - alto; x < x1 + alto; x += 10) {
    ctx.moveTo(x, y1)
    ctx.lineTo(x + alto, y0)
    ctx.moveTo(x, y0)
    ctx.lineTo(x + alto, y1)
  }
  ctx.stroke()
  if (golEn && t < 0.9) {
    ctx.strokeStyle = `rgba(239,227,198,${0.55 * (1 - t / 0.9)})`
    ctx.lineWidth = 1.6
    for (let i = 0; i < 3; i++) {
      const r = 6 + t * 80 + i * 10
      ctx.beginPath()
      ctx.ellipse(golEn[0], golEn[1], r, r * 0.8, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(239,227,198,0.32)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(fx0, fy0)
  ctx.lineTo(fx1, fy0)
  ctx.lineTo(x1, y0)
  ctx.moveTo(x0, y1)
  ctx.lineTo(fx0, fy1)
  ctx.lineTo(fx0, fy0)
  ctx.moveTo(x1, y1)
  ctx.lineTo(fx1, fy1)
  ctx.lineTo(fx1, fy0)
  ctx.moveTo(fx0, fy1)
  ctx.lineTo(fx1, fy1)
  ctx.stroke()
}

function palosRemate(ctx: CanvasRenderingContext2D, a: Arco) {
  const [x0, y0] = enArco(a, -1, 1)
  const [x1, y1] = enArco(a, 1, 0)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y1 + 2)
  ctx.lineTo(x0, y0)
  ctx.lineTo(x1, y0)
  ctx.lineTo(x1, y1 + 2)
  ctx.strokeStyle = TINTA
  ctx.lineWidth = 8
  ctx.stroke()
  ctx.strokeStyle = CREMA
  ctx.lineWidth = 5
  ctx.stroke()
}

// ---- El arquero y Don Fulbio ----
// Parado, el arquero va de un palo al otro. Cuando patean, si la pelota le viene cerca la agarra sin tirarse;
// si no, vuela (bajo o alto, según la altura) con los guantes hacia donde llega, cae, y al rato se lamenta, se
// levanta con la pelota o queda aliviado. Las imágenes vuelan hacia la derecha: para el otro lado se espejan
// (el caído tiene la cabeza a la izquierda, así que con él es al revés).

const ALTO_ARQUERO = 0.92        // derecho, en altos del arco: es alto
const ALTO_FULBIO = 0.98         // está más cerca que el arquero
const ALTO_HOJA_ARQUERO = 560    // píxeles del arquero derecho en su hoja (atajando o aliviado)
const ALTO_HOJA_FULBIO = 514
// Puntos de las imágenes, en píxeles de su archivo
const VUELOS = {
  arqueroBajo: { pies: [25, 215], abajo: [30, 248] },   // abajo: lo más bajo, que no se meta en el pasto
  arqueroAlto: { pies: [30, 420], abajo: [20, 461] },
} as const
const CAIDO_GUANTES: [number, number] = [100, 208]      // donde queda la pelota si la atajó tirándose
const ATAJANDO_PELOTA: [number, number] = [130, 172]
const PATEA_BOTIN: [number, number] = [486, 292]        // la punta del botín, que le pega a la pelota
const CAE = 0.62          // desde el tiro: empieza a caer
const EN_EL_PISO = 0.84
const SE_LEVANTA = 1.5

type ImagenArquero =
  'arqueroParado' | 'arqueroBajo' | 'arqueroAlto' | 'arqueroCaido' | 'arqueroAtajando' | 'arqueroLamento' | 'arqueroAlivio'

interface PoseArquero {
  imagen: ImagenArquero
  x: number                // dónde va el punto p de la imagen
  y: number
  angulo: number
  espejo: boolean
  aumento: number
  suelo: number            // la x del cuerpo, para la sombra (y para el muñeco mientras cargan las imágenes)
  alto: number             // cuánto está en el aire
  manos: [number, number]  // donde queda la pelota si la ataja
  conPelota: boolean       // la imagen ya trae la pelota
}

const aumentoRemate = (a: Arco, alto: number, altoHoja: number) =>
  Math.round(((alto * a.alto) / (altoHoja * ESCALA_REMATE)) * 20) / 20

// Dónde queda un punto de la imagen respecto de su p, con la imagen espejada y girada como en pieza()
function girado(dx: number, dy: number, angulo: number, espejo: boolean, e: number): [number, number] {
  const x = (espejo ? -dx : dx) * e
  const y = dy * e
  return [x * Math.cos(angulo) - y * Math.sin(angulo), x * Math.sin(angulo) + y * Math.cos(angulo)]
}

function poseArquero(r: Remate, a: Arco): PoseArquero {
  const aumento = aumentoRemate(a, ALTO_ARQUERO, ALTO_HOJA_ARQUERO)
  const e = ESCALA_REMATE * aumento
  const quieto = (imagen: ImagenArquero, x: number, espejo = false): PoseArquero => {
    const caido = PIEZAS.arqueroCaido.p
    const manos: [number, number] = imagen === 'arqueroCaido'
      ? [x + (espejo ? -1 : 1) * (CAIDO_GUANTES[0] - caido[0]) * e, a.base + (CAIDO_GUANTES[1] - caido[1]) * e]
      : [x, a.base + (ATAJANDO_PELOTA[1] - PIEZAS.arqueroAtajando.p[1]) * e]
    return { imagen, x, y: a.base, angulo: 0, espejo, aumento, suelo: x, alto: 0, manos, conPelota: imagen === 'arqueroAtajando' }
  }
  const tiro = r.tiro
  const [px] = enArco(a, tiro ? tiro.desde : arqueroEn(r, r.t), 0)
  if (!tiro || tiro.t < REACCION) return quieto('arqueroParado', px)
  const t = tiro.t
  const final: ImagenArquero =
    tiro.definicion === 'gol' ? 'arqueroLamento' : tiro.definicion === 'atajada' ? 'arqueroAtajando' : 'arqueroAlivio'

  // Le viene cerca: se corre y la agarra sin tirarse
  if (tiro.definicion === 'atajada' && Math.abs(tiro.u - tiro.desde) < 0.25 && tiro.w < 0.8) {
    const [bx] = enArco(a, tiro.u, 0)
    const x = px + (bx - px) * suave(Math.min(1, (t - REACCION) / ESTIRADA))
    return quieto(t < DURACION_VUELO ? 'arqueroParado' : 'arqueroAtajando', x)
  }

  // Vuela: la imagen se gira un poco para que el cuerpo vaya de los pies hacia donde llegan los guantes
  const [hx, hy] = enArco(a, tiro.au, tiro.aw)
  const espejo = hx < px
  const imagen = tiro.aw < 0.45 ? 'arqueroBajo' : 'arqueroAlto'
  const p0 = PIEZAS[imagen].p
  const { pies, abajo } = VUELOS[imagen]
  const anguloHoja = Math.atan2(p0[1] - pies[1], p0[0] - pies[0])
  const giro = Math.max(-0.45, Math.min(0.35, Math.atan2(hy - a.base, Math.abs(hx - px)) - anguloHoja))
  const angulo = espejo ? -giro : giro
  // Arranca con el cuerpo donde estaba parado y termina con los guantes donde llega
  const [cx, cy] = girado((pies[0] - p0[0]) / 2, (pies[1] - p0[1]) / 2, angulo, espejo, e)
  const x0 = px - cx
  const y0 = a.base - (PIEZAS.arqueroParado.h / 2) * e - cy
  const p = suave(Math.min(1, (t - REACCION) / ESTIRADA))
  const x = x0 + (hx - x0) * p
  const [, ay] = girado(abajo[0] - p0[0], abajo[1] - p0[1], angulo, espejo, e)
  let y = Math.min(y0 + (hy - y0) * p, a.base - ay)
  // Después de la pelota cae al pasto; tirado, queda mirando para el lado en que voló
  if (t > CAE) y += suave(Math.min(1, (t - CAE) / (EN_EL_PISO - CAE))) * (a.base - (y + ay))
  if (t >= SE_LEVANTA) return quieto(final, x + cx)
  if (t >= EN_EL_PISO) return quieto('arqueroCaido', x + cx, !espejo)
  return { imagen, x, y, angulo, espejo, aumento, suelo: x + cx, alto: a.base - (y + cy), manos: [x, y], conPelota: false }
}

function arqueroRemate(ctx: CanvasRenderingContext2D, r: Remate, a: Arco, pose: PoseArquero) {
  if (!remateListo) {
    muñeco(ctx, RIVAL, pose.suelo, a.base, 1, abierto(r.t), { escala: (a.alto * 0.66) / 62 })
    return
  }
  const ancho = pose.imagen === 'arqueroCaido' ? 60 : pose.alto > 0 ? 40 : 28
  sombra(ctx, pose.suelo, a.base, ancho * a.k, pose.alto)
  const respira = pose.imagen === 'arqueroParado' && !r.tiro ? 1 - 0.012 * (1 + Math.sin(r.t * 8)) : 1
  pieza(ctx, pose.imagen, pose.x, pose.y, pose.angulo, false, respira, pose.aumento, pose.espejo)
}

// Don Fulbio, de espaldas, atrás y a la izquierda de la pelota: parado ahí, al patear el botín llega justo a
// ella. Después festeja a los saltitos o se agarra la cabeza
function fulbioRemate(ctx: CanvasRenderingContext2D, r: Remate, a: Arco) {
  if (!remateListo) return
  const aumento = aumentoRemate(a, ALTO_FULBIO, ALTO_HOJA_FULBIO)
  const e = ESCALA_REMATE * aumento
  const p = PIEZAS.espaldasPatea.p
  const x = a.cx - a.radio * 0.9 - (PATEA_BOTIN[0] - p[0]) * e
  const y = a.pelotaY - (PATEA_BOTIN[1] - p[1]) * e
  const tiro = r.tiro
  const imagen: NombrePieza = !tiro ? 'espaldasListo'
    : tiro.t < CAE ? 'espaldasPatea'
      : tiro.definicion === 'gol' ? 'espaldasFesteja' : 'espaldasLamenta'
  const salto = tiro && imagen === 'espaldasFesteja' ? Math.abs(Math.sin((tiro.t - CAE) * 6)) * 9 * a.k : 0
  const respira = tiro ? 1 : 1 - 0.01 * (1 + Math.sin(r.t * 5))
  sombra(ctx, x, y, 34 * a.k, salto)
  pieza(ctx, imagen, x, y - salto, 0, false, respira, aumento)
}

// La pelota del mano a mano: está más cerca, así que se ve más grande que en la carrera
function pelotaGrande(ctx: CanvasRenderingContext2D, x: number, y: number, radio: number, giro: number, alfa = 1) {
  ctx.save()
  ctx.globalAlpha = alfa
  ctx.translate(x, y)
  ctx.rotate(giro)
  const img = imagenes.get('pelota')
  if (personajesListos && img) {
    const d = PIEZAS.pelota
    const esc = (radio * 2) / d.w
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, -d.p[0] * esc, -d.p[1] * esc, d.w * esc, d.h * esc)
  } else {
    circulo(ctx, 0, 0, radio, '#8b6a45', 2)
  }
  ctx.restore()
}

function pelotaRemate(ctx: CanvasRenderingContext2D, r: Remate, a: Arco, pose: PoseArquero, v: Vista) {
  const tiro = r.tiro
  if (!tiro || tiro.t < PATADA) {
    pelotaGrande(ctx, a.cx, a.pelotaY, a.radio, 0)
    return
  }
  const [tx, ty] = enArco(a, tiro.u, tiro.w)
  const chico = a.radio * 0.55
  const giro = tiro.t * 22
  const p = Math.min(1, (tiro.t - PATADA) / (DURACION_VUELO - PATADA))
  if (p < 1) {
    // Vuela hacia el arco, con un poco de comba, y se achica porque se aleja
    const x = a.cx + (tx - a.cx) * p
    const y = a.pelotaY + (ty - a.pelotaY) * p - Math.sin(p * Math.PI) * a.alto * 0.18
    pelotaGrande(ctx, x, y, a.radio + (chico - a.radio) * p, giro)
    return
  }
  const t = tiro.t - DURACION_VUELO
  if (tiro.definicion === 'gol') {
    // Infla la red y cae al fondo del arco
    const c = suave(Math.min(1, t / 0.7))
    pelotaGrande(ctx, tx + (a.cx - tx) * 0.05 * c, ty + (a.base - chico * 0.9 - ty) * c, chico * 0.92, giro * 0.2)
  } else if (tiro.definicion === 'atajada') {
    if (!pose.conPelota) pelotaGrande(ctx, pose.manos[0], pose.manos[1], chico, 0.6)
  } else if (tiro.definicion === 'palo') {
    // Rebota para afuera y viene hacia adelante
    const y = ty - 90 * t + 620 * t * t
    if (y < v.alto + 40) pelotaGrande(ctx, tx + Math.sign(tiro.u) * 150 * t, y, chico * (1 + 1.4 * t), giro)
  } else if (t < 0.4) {
    // Afuera: sigue de largo y se pierde
    pelotaGrande(ctx, tx + (tx - a.cx) * 0.6 * t, ty - 40 * t, chico * (1 - 0.6 * t), giro, 1 - t / 0.4)
  }
}

function miraRemate(ctx: CanvasRenderingContext2D, r: Remate, a: Arco) {
  if (r.tiro) return
  const [x, y] = enArco(a, ...miraEn(r, r.t))
  const pulso = (1 + 0.08 * Math.sin(r.t * 12)) * a.k
  ctx.save()
  ctx.globalAlpha = r.t >= ESPERA_REMATE ? 1 : 0.4
  ctx.translate(x, y)
  ctx.scale(pulso, pulso)
  ctx.lineCap = 'round'
  for (const [color, grosor] of [[TINTA, 5], [ORO, 2.5]] as const) {
    ctx.strokeStyle = color
    ctx.lineWidth = grosor
    ctx.beginPath()
    ctx.arc(0, 0, 11, 0, Math.PI * 2)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      ctx.moveTo(dx * 6, dy * 6)
      ctx.lineTo(dx * 17, dy * 17)
    }
    ctx.stroke()
  }
  ctx.restore()
}

// El golpe de la patada: rayitas que salen de la pelota
function impacto(ctx: CanvasRenderingContext2D, a: Arco, t: number) {
  const q = t / 0.16
  ctx.save()
  ctx.globalAlpha = 1 - q
  ctx.strokeStyle = CREMA
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + 0.3
    const r1 = a.radio + 4 + q * 10
    ctx.moveTo(a.cx + Math.cos(ang) * r1, a.pelotaY + Math.sin(ang) * r1)
    ctx.lineTo(a.cx + Math.cos(ang) * (r1 + 9), a.pelotaY + Math.sin(ang) * (r1 + 9))
  }
  ctx.stroke()
  ctx.restore()
}

// Papelitos para el gol (siempre los mismos)
const PAPELITOS = (() => {
  const azar = azarFijo(31)
  const colores = [ORO, CREMA, '#7fb1dd', AZUL]
  return Array.from({ length: 60 }, (_, i) => ({
    x: azar(), demora: azar() * 0.5, velocidad: 60 + azar() * 70, fase: azar() * 6, color: colores[i % 4],
  }))
})()

const TEXTO_DEFINICION: Record<Definicion, string> = {
  gol: '¡GOOOL!', atajada: '¡ATAJÓ!', palo: '¡PALO!', afuera: '¡AFUERA!',
}

function definicionRemate(ctx: CanvasRenderingContext2D, v: Vista, a: Arco, tiro: Tiro) {
  const t = tiro.t - DURACION_VUELO
  const gol = tiro.definicion === 'gol'
  if (gol) {
    for (const p of PAPELITOS) {
      const tp = t - p.demora
      if (tp <= 0) continue
      const y = -10 + tp * p.velocidad
      if (y > v.alto) continue
      ctx.save()
      ctx.translate(p.x * v.ancho + Math.sin(tp * 3 + p.fase) * 14, y)
      ctx.rotate(tp * 5 + p.fase)
      ctx.fillStyle = p.color
      ctx.fillRect(-2.5, -4, 5, 8)
      ctx.restore()
    }
  }
  // El cartel va arriba del travesaño, para no tapar al arquero ni la pelota
  const crece = suave(Math.min(1, t / 0.18))
  ctx.save()
  ctx.translate(a.cx, a.base - a.alto - 14 * a.k)
  ctx.scale((0.6 + 0.4 * crece) * a.k, (0.6 + 0.4 * crece) * a.k)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.lineJoin = 'round'
  ctx.font = `${gol ? 64 : 52}px "Bebas Neue", sans-serif`
  ctx.lineWidth = 7
  ctx.strokeStyle = TINTA
  ctx.strokeText(TEXTO_DEFINICION[tiro.definicion], 0, 0)
  ctx.fillStyle = gol ? ORO : CREMA
  ctx.fillText(TEXTO_DEFINICION[tiro.definicion], 0, 0)
  ctx.restore()
  // Los puntos del gol suben desde donde entró la pelota, como los de las gambetas (sin pasar el travesaño,
  // que arriba está el cartel)
  if (gol) {
    const [x, y] = enArco(a, tiro.u, tiro.w)
    ctx.save()
    ctx.translate(x, Math.max(a.base - a.alto + 30 * a.k, y - 14 * a.k - 26 * a.k * suave(Math.min(1, t / 0.6))))
    ctx.scale(a.k, a.k)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.font = '30px "Bebas Neue", sans-serif'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 5
    ctx.strokeStyle = TINTA
    ctx.strokeText(`+${PUNTOS_POR_GOL}`, 0, 0)
    ctx.fillStyle = CREMA
    ctx.fillText(`+${PUNTOS_POR_GOL}`, 0, 0)
    ctx.restore()
  }
}

// Arriba, en lugar del marcador: el título y cómo se patea (en píxeles CSS)
function cartelRemate(ctx: CanvasRenderingContext2D, r: Remate, v: Vista, tactil: boolean, arriba: number) {
  const x = v.cssAncho / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.lineJoin = 'round'
  ctx.font = '44px "Bebas Neue", sans-serif'
  ctx.lineWidth = 5
  ctx.strokeStyle = TINTA
  ctx.strokeText('¡MANO A MANO!', x, arriba + 52)
  ctx.fillStyle = ORO
  ctx.fillText('¡MANO A MANO!', x, arriba + 52)
  const lista = r.t >= ESPERA_REMATE
  ctx.globalAlpha = lista ? 0.75 + 0.25 * Math.sin(r.t * 7) : 0.8
  ctx.font = '700 11px Montserrat, sans-serif'
  ctx.lineWidth = 3
  const ayuda = !lista ? 'UN SOLO TIRO' : tactil ? 'TOCÁ PARA PATEAR' : 'ESPACIO PARA PATEAR'
  ctx.strokeText(ayuda, x, arriba + 70)
  ctx.fillStyle = CREMA
  ctx.fillText(ayuda, x, arriba + 70)
  ctx.globalAlpha = 1
}

function dibujarRemate(
  ctx: CanvasRenderingContext2D, j: Juego, r: Remate, v: Vista,
  opciones: { tactil: boolean; arriba: number },
) {
  // La cámara del mano a mano mira un poco más arriba que la de la carrera: el arco sube y abajo queda lugar
  // para la pelota y Don Fulbio (con el celular parado, el piso ya estaba a esa altura)
  const vr: Vista = { ...v, piso: v.alto * 0.6 }
  const fijas = obtenerCapas(ctx, vr)
  const a = medidasArco(vr)
  const tiro = r.tiro
  // Sacudón en la patada y en el palo
  const golpe = !tiro ? 0
    : tiro.t < 0.12 ? 3
      : tiro.definicion === 'palo' && tiro.t > DURACION_VUELO && tiro.t < DURACION_VUELO + 0.25 ? 7 : 0
  if (golpe) ctx.translate((Math.random() - 0.5) * golpe, (Math.random() - 0.5) * golpe)
  ctx.drawImage(fijas.cielo, 0, 0, vr.ancho, vr.piso)
  // Con el piso más arriba, los edificios taparían el escudo: bajan lo que haga falta (los más altos miden
  // 160) y lo que baja queda detrás del pasto
  const sello = escudo(vr)
  const bajada = Math.max(0, sello.y + sello.radio * 0.4 - (vr.piso - 26 - 160))
  ciudad(ctx, bajada ? { ...vr, piso: vr.piso + bajada } : vr, j.distancia, fijas)
  torres(ctx, vr, j.distancia, fijas.torre)
  alambrado(ctx, vr, j.distancia, fijas.tejido)
  pastoRemate(ctx, vr, a)
  const definido = tiro !== null && tiro.t >= DURACION_VUELO
  redRemate(ctx, a, definido && tiro.definicion === 'gol' ? enArco(a, tiro.u, tiro.w) : null, definido ? tiro.t - DURACION_VUELO : 0)
  // Si entró o se fue afuera, la pelota queda detrás de los palos. Don Fulbio, que está más cerca, va
  // delante de todo
  const pose = poseArquero(r, a)
  const detras = definido && (tiro.definicion === 'gol' || tiro.definicion === 'afuera')
  if (detras) pelotaRemate(ctx, r, a, pose, vr)
  palosRemate(ctx, a)
  arqueroRemate(ctx, r, a, pose)
  if (!detras) pelotaRemate(ctx, r, a, pose, vr)
  fulbioRemate(ctx, r, a)
  miraRemate(ctx, r, a)
  if (tiro && tiro.t < 0.16) impacto(ctx, a, tiro.t)
  if (definido) definicionRemate(ctx, v, a, tiro)

  ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0)
  if (!tiro) cartelRemate(ctx, r, v, opciones.tactil, opciones.arriba)
  velo(ctx, v, 1 - r.t / 0.35)
}

export function dibujar(
  ctx: CanvasRenderingContext2D, j: Juego, v: Vista,
  opciones: { tactil: boolean; arriba: number },
) {
  kActual = v.escala * v.dpr
  ctx.setTransform(v.dpr * v.escala, 0, 0, v.dpr * v.escala, 0, 0)
  if (j.remate) {
    dibujarRemate(ctx, j, j.remate, v, opciones)
    return
  }
  if (j.temblor > 0) {
    const a = j.temblor * 16
    ctx.translate((Math.random() - 0.5) * a, (Math.random() - 0.5) * a)
  }
  const fijas = obtenerCapas(ctx, v)
  ctx.drawImage(fijas.cielo, 0, 0, v.ancho, v.piso)
  ciudad(ctx, v, j.distancia, fijas)
  torres(ctx, v, j.distancia, fijas.torre)
  alambrado(ctx, v, j.distancia, fijas.tejido)
  cancha(ctx, v, j.distancia)
  arcos(ctx, v, j.distancia)
  arcoFinal(ctx, v, j)

  // En la gambeta y el caño, Don Fulbio pasa por detrás del rival
  const detras = progresoJugada(j) > 0
  if (detras) dibujarJugador(ctx, j, v)
  for (const r of j.rivales) dibujarRival(ctx, r, j, v)
  if (!detras) dibujarJugador(ctx, j, v)
  dibujarPelota(ctx, j, v)

  pistas(ctx, j, v, opciones.tactil)
  efectos(ctx, j, v)

  // El tono crema, la viñeta y el grano van en una capa fija encima del canvas (Juego.tsx)
  ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0)
  marcador(ctx, j, v, opciones.arriba)
  // Al llegar al arco se oscurece, para pasar al mano a mano
  if (j.estado === 'llegada') velo(ctx, v, (j.tiempoLlegada - (DURACION_LLEGADA - 0.35)) / 0.35)
}
