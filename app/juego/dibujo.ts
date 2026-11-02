// Dibujo de Gambeta en un canvas 2D. Los muñecos se arman con poses (ángulos de cada articulación) y la
// cancha es de noche, con torres de luz, alambrado y carteles, en los colores de la app.
import {
  type Juego, type Rival, progresoGambeta, metros,
} from './motor'

export interface Vista {
  ancho: number        // lo que se ve del mundo, en unidades
  alto: number
  escala: number       // píxeles CSS por unidad
  piso: number         // altura de la línea por la que corre (en unidades, desde arriba)
  xJugador: number     // a cuánto del borde izquierdo corre el jugador
  cssAncho: number
  cssAlto: number
  dpr: number
}

export interface Ropa {
  camiseta: string
  detalle: string
  short: string
  medias: string
  piel: string
  pelo: string
}

// Lo mínimo que se ve de ancho: con el celular parado se acerca un poco más para que los jugadores no
// queden chiquitos, y el jugador corre más a la izquierda para no perder distancia hacia adelante
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
  // Celular parado: la cancha baja hasta los botones y arriba queda el cielo con el marcador
  const piso = parado
    ? alto * 0.6
    : alto - Math.max(72, alto * 0.17, reservaAbajo ? reservaAbajo / escala + 14 : 0)
  return { ancho, alto, escala, piso, xJugador: parado ? 85 : 110, cssAncho, cssAlto, dpr }
}

// ---- Colores ----

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const aHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')

const cacheOscuro = new Map<string, string>()
function oscuro(hex: string, f = 0.7) {
  const clave = hex + f
  let c = cacheOscuro.get(clave)
  if (!c) {
    const [r, g, b] = rgb(hex)
    c = aHex(r * f, g * f, b * f)
    cacheOscuro.set(clave, c)
  }
  return c
}

const luminancia = (hex: string) => {
  const [r, g, b] = rgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function esRojizo(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => c / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min < 0.25 || max < 0.3) return false
  let tono = 0
  if (max === r) tono = ((g - b) / (max - min)) * 60
  else if (max === g) tono = (2 + (b - r) / (max - min)) * 60
  else tono = (4 + (r - g) / (max - min)) * 60
  if (tono < 0) tono += 360
  return tono < 30 || tono > 330
}

// Sin club, la camiseta dorada de Futboleros
export function ropaJugador(colores: [string, string] | null): Ropa {
  if (!colores) {
    return { camiseta: '#c9a84c', detalle: '#1a0f03', short: '#1a0f03', medias: '#c9a84c', piel: '#d29b6c', pelo: '#2a1a0e' }
  }
  const [a, b] = colores
  return {
    camiseta: a,
    detalle: b,
    short: luminancia(b) < 0.5 ? b : oscuro(a, 0.45),
    medias: a,
    piel: '#d29b6c',
    pelo: '#2a1a0e',
  }
}

// Los rivales van de rojo, o de azul si el jugador ya es de rojo
export function ropaRival(jugador: Ropa): Ropa {
  const color = esRojizo(jugador.camiseta) ? '#1d4fb8' : '#d0121b'
  return { camiseta: color, detalle: '#ffffff', short: '#f2f2f2', medias: color, piel: '#b07a50', pelo: '#1a120a' }
}

// ---- Decorado fijo (siempre el mismo, no depende del día) ----

function azarFijo(semilla: number) {
  let s = semilla
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const PERIODO_CIUDAD = 1400
const EDIFICIOS = (() => {
  const azar = azarFijo(7)
  const lista: { x: number; ancho: number; alto: number; ventanas: [number, number, number][] }[] = []
  let x = 0
  while (x < PERIODO_CIUDAD) {
    const ancho = 40 + azar() * 80
    const alto = 40 + azar() * 110
    const ventanas: [number, number, number][] = []
    for (let vy = 10; vy < alto - 8; vy += 12) {
      for (let vx = 7; vx < ancho - 7; vx += 11) {
        if (azar() < 0.22) ventanas.push([vx, vy, 0.2 + azar() * 0.35])
      }
    }
    lista.push({ x, ancho, alto, ventanas })
    x += ancho + azar() * 18
  }
  return lista
})()

const ESTRELLAS = (() => {
  const azar = azarFijo(11)
  return Array.from({ length: 70 }, () => ({ x: azar(), y: azar(), brillo: 0.25 + azar() * 0.6, fase: azar() * 6 }))
})()

const CARTELES = ['FUTBOLEROS', 'PLAN 10', 'EL FÚTBOL AMATEUR, ORGANIZADO', 'FUTBOLEROS', 'ARMÁ TU PARTIDO']

// ---- Escena ----

function cielo(ctx: CanvasRenderingContext2D, v: Vista, tiempo: number) {
  const g = ctx.createLinearGradient(0, 0, 0, v.piso)
  g.addColorStop(0, '#070504')
  g.addColorStop(0.55, '#140d06')
  g.addColorStop(1, '#3a2509')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, v.ancho, v.piso)
  // Estrellas, solo arriba de las torres
  const techo = Math.max(0, v.piso - 330)
  for (const e of ESTRELLAS) {
    const y = e.y * techo
    if (y > techo - 20) continue
    ctx.globalAlpha = e.brillo * (0.7 + 0.3 * Math.sin(tiempo * 1.5 + e.fase))
    ctx.fillStyle = '#e8d5a0'
    ctx.fillRect(e.x * v.ancho, y, 1.6, 1.6)
  }
  ctx.globalAlpha = 1
}

function ciudad(ctx: CanvasRenderingContext2D, v: Vista, distancia: number) {
  const base = v.piso - 26
  const corrimiento = -((distancia * 0.08) % PERIODO_CIUDAD)
  for (let k = 0; corrimiento + k * PERIODO_CIUDAD < v.ancho; k++) {
    const x0 = corrimiento + k * PERIODO_CIUDAD
    for (const e of EDIFICIOS) {
      const x = x0 + e.x
      if (x > v.ancho || x + e.ancho < 0) continue
      ctx.fillStyle = '#120c06'
      ctx.fillRect(x, base - e.alto, e.ancho, e.alto)
      for (const [vx, vy, a] of e.ventanas) {
        ctx.fillStyle = `rgba(201,168,76,${a})`
        ctx.fillRect(x + vx, base - e.alto + vy, 4, 5)
      }
    }
  }
}

function torres(ctx: CanvasRenderingContext2D, v: Vista, distancia: number) {
  const periodo = 560
  const base = v.piso - 24
  const alto = Math.max(200, Math.min(460, v.piso - 120))   // más altas si hay más cielo (celular parado)
  const corrimiento = -((distancia * 0.25) % periodo)
  for (let x = corrimiento + 180; x < v.ancho + 200; x += periodo) {
    const tope = base - alto
    // Haz de luz hacia la cancha y resplandor
    ctx.globalCompositeOperation = 'lighter'
    const haz = ctx.createLinearGradient(0, tope, 0, base + 60)
    haz.addColorStop(0, 'rgba(255,226,150,0.10)')
    haz.addColorStop(1, 'rgba(255,226,150,0)')
    ctx.fillStyle = haz
    ctx.beginPath()
    ctx.moveTo(x - 16, tope + 10)
    ctx.lineTo(x + 16, tope + 10)
    ctx.lineTo(x + 170, base + 60)
    ctx.lineTo(x - 170, base + 60)
    ctx.closePath()
    ctx.fill()
    const brillo = ctx.createRadialGradient(x, tope, 0, x, tope, 120)
    brillo.addColorStop(0, 'rgba(255,231,168,0.42)')
    brillo.addColorStop(1, 'rgba(255,231,168,0)')
    ctx.fillStyle = brillo
    ctx.fillRect(x - 120, tope - 120, 240, 240)
    ctx.globalCompositeOperation = 'source-over'
    // Poste y reflector
    ctx.fillStyle = '#1c1409'
    ctx.fillRect(x - 3, tope, 6, alto)
    for (let y = tope + 40; y < base; y += 34) ctx.fillRect(x - 6, y, 12, 2)
    ctx.fillStyle = '#2a1e0e'
    ctx.fillRect(x - 24, tope - 12, 48, 22)
    ctx.fillStyle = '#fff6d8'
    for (let fila = 0; fila < 2; fila++) {
      for (let col = 0; col < 4; col++) {
        ctx.beginPath()
        ctx.arc(x - 16 + col * 10.5, tope - 5 + fila * 9, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

function alambrado(ctx: CanvasRenderingContext2D, v: Vista, distancia: number) {
  const base = v.piso - 24
  const tope = v.piso - 112
  const alto = base - tope
  const corrimiento = (distancia * 0.55) % 12
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, tope, v.ancho, alto)
  ctx.clip()
  ctx.strokeStyle = 'rgba(201,168,76,0.14)'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  for (let x = -alto - corrimiento; x < v.ancho + alto; x += 12) {
    ctx.moveTo(x, tope)
    ctx.lineTo(x + alto, base)
    ctx.moveTo(x + alto, tope)
    ctx.lineTo(x, base)
  }
  ctx.stroke()
  ctx.restore()
  // Caño de arriba y postes
  ctx.fillStyle = '#3a2a12'
  ctx.fillRect(0, tope - 2, v.ancho, 3)
  const postes = (distancia * 0.55) % 150
  for (let x = -postes; x < v.ancho; x += 150) ctx.fillRect(x, tope - 2, 4, alto + 2)
  // Carteles al pie del alambrado
  const periodo = 430
  const corrimientoCarteles = (distancia * 0.55) % (periodo * CARTELES.length)
  ctx.font = '15px "Bebas Neue", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < CARTELES.length * 2; i++) {
    const x = i * periodo - corrimientoCarteles + 40
    if (x > v.ancho || x + 210 < 0) continue
    const texto = CARTELES[i % CARTELES.length]
    const ancho = Math.max(120, ctx.measureText(texto).width + 36)
    ctx.fillStyle = '#1e1a0e'
    ctx.fillRect(x, base - 24, ancho, 24)
    ctx.strokeStyle = 'rgba(201,168,76,0.45)'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, base - 23.5, ancho - 1, 23)
    ctx.fillStyle = '#c9a84c'
    ctx.fillText(texto, x + ancho / 2, base - 11)
  }
}

function cancha(ctx: CanvasRenderingContext2D, v: Vista, distancia: number) {
  const tope = v.piso - 24
  const fondo = v.alto
  const g = ctx.createLinearGradient(0, tope, 0, fondo)
  g.addColorStop(0, '#24442a')
  g.addColorStop(0.35, '#1c3820')
  g.addColorStop(1, '#0c1a0d')
  ctx.fillStyle = g
  ctx.fillRect(0, tope, v.ancho, fondo - tope)
  // Franjas del corte del pasto, inclinadas para dar profundidad
  const inclinacion = (fondo - tope) * 0.35
  const corrimiento = distancia % 200
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  ctx.beginPath()
  for (let x = -corrimiento - inclinacion; x < v.ancho + 200; x += 200) {
    ctx.moveTo(x, tope)
    ctx.lineTo(x + 100, tope)
    ctx.lineTo(x + 100 - inclinacion, fondo)
    ctx.lineTo(x - inclinacion, fondo)
    ctx.closePath()
  }
  ctx.fill()
  // Cada tanto, la mitad de cancha: la línea cruzada (inclinada como las franjas) y el círculo central
  const periodo = 2600
  const pendiente = 0.35
  ctx.strokeStyle = 'rgba(232,226,200,0.28)'
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
  // Línea de cal lejana y la de abajo de los pies
  ctx.fillStyle = 'rgba(232,226,200,0.25)'
  ctx.fillRect(0, tope + 3, v.ancho, 1.5)
  ctx.fillStyle = 'rgba(232,226,200,0.55)'
  ctx.fillRect(0, v.piso + 9, v.ancho, 2.5)
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

const TORSO = 24
const MUSLO = 17
const PIERNA = 17
const BRAZO = 12
const ANTEBRAZO = 11

function trazo(ctx: CanvasRenderingContext2D, color: string, ancho: number, x1: number, y1: number, x2: number, y2: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = ancho
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function pierna(ctx: CanvasRenderingContext2D, hx: number, hy: number, [a, k]: [number, number], ropa: Ropa, lejos: boolean) {
  const f = lejos ? 0.68 : 1
  const kx = hx + Math.sin(a) * MUSLO
  const ky = hy + Math.cos(a) * MUSLO
  const b = a - k
  const ax = kx + Math.sin(b) * PIERNA
  const ay = ky + Math.cos(b) * PIERNA
  trazo(ctx, oscuro(ropa.piel, f), 7, hx, hy, kx, ky)
  trazo(ctx, oscuro(ropa.short, f), 9, hx, hy, hx + (kx - hx) * 0.5, hy + (ky - hy) * 0.5)
  trazo(ctx, oscuro(ropa.piel, f), 6, kx, ky, ax, ay)
  trazo(ctx, oscuro(ropa.medias, f), 6.4, kx + (ax - kx) * 0.3, ky + (ay - ky) * 0.3, ax, ay)
  trazo(ctx, oscuro(ropa.detalle, f), 6.6, kx + (ax - kx) * 0.3, ky + (ay - ky) * 0.3, kx + (ax - kx) * 0.38, ky + (ay - ky) * 0.38)
  // Botín: perpendicular a la pierna, para adelante
  trazo(ctx, lejos ? '#0a0a0a' : '#151515', 5.5, ax, ay, ax + Math.cos(b) * 8, ay - Math.sin(b) * 8)
}

function brazo(ctx: CanvasRenderingContext2D, sx: number, sy: number, [a, e]: [number, number], ropa: Ropa, lejos: boolean) {
  const f = lejos ? 0.68 : 1
  const ex = sx + Math.sin(a) * BRAZO
  const ey = sy + Math.cos(a) * BRAZO
  const b = a + e
  const mx = ex + Math.sin(b) * ANTEBRAZO
  const my = ey + Math.cos(b) * ANTEBRAZO
  trazo(ctx, oscuro(ropa.piel, f), 5, sx, sy, ex, ey)
  trazo(ctx, oscuro(ropa.camiseta, f), 6.5, sx, sy, sx + (ex - sx) * 0.55, sy + (ey - sy) * 0.55)
  trazo(ctx, oscuro(ropa.piel, f), 4.6, ex, ey, mx, my)
}

function muñeco(
  ctx: CanvasRenderingContext2D, x: number, y: number, mirando: 1 | -1, pose: Pose, ropa: Ropa,
  escala = 1, rotacion = 0,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(mirando * escala, escala)
  if (rotacion) ctx.rotate(rotacion)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const [hx, hy] = pose.cadera
  const sx = hx + Math.sin(pose.torso) * TORSO
  const sy = hy - Math.cos(pose.torso) * TORSO
  const cx = hx + Math.sin(pose.torso) * (TORSO + 10)
  const cy = hy - Math.cos(pose.torso) * (TORSO + 10)

  // Lo de atrás primero
  brazo(ctx, sx, sy, pose.brazoB, ropa, true)
  pierna(ctx, hx, hy, pose.piernaB, ropa, true)
  // Torso y short
  trazo(ctx, ropa.camiseta, 15, hx, hy - 2, sx, sy + 2)
  trazo(ctx, ropa.detalle, 2.6, hx - Math.cos(pose.torso) * 5, hy - 3 - Math.sin(pose.torso) * 5,
    sx - Math.cos(pose.torso) * 5, sy + 3 - Math.sin(pose.torso) * 5)
  trazo(ctx, ropa.short, 14, hx - 1, hy - 2, hx + 1, hy + 3)
  // Lo de adelante
  pierna(ctx, hx, hy, pose.piernaA, ropa, false)
  brazo(ctx, sx, sy, pose.brazoA, ropa, false)
  // Cabeza: cuello del color del detalle, pelo atrás y arriba
  trazo(ctx, ropa.detalle, 4, sx - 3, sy + 1, sx + 3, sy - 1)
  ctx.fillStyle = ropa.piel
  ctx.beginPath()
  ctx.arc(cx, cy, 8.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = ropa.pelo
  ctx.beginPath()
  ctx.arc(cx, cy, 9, (150 * Math.PI) / 180, (335 * Math.PI) / 180)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = oscuro(ropa.piel, 0.8)
  ctx.beginPath()
  ctx.arc(cx - 1, cy + 1, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a120a'
  ctx.fillRect(cx + 4.5, cy - 1.5, 1.6, 1.8)
  ctx.restore()
}

const correr = (p: number): Pose => {
  const rebote = Math.abs(Math.cos(p)) * 2.5
  return {
    cadera: [0, -35 - rebote],
    torso: 0.22,
    piernaA: [0.8 * Math.sin(p), 0.35 + 1.1 * Math.max(0, Math.cos(p))],
    piernaB: [0.8 * Math.sin(p + Math.PI), 0.35 + 1.1 * Math.max(0, Math.cos(p + Math.PI))],
    brazoA: [-0.75 * Math.sin(p), 1.4],
    brazoB: [0.75 * Math.sin(p), 1.4],
  }
}

const enElAire = (vy: number): Pose => vy > 0
  ? { cadera: [0, -38], torso: 0.1, piernaA: [0.95, 1.6], piernaB: [-0.35, 1.3], brazoA: [1.9, 0.6], brazoB: [-1.0, 0.9] }
  : { cadera: [0, -37], torso: 0.12, piernaA: [0.5, 0.6], piernaB: [-0.15, 0.5], brazoA: [1.5, 0.5], brazoB: [-0.7, 0.8] }

const gambeteando = (q: number): Pose => {
  const s = Math.sin(q * Math.PI)
  return {
    cadera: [0, -35],
    torso: 0.08 - 0.18 * s,
    piernaA: [0.3 + 0.75 * Math.sin(q * Math.PI * 2), 0.5 + 0.5 * s],
    piernaB: [-0.25, 0.4],
    brazoA: [0.2 + 1.3 * s, 0.3],
    brazoB: [-0.2 - 1.2 * s, 0.3],
  }
}

const POSE_CAIDO: Pose = { cadera: [0, -35], torso: 0.2, piernaA: [0.6, 0.9], piernaB: [-0.4, 0.8], brazoA: [2.2, 0.4], brazoB: [1.6, 0.5] }

const parado = (fase: number): Pose => {
  const rebote = Math.sin(fase * 9) * 1.2
  return { cadera: [0, -33 + rebote], torso: 0.28, piernaA: [0.38, 0.55], piernaB: [-0.3, 0.55], brazoA: [0.75, 0.5], brazoB: [-0.45, 0.6] }
}

const POSE_SALTO_RIVAL: Pose = { cadera: [0, -36], torso: 0.05, piernaA: [0.25, 0.9], piernaB: [-0.15, 1.1], brazoA: [2.9, 0.15], brazoB: [2.7, 0.2] }
const POSE_DESPARRAMADO: Pose = { cadera: [0, -34], torso: 0.1, piernaA: [0.7, 0.3], piernaB: [0.95, 0.5], brazoA: [2.4, 0.3], brazoB: [2.0, 0.3] }
// Tirado hacia atrás con una pierna estirada al ras del pasto, la otra doblada abajo y un brazo apoyado
const POSE_BARRIDA: Pose = { cadera: [0, -14], torso: -1.15, piernaA: [1.5, 0.05], piernaB: [1.3, 2.5], brazoA: [-0.6, -0.4], brazoB: [2.6, 0.3] }

const suave = (t: number) => 1 - (1 - t) * (1 - t)

function sombra(ctx: CanvasRenderingContext2D, x: number, y: number, ancho: number, altura: number) {
  const f = Math.max(0.35, 1 - altura / 200)
  ctx.fillStyle = `rgba(0,0,0,${0.35 * f})`
  ctx.beginPath()
  ctx.ellipse(x, y + 3, ancho * f, 4 * f, 0, 0, Math.PI * 2)
  ctx.fill()
}

function pelota(ctx: CanvasRenderingContext2D, x: number, y: number, giro: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(giro)
  ctx.fillStyle = '#f4f1e8'
  ctx.beginPath()
  ctx.arc(0, 0, 6.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath()
  ctx.arc(0, 0, 2.4, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5
    ctx.beginPath()
    ctx.arc(Math.cos(a) * 5.6, Math.sin(a) * 5.6, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function dibujarRival(ctx: CanvasRenderingContext2D, r: Rival, j: Juego, v: Vista, ropa: Ropa) {
  const x = r.x - j.distancia + v.xJugador
  if (x > v.ancho + 80 || x + r.ancho < -80) return
  const conPiel = { ...ropa, piel: r.piel }
  if (r.tipo === 'barrida') {
    sombra(ctx, x + 36, v.piso, 38, 0)
    muñeco(ctx, x + 40, v.piso, -1, POSE_BARRIDA, conPiel)
    return
  }
  const centro = x + r.ancho / 2
  sombra(ctx, centro, v.piso, 13, r.salto)
  if (r.gambeteado) {
    muñeco(ctx, centro, v.piso, -1, POSE_DESPARRAMADO, conPiel, 1, -1.35 * suave(r.caida))
  } else if (r.saltó && r.salto > 0) {
    muñeco(ctx, centro, v.piso - r.salto, -1, POSE_SALTO_RIVAL, conPiel)
  } else {
    muñeco(ctx, centro, v.piso, -1, parado(j.tiempo + r.x * 0.01), conPiel)
  }
}

function dibujarJugador(ctx: CanvasRenderingContext2D, j: Juego, v: Vista, ropa: Ropa) {
  const x = v.xJugador
  const pies = v.piso - j.y
  const giro = j.distancia / 6.5
  sombra(ctx, x + 4, v.piso, 15, j.y)

  if (j.estado === 'cayendo' || j.estado === 'fin') {
    const t = Math.min(1, j.tiempoCaida / 0.45)
    const haciaAdelante = j.motivo === 'barrida'
    muñeco(ctx, x, pies, 1, POSE_CAIDO, ropa, 1, (haciaAdelante ? 1.45 : -1.3) * suave(t))
    const tc = j.tiempoCaida
    const bx = x + 18 + tc * 260 * Math.max(0, 1 - tc * 0.4)
    const by = v.piso - 6 - Math.abs(Math.sin(tc * 12)) * 22 * Math.exp(-3 * tc)
    pelota(ctx, bx, by, giro + tc * 10)
    return
  }

  const q = progresoGambeta(j)
  if (q > 0) {
    const s = Math.sin(q * Math.PI)
    // Estela dorada
    ctx.strokeStyle = 'rgba(201,168,76,0.5)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      const ly = pies - 18 - s * 18 - i * 14
      ctx.globalAlpha = 0.6 * s
      ctx.beginPath()
      ctx.moveTo(x - 18 - i * 6, ly)
      ctx.lineTo(x - 50 - i * 10, ly)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    muñeco(ctx, x, pies - s * 18, 1, gambeteando(q), ropa, 1 - 0.08 * s)
    pelota(ctx, x + 16 + 7 * Math.cos(q * Math.PI * 2), pies - 6 - s * 16, giro)
    return
  }

  if (j.enAire) {
    muñeco(ctx, x, pies, 1, enElAire(j.vy), ropa)
    pelota(ctx, x + 15, pies - 4, giro)
    return
  }

  muñeco(ctx, x, pies, 1, correr(j.fasePaso), ropa)
  pelota(ctx, x + 17 + Math.sin(j.fasePaso * 2) * 2, pies - 6.5 - Math.abs(Math.sin(j.fasePaso)) * 5, giro)
}

function pistas(ctx: CanvasRenderingContext2D, j: Juego, v: Vista, tactil: boolean) {
  if (j.estado !== 'jugando') return
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  for (const r of j.rivales) {
    if (!r.pista || r.gambeteado) continue
    const x = r.x - j.distancia + v.xJugador + r.ancho / 2
    if (x < v.xJugador + 30 || x > v.ancho - 20) continue
    const salto = r.tipo === 'barrida'
    const tecla = tactil ? (salto ? 'BOTÓN SALTAR' : 'BOTÓN GAMBETA') : (salto ? 'ESPACIO O ↑' : '→ O D')
    ctx.globalAlpha = 0.75 + 0.25 * Math.sin(j.tiempo * 8)
    ctx.fillStyle = '#c9a84c'
    ctx.font = '22px "Bebas Neue", sans-serif'
    ctx.fillText(salto ? '↑ ' + r.pista : r.pista + ' →', x, v.piso - 118)
    ctx.font = '600 9px Montserrat, sans-serif'
    ctx.fillStyle = '#e8d5a0'
    ctx.fillText(tecla, x, v.piso - 104)
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
  for (const t of j.textos) {
    ctx.globalAlpha = Math.min(1, t.vida / 0.4)
    ctx.font = `${t.grande ? 30 : 20}px "Bebas Neue", sans-serif`
    const x = t.x - j.distancia + v.xJugador
    const y = v.piso - t.y
    ctx.lineWidth = 3
    ctx.strokeStyle = '#100c06'
    ctx.strokeText(t.texto, x, y)
    ctx.fillStyle = t.texto.startsWith('+') ? '#e8d5a0' : '#c9a84c'
    ctx.fillText(t.texto, x, y)
  }
  ctx.globalAlpha = 1
}

function viñeta(ctx: CanvasRenderingContext2D, v: Vista) {
  const r = Math.max(v.ancho, v.alto)
  const g = ctx.createRadialGradient(v.ancho / 2, v.piso * 0.8, r * 0.25, v.ancho / 2, v.piso * 0.8, r * 0.8)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, v.ancho, v.alto)
}

function marcador(ctx: CanvasRenderingContext2D, j: Juego, v: Vista, arriba: number) {
  if (j.estado === 'listo') return
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 8
  ctx.fillStyle = '#c9a84c'
  ctx.font = '48px "Bebas Neue", sans-serif'
  ctx.fillText(String(metros(j)), v.cssAncho / 2, arriba + 50)
  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(232,213,160,0.75)'
  ctx.font = '700 10px Montserrat, sans-serif'
  ctx.fillText('M E T R O S', v.cssAncho / 2, arriba + 66)
  // Gambetas, a la derecha
  ctx.textAlign = 'right'
  ctx.fillStyle = '#e8d5a0'
  ctx.font = '30px "Bebas Neue", sans-serif'
  ctx.fillText(String(j.gambetas), v.cssAncho - 18, arriba + 42)
  ctx.fillStyle = 'rgba(232,213,160,0.75)'
  ctx.font = '700 9px Montserrat, sans-serif'
  ctx.fillText('GAMBETAS', v.cssAncho - 18, arriba + 56)
}

export function dibujar(
  ctx: CanvasRenderingContext2D, j: Juego, v: Vista,
  ropas: { jugador: Ropa; rival: Ropa }, opciones: { tactil: boolean; arriba: number },
) {
  ctx.setTransform(v.dpr * v.escala, 0, 0, v.dpr * v.escala, 0, 0)
  if (j.temblor > 0) {
    const a = j.temblor * 16
    ctx.translate((Math.random() - 0.5) * a, (Math.random() - 0.5) * a)
  }
  cielo(ctx, v, j.tiempo)
  ciudad(ctx, v, j.distancia)
  torres(ctx, v, j.distancia)
  alambrado(ctx, v, j.distancia)
  cancha(ctx, v, j.distancia)

  // En la gambeta el jugador pasa por detrás del rival
  const detras = progresoGambeta(j) > 0
  if (detras) dibujarJugador(ctx, j, v, ropas.jugador)
  for (const r of j.rivales) dibujarRival(ctx, r, j, v, ropas.rival)
  if (!detras) dibujarJugador(ctx, j, v, ropas.jugador)

  pistas(ctx, j, v, opciones.tactil)
  efectos(ctx, j, v)
  viñeta(ctx, v)

  ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0)
  marcador(ctx, j, v, opciones.arriba)
}
