// Sonidos de Gambeta. No hay archivos de sonido: todo se arma en el momento con Web Audio (el silbato, la
// pelota, la hinchada, el bombo, el palo). El motor anota en j.sonidos lo que pasa y Juego.tsx se lo pasa a
// tocar() en cada cuadro. Los navegadores no dejan sonar nada hasta que se toca la pantalla o una tecla, así
// que activarSonido() se llama desde esos eventos (Jugar, Seguir, el parlante).

import type { Definicion, Sonido } from './motor'

type Vocal = 'a' | 'e' | 'o' | 'u'

// Las tres resonancias principales de cada vocal (Hz): muchas voces pasadas por ahí suenan a "gooool" o a "uhhh"
const FORMANTES: Record<Vocal, [number, number, number]> = {
  a: [730, 1150, 2500],
  e: [450, 1850, 2550],
  o: [480, 850, 2450],
  u: [340, 760, 2300],
}

interface Grito {
  vocal: Vocal
  duracion: number
  volumen: number
  ataque?: number      // lo que tarda en llegar al máximo
  sostiene?: number    // la parte de la duración que se queda arriba antes de apagarse
  subida?: number      // cuánto sube la voz de punta a punta (menos de 1: baja, como en el "uhhh")
  voces?: number
  luego?: { vocal: Vocal; en: number; salto: number }   // el "o-lé": cambia de vocal y la voz sube
}

// Los golpes del bombo después del gol: pum, pum, pum-pum-pum (dos veces)
const RITMO = [0, 0.32, 0.64, 0.8, 0.96, 1.28, 1.6, 1.92, 2.08, 2.24]

// Niveles de lo que suena siempre (se multiplican por el nivel de cada momento)
const MURMULLO = 0.22
const LATIDO = 0.6

function ruidoBlanco(c: BaseAudioContext, segundos: number) {
  const buffer = c.createBuffer(1, Math.round(c.sampleRate * segundos), c.sampleRate)
  const d = buffer.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buffer
}

// Ruido rosa (más grave que el blanco, como el de mucha gente junta), con el filtro de Paul Kellet
function ruidoRosa(c: BaseAudioContext, segundos: number) {
  const buffer = c.createBuffer(1, Math.round(c.sampleRate * segundos), c.sampleRate)
  const d = buffer.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < d.length; i++) {
    const blanco = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + blanco * 0.0555179
    b1 = 0.99332 * b1 + blanco * 0.0750759
    b2 = 0.969 * b2 + blanco * 0.153852
    b3 = 0.8665 * b3 + blanco * 0.3104856
    b4 = 0.55 * b4 + blanco * 0.5329522
    b5 = -0.7616 * b5 - blanco * 0.016898
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + blanco * 0.5362) * 0.11
    b6 = blanco * 0.115926
  }
  return buffer
}

// Pum-pum: el corazón del mano a mano, que se repite hasta que patea. Cada latido es un golpe grave (para
// los auriculares) y uno seco y más agudo, que es lo que se oye en el parlante del celular
function latidos(c: BaseAudioContext) {
  const sr = c.sampleRate
  const buffer = c.createBuffer(1, Math.round(sr * 0.82), sr)
  const d = buffer.getChannelData(0)
  for (const [inicio, vol] of [[0.02, 1], [0.27, 0.65]]) {
    const desde = Math.round(inicio * sr)
    let fase = 0
    for (let i = 0; i < sr * 0.3 && desde + i < d.length; i++) {
      const s = i / sr
      fase += (2 * Math.PI * (55 + 35 * Math.exp(-s / 0.03))) / sr
      const grave = Math.sin(fase) * Math.exp(-s / 0.07)
      const seco = (0.8 * Math.sin(2 * Math.PI * 380 * s) + 0.3 * Math.sin(2 * Math.PI * 610 * s)) * Math.exp(-s / 0.016)
      d[desde + i] += vol * (1 - Math.exp(-s / 0.003)) * (0.25 * grave + 0.6 * seco)
    }
  }
  return buffer
}

// Todo lo que suena, armado sobre un contexto de audio (el de la página, o uno sin parlante para probar).
// Cada función recibe el momento t (en el reloj del contexto) en que tiene que sonar
export function crearSonidos(c: BaseAudioContext, destino: AudioNode) {
  const blanco = ruidoBlanco(c, 2)
  const rosa = ruidoRosa(c, 4)

  const filtro = (tipo: BiquadFilterType, frecuencia: number, q = 0.7) => {
    const f = c.createBiquadFilter()
    f.type = tipo
    f.frequency.value = frecuencia
    f.Q.value = q
    return f
  }

  const ganancia = (valor: number) => {
    const g = c.createGain()
    g.gain.value = valor
    return g
  }

  // Sube en 'ataque' hasta 'pico' y se apaga solo en 'caida' (en segundos); ya va a la salida
  const golpeDe = (t: number, pico: number, ataque: number, caida: number) => {
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(pico, t + ataque)
    g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + caida)
    g.connect(destino)
    return g
  }

  const tono = (tipo: OscillatorType, t: number, desde: number, hasta: number, glisando: number, fin: number) => {
    const o = c.createOscillator()
    o.type = tipo
    o.frequency.setValueAtTime(desde, t)
    if (hasta !== desde) o.frequency.exponentialRampToValueAtTime(hasta, t + glisando)
    o.start(t)
    o.stop(fin)
    return o
  }

  // Un pedazo de ruido, desde un lugar al azar del buffer (así no suena siempre igual)
  const ruido = (buffer: AudioBuffer, t: number, duracion: number) => {
    const f = c.createBufferSource()
    f.buffer = buffer
    f.start(t, Math.random() * Math.max(0, buffer.duration - duracion - 0.01), duracion + 0.01)
    return f
  }

  // Lleva un volumen de fondo a otro valor, sin saltos
  const llevar = (param: AudioParam, valor: number, t: number, tiempo: number) => {
    param.cancelScheduledValues(t)
    param.setTargetAtTime(valor, t, tiempo / 3)
  }

  // ---- Lo que suena siempre: la hinchada de fondo y el latido del mano a mano ----

  // Ruido rosa por dos filtros, con tres vaivenes lentos que nunca coinciden: sube y baja como una tribuna
  const fondo = ganancia(0)
  fondo.connect(destino)
  const murmullo = ganancia(0.7)
  murmullo.connect(fondo)
  for (const [frecuencia, profundidad] of [[0.11, 0.12], [0.17, 0.1], [0.29, 0.08]]) {
    const o = c.createOscillator()
    o.frequency.value = frecuencia
    o.connect(ganancia(profundidad)).connect(murmullo.gain)
    o.start()
  }
  for (const [frecuencia, q, volumen, desde] of [[500, 0.9, 1, 0], [1300, 1.6, 0.5, 1.7]]) {
    const s = c.createBufferSource()
    s.buffer = rosa
    s.loop = true
    s.connect(filtro('bandpass', frecuencia, q)).connect(ganancia(volumen)).connect(murmullo)
    s.start(0, desde)
  }
  const nivel = (valor: number, t: number, tiempo: number) => llevar(fondo.gain, valor * MURMULLO, t, tiempo)

  const corazon = ganancia(0)
  corazon.connect(destino)
  {
    const s = c.createBufferSource()
    s.buffer = latidos(c)
    s.loop = true
    s.connect(filtro('lowpass', 1000)).connect(corazon)
    s.start(0)
  }

  // ---- Los sonidos sueltos ----

  // Un toque o una patada: el golpe sordo, el "poc" del cuero y el chasquido
  function pelota(t: number, fuerza: number) {
    tono('sine', t, 170, 55, 0.1, t + 0.3).connect(golpeDe(t, 0.6 * fuerza, 0.003, 0.25))
    tono('triangle', t, 440, 280, 0.06, t + 0.15).connect(golpeDe(t, 0.4 * fuerza, 0.002, 0.1))
    ruido(blanco, t, 0.05).connect(filtro('bandpass', 1800, 0.9)).connect(golpeDe(t, 0.5 * fuerza, 0.001, 0.04))
  }

  // Aire que pasa (el salto, la gambeta, la pelota que sale): ruido por un filtro que se corre
  function aire(t: number, duracion: number, desde: number, hasta: number, volumen: number) {
    const f = filtro('bandpass', desde, 1.4)
    f.frequency.setValueAtTime(desde, t)
    f.frequency.exponentialRampToValueAtTime(hasta, t + duracion)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(volumen, t + duracion * 0.4)
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion)
    ruido(blanco, t, duracion).connect(f).connect(g).connect(destino)
  }

  // El silbato del árbitro: un tono agudo que la bolita de adentro hace temblar, más el soplido
  function silbato(t: number, duracion: number, volumen = 0.15) {
    const f0 = 2950 + Math.random() * 100
    const fin = t + duracion
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(volumen, t + 0.025)
    g.gain.setValueAtTime(volumen, fin - 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, fin)
    g.connect(destino)
    const trino = ganancia(0.6)
    trino.connect(g)
    const temblor = 33 + Math.random() * 6
    const bolita = tono('sine', t, temblor, temblor, 0, fin)
    bolita.connect(ganancia(0.4)).connect(trino.gain)
    for (const [armonico, vol] of [[1, 1], [2, 0.12]]) {
      const o = tono('sine', t, f0 * armonico * 0.93, f0 * armonico, 0.05, fin)
      bolita.connect(ganancia(80 * armonico)).connect(o.frequency)
      o.connect(ganancia(vol)).connect(trino)
    }
    ruido(blanco, t, duracion).connect(filtro('bandpass', f0, 2.5)).connect(ganancia(0.35)).connect(g)
  }

  // Notas cortitas de premio (la gambeta, el caño)
  function campanita(t: number, notas: number[], separacion: number, volumen: number) {
    notas.forEach((f, i) => {
      const ti = t + i * separacion
      tono('sine', ti, f, f, 0, ti + 0.4).connect(golpeDe(ti, volumen, 0.004, 0.32))
      tono('sine', ti, f * 3, f * 3, 0, ti + 0.2).connect(golpeDe(ti, volumen * 0.15, 0.002, 0.1))
    })
  }

  // El choque: el cuerpo contra el rival y el pasto
  function golpe(t: number) {
    tono('sine', t, 120, 42, 0.22, t + 0.45).connect(golpeDe(t, 1, 0.003, 0.32))
    ruido(rosa, t, 0.3).connect(filtro('lowpass', 700)).connect(golpeDe(t, 0.9, 0.002, 0.22))
  }

  // La hinchada: muchas voces (más grandes que chicos), cada una con su altura y su vibrato, todas por las
  // resonancias de la misma vocal, más el soplido de tanta gente junta
  function grito(t: number, g: Grito) {
    const ataque = g.ataque ?? 0.15
    const subida = g.subida ?? 1
    const n = g.voces ?? 12
    const fin = t + g.duracion
    const mezcla = ganancia(4 / Math.sqrt(n))
    for (let i = 0; i < n; i++) {
      const base = Math.random() < 0.75 ? 105 + Math.random() * 95 : 190 + Math.random() * 130
      const demora = Math.random() * Math.min(0.2, ataque)
      const o = c.createOscillator()
      o.type = 'sawtooth'
      // La altura se calcula una vez cada 128 muestras y no en cada una: cuesta mucho menos y no se nota
      o.frequency.automationRate = 'k-rate'
      o.frequency.setValueAtTime(base, t)
      if (g.luego) {
        const cambio = t + g.luego.en
        o.frequency.exponentialRampToValueAtTime(base * Math.sqrt(subida), cambio)
        o.frequency.exponentialRampToValueAtTime(base * Math.sqrt(subida) * g.luego.salto, cambio + 0.06)
        o.frequency.exponentialRampToValueAtTime(base * subida * g.luego.salto, fin)
      } else {
        o.frequency.exponentialRampToValueAtTime(base * subida, fin)
      }
      const vibrato = c.createOscillator()
      vibrato.frequency.value = 4 + Math.random() * 3
      vibrato.connect(ganancia(base * (0.015 + Math.random() * 0.02))).connect(o.frequency)
      const v = ganancia(0)
      v.gain.setValueAtTime(0, t + demora)
      v.gain.linearRampToValueAtTime(0.4 + Math.random() * 0.6, t + demora + ataque * 0.6)
      o.connect(v).connect(mezcla)
      o.start(t)
      o.stop(fin + 0.05)
      vibrato.start(t)
      vibrato.stop(fin + 0.05)
    }
    ruido(rosa, t, g.duracion).connect(ganancia(2.5)).connect(mezcla)

    const salida = c.createGain()
    salida.gain.setValueAtTime(0.0001, t)
    salida.gain.exponentialRampToValueAtTime(g.volumen, t + ataque)
    salida.gain.setValueAtTime(g.volumen, Math.max(t + ataque, t + g.duracion * (g.sostiene ?? 0.4)))
    salida.gain.exponentialRampToValueAtTime(0.0001, fin)
    salida.connect(destino)
    FORMANTES[g.vocal].forEach((f, k) => {
      const bp = filtro('bandpass', f, [3, 4, 5][k])
      if (g.luego) {
        bp.frequency.setValueAtTime(f, t + g.luego.en)
        bp.frequency.linearRampToValueAtTime(FORMANTES[g.luego.vocal][k], t + g.luego.en + 0.08)
      }
      mezcla.connect(bp).connect(ganancia([1, 0.6, 0.2][k])).connect(salida)
    })
  }

  // ¡Olé! Más fuerte cuanto más larga la racha
  function ole(t: number, racha: number) {
    const volumen = Math.min(0.45, 0.15 + 0.05 * racha)
    grito(t, { vocal: 'o', duracion: 0.95, volumen, ataque: 0.08, sostiene: 0.5, subida: 1.03, voces: 12, luego: { vocal: 'e', en: 0.3, salto: 1.26 } })
  }

  // La pelota infla la red
  function red(t: number) {
    ruido(blanco, t, 0.5).connect(filtro('bandpass', 3800, 0.7)).connect(golpeDe(t, 0.3, 0.012, 0.4))
    ruido(rosa, t, 0.3).connect(filtro('lowpass', 900)).connect(golpeDe(t, 0.5, 0.005, 0.18))
  }

  function platillo(t: number, volumen = 0.2) {
    ruido(blanco, t, 1.6).connect(filtro('highpass', 5000, 0.5)).connect(golpeDe(t, volumen, 0.002, 1.4))
    ruido(blanco, t, 0.5).connect(filtro('bandpass', 3200, 1.2)).connect(golpeDe(t, volumen * 0.6, 0.002, 0.35))
  }

  // El bombo de la hinchada: el golpe grave, uno más alto para el parlante del celular y el parche
  function bombo(t: number, volumen: number) {
    tono('sine', t, 105, 52, 0.14, t + 0.6).connect(golpeDe(t, volumen, 0.004, 0.45))
    tono('triangle', t, 200, 110, 0.08, t + 0.3).connect(golpeDe(t, volumen * 0.35, 0.003, 0.18))
    ruido(rosa, t, 0.08).connect(filtro('bandpass', 700, 0.8)).connect(golpeDe(t, volumen * 0.5, 0.002, 0.05))
  }

  // La pelota contra el palo: un caño de metal, que suena con armónicos que no son los de una nota (cada uno
  // dos veces, apenas desafinado, para que vibre)
  function palo(t: number) {
    const f = 540
    for (const [relacion, volumen, caida] of [[1, 1, 1.1], [2.76, 0.55, 0.7], [5.4, 0.4, 0.45], [8.93, 0.25, 0.3], [13.34, 0.15, 0.18]]) {
      for (const desafino of [0.997, 1.004]) {
        const altura = f * relacion * desafino
        tono('sine', t, altura, altura, 0, t + caida + 0.05).connect(golpeDe(t, 0.11 * volumen, 0.001, caida))
      }
    }
    ruido(blanco, t, 0.03).connect(filtro('bandpass', 2600, 1)).connect(golpeDe(t, 0.5, 0.001, 0.02))
  }

  // La atajada: la pelota contra los guantes
  function guantes(t: number) {
    ruido(rosa, t, 0.12).connect(filtro('bandpass', 1100, 1.1)).connect(golpeDe(t, 0.9, 0.002, 0.07))
    tono('sine', t, 150, 70, 0.08, t + 0.25).connect(golpeDe(t, 0.7, 0.003, 0.14))
  }

  // Se fue afuera y pegó en el alambrado de atrás del arco: el golpe y el tejido que tiembla
  function alambrado(t: number) {
    pelota(t, 0.35)
    for (let i = 0; i < 14; i++) {
      const ti = t + Math.random() ** 1.6 * 0.45
      const volumen = 0.18 * (1 - (ti - t) / 0.5)
      ruido(blanco, ti, 0.012)
        .connect(filtro('bandpass', 2500 + Math.random() * 3500, 3))
        .connect(golpeDe(ti, volumen, 0.001, 0.01 + Math.random() * 0.02))
    }
  }

  function pitido(t: number, f: number) {
    tono('triangle', t, f, f, 0, t + 0.15).connect(golpeDe(t, 0.18, 0.004, 0.11))
  }

  function definicion(d: Definicion, t: number) {
    if (d === 'gol') {
      red(t)
      grito(t + 0.03, { vocal: 'o', duracion: 3.4, volumen: 0.42, ataque: 0.25, sostiene: 0.55, subida: 1.12, voces: 14 })
      grito(t + 0.15, { vocal: 'a', duracion: 2.6, volumen: 0.22, ataque: 0.3, sostiene: 0.4, subida: 1.08, voces: 8 })
      platillo(t + 0.45)
      RITMO.forEach((r, i) => bombo(t + 0.45 + r, i % 5 === 0 ? 0.75 : 0.6))
      nivel(2.6, t, 0.2)
      nivel(1.2, t + 2, 1)
      return
    }
    if (d === 'atajada') guantes(t)
    if (d === 'palo') {
      palo(t)
      pelota(t, 0.5)
    }
    if (d === 'afuera') alambrado(t + 0.2)
    grito(t + (d === 'afuera' ? 0.1 : 0.03), {
      vocal: 'u', duracion: 1.6, volumen: d === 'palo' ? 0.34 : 0.28, ataque: 0.07, sostiene: 0.2, subida: 0.74, voces: 14,
    })
    nivel(1.4, t, 0.2)
    nivel(1, t + 1.8, 1)
  }

  return {
    // Lo que anota el motor
    tocar(s: Sonido, t: number) {
      switch (s.tipo) {
        case 'salto':
          aire(t, 0.22, 450, 1500, 0.7)
          break
        case 'jugada':
          // La gambeta pasa por al lado (el aire sube); el caño, por abajo (baja)
          if (s.jugada === 'gambeta') aire(t, 0.18, 900, 2800, 0.45)
          else aire(t, 0.2, 2600, 700, 0.45)
          pelota(t + 0.02, 0.22)
          break
        case 'pasó': {
          // Cada jugada de la racha suena un semitono más arriba
          const sube = 2 ** (Math.min(s.racha - 1, 7) / 12)
          if (s.jugada === 'caño') campanita(t, [784, 988, 1175, 1568].map((f) => f * sube), 0.05, 0.11)
          else campanita(t, [988, 1319].map((f) => f * sube), 0.07, 0.13)
          if (s.racha > 1) ole(t + 0.12, s.racha)
          else if (s.jugada === 'caño') grito(t + 0.05, { vocal: 'o', duracion: 1, volumen: 0.16, ataque: 0.12, subida: 1.08 })
          break
        }
        case 'choque':
          golpe(t)
          grito(t + 0.04, { vocal: 'u', duracion: 1.3, volumen: 0.2, ataque: 0.08, sostiene: 0.15, subida: 0.78 })
          // La barrida es falta; el que te la saca limpia, no
          if (s.motivo === 'barrida') silbato(t + 0.3, 0.38)
          break
        case 'llegada':
          nivel(2.2, t, 1.1)
          grito(t, { vocal: 'o', duracion: 1.9, volumen: 0.13, ataque: 1.3, sostiene: 0.6, subida: 1.15, voces: 12 })
          break
        case 'remate':
          nivel(0.45, t, 0.8)
          llevar(corazon.gain, LATIDO, t + 0.3, 0.6)
          break
        case 'patada':
          llevar(corazon.gain, 0, t, 0.08)
          pelota(t, 1)
          aire(t + 0.03, 0.38, 1900, 500, 0.3)
          break
        case 'definicion':
          definicion(s.definicion, t)
          break
      }
    },
    // Pitazo inicial y la hinchada que se prende
    empezar(t: number) {
      llevar(corazon.gain, 0, t, 0.05)
      nivel(1, t, 1.2)
      silbato(t, 0.5)
    },
    pausar(t: number) {
      nivel(0, t, 0.3)
    },
    // La cuenta para seguir después de la pausa: tres pitidos y el silbato
    contar(n: number, t: number) {
      if (n > 0) {
        pitido(t, 740)
        return
      }
      silbato(t, 0.28)
      nivel(1, t, 0.6)
    },
    // Si terminó en el arco, el pitazo final (tres)
    terminar(conRemate: boolean, t: number) {
      nivel(0, t + (conRemate ? 0.8 : 0.3), 2.5)
      if (conRemate) {
        silbato(t, 0.24)
        silbato(t + 0.42, 0.24)
        silbato(t + 0.84, 0.75)
      }
    },
  }
}

// ---- El audio de la página ----

let ctx: AudioContext | null = null
let sonidos: ReturnType<typeof crearSonidos> | null = null
let general: GainNode | null = null
let apagado: boolean | null = null

const VOLUMEN = 0.9
const CLAVE = 'gambeta-sonido'

export function sonidoApagado() {
  if (apagado === null) {
    try { apagado = localStorage.getItem(CLAVE) === 'no' } catch { apagado = false }
  }
  return apagado
}

export function apagarSonido(apagar: boolean) {
  apagado = apagar
  try {
    if (apagar) localStorage.setItem(CLAVE, 'no')
    else localStorage.removeItem(CLAVE)
  } catch { /* sin almacenamiento */ }
  if (ctx && general) general.gain.setTargetAtTime(apagar ? 0 : VOLUMEN, ctx.currentTime, 0.02)
}

// Arma el audio la primera vez y lo despierta si estaba dormido. Tiene que llamarse desde un toque o una
// tecla: si no, el navegador no lo deja sonar
export function activarSonido() {
  if (!ctx) {
    const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Contexto) return
    ctx = new Contexto()
    general = ctx.createGain()
    general.gain.value = sonidoApagado() ? 0 : VOLUMEN
    // Cuando suenan varias cosas juntas (el gol: hinchada, bombo y silbato) las empareja para que no sature
    const compresor = ctx.createDynamicsCompressor()
    compresor.threshold.value = -14
    compresor.knee.value = 8
    compresor.ratio.value = 3.5
    compresor.attack.value = 0.004
    compresor.release.value = 0.25
    compresor.connect(general).connect(ctx.destination)
    sonidos = crearSonidos(ctx, compresor)
    // Con la página escondida (otra pestaña, el celular bloqueado) se calla
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) ctx?.suspend().catch(() => {})
      else ctx?.resume().catch(() => {})
    })
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => {})
}

const ahora = () => (ctx ? ctx.currentTime + 0.01 : 0)

export function tocar(s: Sonido) { sonidos?.tocar(s, ahora()) }
export function empezarSonido() { sonidos?.empezar(ahora()) }
export function pausarSonido() { sonidos?.pausar(ahora()) }
export function contarSonido(n: number) { sonidos?.contar(n, ahora()) }
export function terminarSonido(conRemate: boolean) { sonidos?.terminar(conRemate, ahora()) }
