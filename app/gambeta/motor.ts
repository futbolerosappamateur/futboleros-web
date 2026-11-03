// Gambeta (prototipo): Don Fulbio corre solo con la pelota; el que juega salta las barridas, gambetea a los
// rivales que lo esperan parados y, si el rival tiene las piernas abiertas, le puede tirar un caño (vale más).
// Al llegar a la meta queda mano a mano con el arquero y patea una sola vez. Todo va en unidades del mundo
// (Don Fulbio mide unas 74); dibujo.ts lo escala a la pantalla. El recorrido, el arquero y la mira salen de
// la fecha de Argentina, así que ese día son los mismos para todos.

export type TipoRival = 'barrida' | 'parado' | 'abierto'
export type Jugada = 'gambeta' | 'caño'
export type Motivo = 'barrida' | 'parado' | 'cerrado'
export type Estado = 'listo' | 'jugando' | 'pausa' | 'cayendo' | 'llegada' | 'remate' | 'fin'
export type Definicion = 'gol' | 'atajada' | 'palo' | 'afuera'

// En el arco, u va de -1 (palo izquierdo) a 1 (palo derecho) y w de 0 (el piso) a 1 (el travesaño)
export interface Tiro {
  t: number              // tiempo desde que pateó
  u: number              // a dónde va la pelota
  w: number
  desde: number          // dónde estaba parado el arquero
  au: number             // hasta dónde llegan sus manos
  aw: number
  definicion: Definicion
}

export interface Remate {
  t: number              // tiempo desde que empezó el mano a mano
  tiro: Tiro | null
  // El arquero y la mira del día
  arqueroBase: number
  arqueroAmplitud: number
  arqueroPeriodo: number
  alcance: number        // hasta dónde se estira a los costados
  miraPeriodoU: number
  miraPeriodoW: number
}

export interface Rival {
  tipo: TipoRival
  x: number             // borde izquierdo en el mundo
  ancho: number
  piel: string
  salto: number         // los que esperan parados saltan con vos si los querés saltar
  vSalto: number
  saltó: boolean
  pasado: Jugada | null // cómo lo pasaste
  caida: number         // 0 a 1: la animación después de pasarlo
  pista: string | null  // ayuda en los primeros rivales
}

interface Texto { texto: string; x: number; y: number; vida: number; grande: boolean }
interface Particula { x: number; y: number; vx: number; vy: number; vida: number; total: number; color: string; tam: number }

export interface Juego {
  estado: Estado
  fecha: string
  distancia: number     // posición del jugador en el mundo
  velocidad: number
  tiempo: number
  y: number             // altura de los pies sobre el piso
  vy: number
  enAire: boolean
  apretandoSalto: boolean
  jugada: Jugada | null // gambeta o caño en curso (nunca las dos)
  tiempoJugada: number  // lo que le queda
  esperaJugada: number
  pedidoSalto: number   // se acuerda de la tecla un ratito (si la apretás justo antes de caer)
  pedidoGambeta: number
  pedidoCaño: number
  fasePaso: number
  gambetas: number
  caños: number
  racha: number
  ultimaJugada: number
  rivales: Rival[]
  textos: Texto[]
  particulas: Particula[]
  motivo: Motivo | null
  tiempoCaida: number
  temblor: number
  azar: () => number
  proximoX: number      // dónde va el próximo rival
  colocados: number
  tiempoLlegada: number
  remate: Remate | null
}

export const X_JUGADOR = 110        // el mayor margen izquierdo de las pantallas (para limpiar rivales)
export const UNIDADES_POR_METRO = 40
export const PUNTOS_POR_GAMBETA = 10
export const PUNTOS_POR_CAÑO = 25
export const PUNTOS_POR_GOL = 100
export const META_METROS = 300      // para probar el remate; el tope del día va a ser 2500
export const META = META_METROS * UNIDADES_POR_METRO
export const DISTANCIA_ARCO = 7 * UNIDADES_POR_METRO   // de la meta al arco: Don Fulbio frena antes
const SIN_RIVALES = 25 * UNIDADES_POR_METRO             // el último tramo, libre, para ver venir el arco
export const DURACION_LLEGADA = 1.3
export const ESPERA_REMATE = 0.7    // al principio del mano a mano no patea (por si venías apretando)
export const DURACION_VUELO = 0.42  // lo que tarda la pelota en llegar al arco
const DURACION_DEFINICION = 2.8     // del tiro a la tarjeta del final

const V_INICIAL = 300
const V_MAXIMA = 660
const DISTANCIA_RAMPA = 30000      // a mayor número, más tarda en acelerar
const VELOCIDAD_LISTO = 140        // en la pantalla de inicio corre tranquilo, sin rivales
const G_SUBIDA = 2600
const G_BAJADA = 3300
const V_SALTO = 900
const V_CORTE = 600                // si soltás el botón enseguida, salta más bajo
export const DURACION_JUGADA = 0.38
const ESPERA_JUGADA = 0.2
const MEMORIA_TECLA = 0.13
const ANCHO = { barrida: 76, parado: 30, abierto: 56 } as const   // el de las piernas abiertas ocupa más
const PIELES = ['#c98a5e', '#e6b48c', '#9a6440', '#d9a072']

// Caja de Don Fulbio respecto de su posición (un poco más chica que el dibujo: perdona los roces)
const CAJA = { izq: -12, der: 14, alto: 60 }

// Generador con semilla (mulberry32) y hash FNV de la fecha
function generador(semilla: number) {
  let a = semilla
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(texto: string) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Fecha de hoy en Argentina (AAAA-MM-DD): el recorrido cambia a la medianoche de acá
export function fechaDeHoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
}

export const velocidadEn = (d: number) =>
  V_INICIAL + (V_MAXIMA - V_INICIAL) * (1 - Math.exp(-Math.max(0, d) / DISTANCIA_RAMPA))

// 0 al arrancar, 1 a la velocidad máxima
export const dificultad = (d: number) => (velocidadEn(d) - V_INICIAL) / (V_MAXIMA - V_INICIAL)

export const metros = (j: Juego) => Math.min(META_METROS, Math.floor(j.distancia / UNIDADES_POR_METRO))
export const hizoGol = (j: Juego) => j.remate?.tiro?.definicion === 'gol'
export const puntos = (j: Juego) =>
  metros(j) + j.gambetas * PUNTOS_POR_GAMBETA + j.caños * PUNTOS_POR_CAÑO + (hizoGol(j) ? PUNTOS_POR_GOL : 0)

export function nuevoJuego(fecha: string, estado: Estado = 'listo'): Juego {
  return {
    estado, fecha,
    distancia: 0, velocidad: estado === 'listo' ? VELOCIDAD_LISTO : V_INICIAL, tiempo: 0,
    y: 0, vy: 0, enAire: false, apretandoSalto: false,
    jugada: null, tiempoJugada: 0, esperaJugada: 0,
    pedidoSalto: 0, pedidoGambeta: 0, pedidoCaño: 0,
    fasePaso: 0, gambetas: 0, caños: 0, racha: 0, ultimaJugada: -10,
    rivales: [], textos: [], particulas: [],
    motivo: null, tiempoCaida: 0, temblor: 0,
    azar: generador(hash(`gambeta-${fecha}`)),
    proximoX: 900, colocados: 0,
    tiempoLlegada: 0, remate: null,
  }
}

// ---- Controles ----

export function apretarSalto(j: Juego) {
  j.apretandoSalto = true
  if (j.estado === 'jugando') j.pedidoSalto = MEMORIA_TECLA
}

export function soltarSalto(j: Juego) {
  j.apretandoSalto = false
}

// Gambeta y caño se excluyen: el último que apretaste es el que vale
export function apretarGambeta(j: Juego) {
  if (j.estado !== 'jugando') return
  j.pedidoGambeta = MEMORIA_TECLA
  j.pedidoCaño = 0
}

export function apretarCaño(j: Juego) {
  if (j.estado !== 'jugando') return
  j.pedidoCaño = MEMORIA_TECLA
  j.pedidoGambeta = 0
}

// Un solo tiro, a donde esté la mira en ese momento
export function patear(j: Juego) {
  const r = j.remate
  if (j.estado !== 'remate' || !r || r.tiro || r.t < ESPERA_REMATE) return
  const [u, w] = miraEn(r, r.t)
  r.tiro = { t: 0, u, w, ...definir(r, u, w, arqueroEn(r, r.t)) }
}

// ---- Mano a mano ----

// El arquero se mueve de un palo al otro; la mira recorre el arco a velocidad pareja, de lado a lado y de
// arriba abajo, y se pasa un poco de los palos y del travesaño (para poder errarle)
export const arqueroEn = (r: Remate, t: number) =>
  r.arqueroBase + r.arqueroAmplitud * Math.sin((t / r.arqueroPeriodo) * Math.PI * 2)

const vaivén = (t: number, periodo: number) => 1 - 4 * Math.abs(((t / periodo + 0.25) % 1) - 0.5)   // -1 a 1, en línea recta

export const miraEn = (r: Remate, t: number): [number, number] => [
  1.12 * vaivén(t, r.miraPeriodoU),
  0.07 + 1.01 * (1 - vaivén(t, r.miraPeriodoW)) / 2,
]

// Alcance del arquero: una elipse alrededor de su cuerpo, más alta que ancha, así que los ángulos son gol
const ALTURA_ARQUERO = 0.42
const ALCANCE_ALTO = 0.72
const PALO_U = 0.04     // medio palo más el radio de la pelota, en medios anchos del arco
const PALO_W = 0.05     // lo mismo para el travesaño, en altos del arco

function definir(r: Remate, u: number, w: number, desde: number): Omit<Tiro, 't' | 'u' | 'w'> {
  // El arquero se estira hacia la pelota: llega hasta ella o hasta el borde de su alcance
  const d = Math.hypot((u - desde) / r.alcance, (w - ALTURA_ARQUERO) / ALCANCE_ALTO)
  const llega = d > 1 ? 1 / d : 1
  const au = desde + (u - desde) * llega
  const aw = ALTURA_ARQUERO + (w - ALTURA_ARQUERO) * llega
  const ladoPalo = Math.abs(Math.abs(u) - 1) < PALO_U && w < 1 + PALO_W
  const travesaño = Math.abs(w - 1) < PALO_W && Math.abs(u) < 1 + PALO_U
  const definicion: Definicion =
    ladoPalo || travesaño ? 'palo'
      : Math.abs(u) > 1 || w > 1 ? 'afuera'
        : d <= 1 ? 'atajada'
          : 'gol'
  return { desde, au, aw, definicion }
}

function empezarRemate(j: Juego) {
  const azar = generador(hash(`arquero-${j.fecha}`))
  j.estado = 'remate'
  j.textos = []
  j.particulas = []
  j.remate = {
    t: 0, tiro: null,
    arqueroBase: (azar() - 0.5) * 0.3,
    arqueroAmplitud: 0.12 + azar() * 0.16,
    arqueroPeriodo: 1.8 + azar() * 0.8,
    alcance: 0.55 + azar() * 0.08,
    miraPeriodoU: 1.7 + azar() * 0.5,
    miraPeriodoW: 2.3 + azar() * 0.6,
  }
}

// ---- Recorrido ----

// Pone los rivales hasta la x pedida. Las distancias se miden en segundos a la velocidad de ese tramo, y
// nunca bajan del mínimo que hace falta para resolver el rival anterior y reaccionar al siguiente.
// Siempre se sacan cuatro números por rival, así el recorrido del día no cambia por nada.
function colocarHasta(j: Juego, hasta: number) {
  while (j.proximoX < hasta && j.proximoX < META - SIN_RIVALES) {
    const i = j.colocados
    const dif = dificultad(j.proximoX)
    const sorteo = j.azar()
    // Los primeros enseñan: dos barridas, uno parado, otra barrida y uno con las piernas abiertas
    const tipo: TipoRival =
      i < 2 || i === 3 ? 'barrida'
        : i === 2 ? 'parado'
          : i === 4 ? 'abierto'
            : sorteo < 0.42 ? 'barrida' : sorteo < 0.76 ? 'parado' : 'abierto'
    const ancho = ANCHO[tipo]
    j.rivales.push({
      tipo, x: j.proximoX, ancho,
      piel: PIELES[Math.floor(j.azar() * PIELES.length)],
      salto: 0, vSalto: 0, saltó: false, pasado: null, caida: 0,
      pista: i === 0 ? 'SALTÁ' : i === 2 ? 'GAMBETEALO' : i === 4 ? '¡CAÑO!' : null,
    })
    j.colocados++

    const v = velocidadEn(j.proximoX)
    const minimo = tipo === 'barrida' ? 0.85 : 0.62
    const corto = j.azar() < 0.12 + 0.33 * dif
    const variacion = j.azar()
    const segundos = corto ? minimo + variacion * 0.25 : (1.75 - 0.8 * dif) * (0.85 + variacion * 0.5)
    const extra = i < 5 ? 0.9 : 0   // los primeros, más separados: es la parte en que se aprende
    j.proximoX += ancho + (Math.max(minimo, segundos) + extra) * v
  }
}

// ---- Paso de la simulación ----

function polvo(j: Juego, x: number, y: number, cantidad: number, color: string, fuerza = 1) {
  for (let i = 0; i < cantidad; i++) {
    const total = 0.35 + Math.random() * 0.35
    j.particulas.push({
      x, y,
      vx: (-60 - Math.random() * 140) * fuerza,
      vy: (40 + Math.random() * 120) * fuerza,
      vida: total, total,
      color, tam: 1.5 + Math.random() * 2.5,
    })
  }
}

function texto(j: Juego, contenido: string, x: number, y: number, grande = false) {
  j.textos.push({ texto: contenido, x, y, vida: 0.9, grande })
}

function cajasSeTocan(j: Juego, r: Rival) {
  const izq = j.distancia + CAJA.izq
  const der = j.distancia + CAJA.der
  if (r.tipo === 'barrida') {
    // Solo la pierna y el cuerpo contra el pasto: 22 de alto
    return der > r.x + 6 && izq < r.x + r.ancho - 4 && j.y < 22
  }
  const alto = r.saltó && r.salto > 0 ? 92 : 68   // saltando levanta los brazos
  return der > r.x + 4 && izq < r.x + r.ancho - 4 && j.y < r.salto + alto && j.y + CAJA.alto > r.salto
}

function chocar(j: Juego, motivo: Motivo) {
  j.estado = 'cayendo'
  j.motivo = motivo
  j.tiempoCaida = 0
  j.temblor = 0.35
  j.jugada = null
  j.tiempoJugada = 0
  polvo(j, j.distancia + 10, 4, 18, '#d4a54a', 1.4)
}

function pasar(j: Juego, r: Rival, jugada: Jugada) {
  r.pasado = jugada
  j.racha = j.tiempo - j.ultimaJugada < 2.5 ? j.racha + 1 : 1
  j.ultimaJugada = j.tiempo
  const valor = jugada === 'caño' ? PUNTOS_POR_CAÑO : PUNTOS_POR_GAMBETA
  if (jugada === 'caño') j.caños++
  else j.gambetas++
  const nombre = jugada === 'caño' ? '¡CAÑO!' : '¡GAMBETA!'
  texto(j, j.racha > 1 ? `${nombre} ¡OLÉ! ×${j.racha}` : nombre, r.x + 10, 122, jugada === 'caño' || j.racha > 1)
  texto(j, `+${valor}`, r.x + 14, 98)
}

export function avanzar(j: Juego, dt: number) {
  if (j.estado === 'pausa') return
  if (j.estado === 'fin') {
    if (j.remate?.tiro) j.remate.tiro.t += dt   // detrás de la tarjeta, la red y los papelitos siguen
    return
  }
  j.tiempo += dt

  if (j.estado === 'remate') {
    const r = j.remate as Remate
    r.t += dt
    if (r.tiro) {
      r.tiro.t += dt
      if (r.tiro.t > DURACION_DEFINICION) j.estado = 'fin'
    }
    return
  }

  if (j.estado === 'llegada') {
    // Frena frente al arco (si venía saltando, primero cae)
    j.tiempoLlegada += dt
    j.velocidad *= Math.exp(-4 * dt)
    j.distancia += j.velocidad * dt
    j.fasePaso += (j.velocidad * dt * Math.PI * 2) / 105
    if (j.enAire) {
      j.vy -= (j.vy > 0 ? G_SUBIDA : G_BAJADA) * dt
      j.y = Math.max(0, j.y + j.vy * dt)
      if (j.y === 0) { j.enAire = false; j.vy = 0 }
    }
    actualizarRivales(j, dt)
    actualizarEfectos(j, dt)
    if (j.tiempoLlegada > DURACION_LLEGADA) empezarRemate(j)
    return
  }

  if (j.estado === 'listo') {
    j.distancia += j.velocidad * dt
    j.fasePaso += (j.velocidad * dt * Math.PI * 2) / 100
    actualizarEfectos(j, dt)
    return
  }

  if (j.estado === 'cayendo') {
    j.tiempoCaida += dt
    j.velocidad *= Math.exp(-4.5 * dt)
    j.distancia += j.velocidad * dt
    if (j.enAire || j.y > 0) {
      j.vy -= G_BAJADA * dt
      j.y = Math.max(0, j.y + j.vy * dt)
      if (j.y === 0) j.enAire = false
    }
    actualizarRivales(j, dt)
    actualizarEfectos(j, dt)
    if (j.tiempoCaida > 1.2) j.estado = 'fin'
    return
  }

  // jugando
  j.velocidad = velocidadEn(j.distancia)
  j.distancia += j.velocidad * dt
  const zancada = 105 + (j.velocidad - V_INICIAL) * 0.22   // pasitos cortos: Don Fulbio no es un velocista
  j.fasePaso += (j.velocidad * dt * Math.PI * 2) / zancada

  j.pedidoSalto = Math.max(0, j.pedidoSalto - dt)
  j.pedidoGambeta = Math.max(0, j.pedidoGambeta - dt)
  j.pedidoCaño = Math.max(0, j.pedidoCaño - dt)
  if (j.jugada) {
    j.tiempoJugada -= dt
    if (j.tiempoJugada <= 0) { j.jugada = null; j.tiempoJugada = 0; j.esperaJugada = ESPERA_JUGADA }
  } else if (j.esperaJugada > 0) {
    j.esperaJugada = Math.max(0, j.esperaJugada - dt)
  }

  // Salto: no se puede saltar en medio de una gambeta o un caño (se guarda el pedido por si termina justo)
  if (!j.enAire && j.pedidoSalto > 0 && !j.jugada) {
    j.vy = V_SALTO
    j.enAire = true
    j.pedidoSalto = 0
  }
  if (j.enAire) {
    if (!j.apretandoSalto && j.vy > V_CORTE) j.vy = V_CORTE
    j.vy -= (j.vy > 0 ? G_SUBIDA : G_BAJADA) * dt
    j.y += j.vy * dt
    if (j.y <= 0) {
      j.y = 0
      j.vy = 0
      j.enAire = false
      polvo(j, j.distancia, 0, 6, '#8a7344', 0.7)
    }
  }

  // Gambeta o caño: solo con los pies en el piso
  if (!j.enAire && !j.jugada && j.esperaJugada === 0 && (j.pedidoGambeta > 0 || j.pedidoCaño > 0)) {
    j.jugada = j.pedidoCaño > 0 ? 'caño' : 'gambeta'
    j.tiempoJugada = DURACION_JUGADA
    j.pedidoGambeta = 0
    j.pedidoCaño = 0
  }

  colocarHasta(j, j.distancia + 1600)
  actualizarRivales(j, dt)

  for (const r of j.rivales) {
    if (r.pasado || !cajasSeTocan(j, r)) continue
    if (r.tipo !== 'barrida' && j.jugada === 'gambeta') { pasar(j, r, 'gambeta'); continue }
    if (r.tipo === 'abierto' && j.jugada === 'caño') { pasar(j, r, 'caño'); continue }
    // El caño a uno con las piernas cerradas pega en las canillas
    chocar(j, r.tipo === 'barrida' ? 'barrida' : j.jugada === 'caño' ? 'cerrado' : 'parado')
    break
  }

  // Llegó: queda mano a mano con el arquero
  if (j.estado === 'jugando' && j.distancia >= META) {
    j.estado = 'llegada'
    j.tiempoLlegada = 0
    j.jugada = null
    j.tiempoJugada = 0
    texto(j, '¡MANO A MANO!', j.distancia + 200, 150, true)   // todavía avanza un poco al frenar
  }

  actualizarEfectos(j, dt)
}

function actualizarRivales(j: Juego, dt: number) {
  for (const r of j.rivales) {
    const dx = r.x - j.distancia
    if (r.tipo !== 'barrida' && !r.pasado) {
      // Si lo querés saltar, salta con vos y te la saca de cabeza: se calcula para que esté arriba
      // justo cuando llegás
      if (!r.saltó && j.enAire && j.estado === 'jugando' && dx > -10 && dx < j.velocidad * 0.3) {
        r.saltó = true
        r.vSalto = 700
      }
      if (r.saltó && (r.salto > 0 || r.vSalto > 0)) {
        r.vSalto -= G_SUBIDA * dt
        r.salto = Math.max(0, r.salto + r.vSalto * dt)
        if (r.salto === 0) r.vSalto = 0
      }
    }
    if (r.pasado) r.caida = Math.min(1, r.caida + dt * 2.8)
    // La barrida levanta pasto mientras se ve
    if (r.tipo === 'barrida' && dx < 700 && dx > -100 && Math.random() < dt * 30) {
      polvo(j, r.x + 4, 2, 1, Math.random() < 0.5 ? '#5d6b3a' : '#8a7344', 0.6)
    }
  }
  // Los que ya quedaron atrás
  j.rivales = j.rivales.filter((r) => r.x + r.ancho > j.distancia - X_JUGADOR - 200)
}

function actualizarEfectos(j: Juego, dt: number) {
  j.temblor = Math.max(0, j.temblor - dt)
  for (const p of j.particulas) {
    p.vida -= dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy -= 600 * dt
    if (p.y < 0) { p.y = 0; p.vy *= -0.3; p.vx *= 0.6 }
  }
  j.particulas = j.particulas.filter((p) => p.vida > 0)
  for (const t of j.textos) {
    t.vida -= dt
    t.y += 40 * dt
  }
  j.textos = j.textos.filter((t) => t.vida > 0)
}

// Para dibujar la gambeta o el caño: 0 a 1 mientras dura
export const progresoJugada = (j: Juego) => (j.jugada ? 1 - j.tiempoJugada / DURACION_JUGADA : 0)
