'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import localFont from 'next/font/local'
import styles from './juego.module.css'
import {
  nuevoJuego, avanzar, apretarSalto, soltarSalto, apretarGambeta, apretarCaño, metros, puntos,
  PUNTOS_POR_GAMBETA, PUNTOS_POR_CAÑO, type Juego as EstadoJuego, type Motivo,
} from './motor'
import { calcularVista, cargarPersonajes, dibujar, texturaGrano, type Vista } from './dibujo'

// Letras de los afiches de Don Fulbio: la firma de Futboleros y los títulos de madera
const firma = localFont({ src: '../../public/fonts/Lobster-Regular.ttf', display: 'swap' })
const titulo = localFont({ src: '../../public/fonts/Rye-Regular.ttf', display: 'swap' })

type Pantalla = 'inicio' | 'jugando' | 'pausa' | 'fin'

interface Resultado {
  metros: number
  gambetas: number
  caños: number
  puntos: number
  motivo: Motivo | null
  mejor: number
  record: boolean
  frase: string
}

const PASO = 1 / 120    // la simulación avanza siempre de a 1/120 s, vaya el celular a la velocidad que vaya
const RESERVA_BOTONES = 64   // celular acostado: la línea por la que corre queda arriba de los botones
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const TITULOS: Record<Motivo, string> = {
  barrida: '¡Te barrieron!',
  parado: '¡Te la sacaron!',
  cerrado: '¡Cerró las piernas!',
}

// Frases de Don Fulbio para cuando se termina
const FRASES = [
  'Hoy juego tranquilo.',
  'El calentamiento es para los profesionales.',
  'Ya estoy grande, pero le meto igual.',
  'Sin VAR y con esguinces.',
  'El lunes no cuento.',
  'En la cancha dejo todo. Y mi cuerpo también.',
]

function fechaLinda(fecha: string) {
  const [, m, d] = fecha.split('-').map(Number)
  return `${d} de ${MESES[m - 1]}`
}

const esSalto = (codigo: string) => codigo === 'Space' || codigo === 'ArrowUp' || codigo === 'KeyW'
const esGambeta = (codigo: string) => codigo === 'ArrowRight' || codigo === 'KeyD'
const esCaño = (codigo: string) => codigo === 'ArrowDown' || codigo === 'KeyS'

export default function Juego({ fecha }: { fecha: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const medidaRef = useRef<HTMLDivElement>(null)
  const texturaRef = useRef<HTMLDivElement>(null)
  const juegoRef = useRef<EstadoJuego>(nuevoJuego(fecha))
  const pantallaRef = useRef<Pantalla>('inicio')
  const tactilRef = useRef(false)
  const [pantalla, setPantallaEstado] = useState<Pantalla>('inicio')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [cuenta, setCuenta] = useState<number | null>(null)
  const [tactil, setTactil] = useState(false)

  const setPantalla = useCallback((p: Pantalla) => {
    pantallaRef.current = p
    setPantallaEstado(p)
  }, [])

  const jugar = useCallback(() => {
    juegoRef.current = nuevoJuego(fecha, 'jugando')
    setResultado(null)
    setCuenta(null)
    setPantalla('jugando')
  }, [fecha, setPantalla])

  const pausar = useCallback(() => {
    const j = juegoRef.current
    if (pantallaRef.current !== 'jugando' || j.estado !== 'jugando') return
    j.estado = 'pausa'
    soltarSalto(j)
    setCuenta(null)
    setPantalla('pausa')
  }, [setPantalla])

  // Volver de la pausa con una cuenta de 3
  const seguir = useCallback(() => setCuenta((c) => (c === null ? 3 : c)), [])

  useEffect(() => {
    if (cuenta === null) return
    if (cuenta === 0) {
      juegoRef.current.estado = 'jugando'
      setCuenta(null)
      setPantalla('jugando')
      return
    }
    const t = setTimeout(() => setCuenta(cuenta - 1), 650)
    return () => clearTimeout(t)
  }, [cuenta, setPantalla])

  const terminar = useCallback((j: EstadoJuego) => {
    // Mejor puntaje del día en este navegador (en la versión final va a la base, con una vida por día)
    const clave = `gambeta-mejor-${j.fecha}`
    const total = puntos(j)
    let anterior = 0
    try { anterior = Number(localStorage.getItem(clave)) || 0 } catch { /* sin almacenamiento */ }
    if (total > anterior) {
      try { localStorage.setItem(clave, String(total)) } catch { /* sin almacenamiento */ }
    }
    setResultado({
      metros: metros(j), gambetas: j.gambetas, caños: j.caños, puntos: total, motivo: j.motivo,
      mejor: Math.max(anterior, total), record: anterior > 0 && total > anterior,
      frase: FRASES[Math.floor(Math.random() * FRASES.length)],
    })
    setPantalla('fin')
  }, [setPantalla])

  // Canvas y bucle de juego
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let vista: Vista
    let arriba = 0

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      vista = calcularVista(width, height, dpr, tactilRef.current ? RESERVA_BOTONES : 0)
      arriba = medidaRef.current ? parseFloat(getComputedStyle(medidaRef.current).paddingTop) || 0 : 0
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(canvas)
    document.fonts?.load('48px "Bebas Neue"').catch(() => {})

    let ultimo = performance.now()
    let acumulado = 0
    let cuadro = 0
    const paso = (ahora: number) => {
      cuadro = requestAnimationFrame(paso)
      const j = juegoRef.current
      acumulado += Math.min(0.1, (ahora - ultimo) / 1000)
      ultimo = ahora
      while (acumulado >= PASO) {
        avanzar(j, PASO)
        acumulado -= PASO
      }
      dibujar(ctx, j, vista, { tactil: tactilRef.current, arriba, firma: firma.style.fontFamily })
      if (j.estado === 'fin' && pantallaRef.current === 'jugando') terminar(j)
    }
    cuadro = requestAnimationFrame(paso)
    return () => {
      cancelAnimationFrame(cuadro)
      observador.disconnect()
    }
  }, [terminar, tactil])

  // Las imágenes de Don Fulbio y de los rivales (mientras cargan se ven los muñecos dibujados), y el
  // grano de papel de la capa de arriba
  useEffect(() => {
    cargarPersonajes().catch(() => {})
    texturaRef.current?.style.setProperty('--grano', `url(${texturaGrano()})`)
  }, [])

  // Pantalla táctil: botones en lugar de teclas
  useEffect(() => {
    const t = window.matchMedia('(pointer: coarse)').matches
    tactilRef.current = t
    setTactil(t)
  }, [])

  // Teclado
  useEffect(() => {
    const abajo = (e: KeyboardEvent) => {
      const p = pantallaRef.current
      const j = juegoRef.current
      if (p === 'jugando') {
        if (esSalto(e.code)) {
          e.preventDefault()
          if (!e.repeat) apretarSalto(j)
        } else if (esGambeta(e.code)) {
          e.preventDefault()
          if (!e.repeat) apretarGambeta(j)
        } else if (esCaño(e.code)) {
          e.preventDefault()
          if (!e.repeat) apretarCaño(j)
        } else if (e.code === 'Escape' || e.code === 'KeyP') {
          pausar()
        }
        return
      }
      // En las pantallas, Espacio o Enter equivalen al botón (si el botón tiene el foco, lo resuelve él)
      if ((e.code === 'Space' || e.code === 'Enter') && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault()
        if (p === 'pausa') seguir()
        else jugar()
      }
    }
    const arriba = (e: KeyboardEvent) => {
      if (esSalto(e.code)) soltarSalto(juegoRef.current)
    }
    const oculta = () => { if (document.hidden) pausar() }
    window.addEventListener('keydown', abajo)
    window.addEventListener('keyup', arriba)
    document.addEventListener('visibilitychange', oculta)
    return () => {
      window.removeEventListener('keydown', abajo)
      window.removeEventListener('keyup', arriba)
      document.removeEventListener('visibilitychange', oculta)
    }
  }, [jugar, pausar, seguir])

  const botonSalto = {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      apretarSalto(juegoRef.current)
    },
    onPointerUp: () => soltarSalto(juegoRef.current),
    onPointerCancel: () => soltarSalto(juegoRef.current),
  }

  const cara = resultado?.record ? 'valio' : 'dolor'

  return (
    <div className={styles.juego} onContextMenu={(e) => e.preventDefault()}>
      <canvas ref={canvasRef} className={styles.lienzo} aria-label="Gambeta: Don Fulbio corre y esquiva rivales" />
      <div className={styles.tinte} aria-hidden="true" />
      <div ref={texturaRef} className={styles.textura} aria-hidden="true" />
      <div ref={medidaRef} className={styles.medida} aria-hidden="true" />

      {pantalla === 'jugando' && (
        <button className={styles.pausa} onClick={pausar} aria-label="Pausa">II</button>
      )}

      {tactil && pantalla === 'jugando' && (
        <div className={styles.controles}>
          <button className={`${styles.boton} ${styles.botonSalto}`} {...botonSalto}>
            <span className={styles.icono} aria-hidden="true">↑</span>Saltar
          </button>
          <button
            className={`${styles.boton} ${styles.botonGambeta}`}
            onPointerDown={(e) => { e.preventDefault(); apretarGambeta(juegoRef.current) }}
          >
            <span className={styles.icono} aria-hidden="true">→</span>Gambeta
          </button>
          <button
            className={`${styles.boton} ${styles.botonCaño}`}
            onPointerDown={(e) => { e.preventDefault(); apretarCaño(juegoRef.current) }}
          >
            <span className={styles.icono} aria-hidden="true">↓</span>Caño
          </button>
        </div>
      )}

      {pantalla === 'inicio' && (
        <div className={styles.capa}>
          <div className={styles.tarjeta}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/juego/don-fulbio.webp" alt="Don Fulbio, con el mate y la pelota" className={styles.retrato} />
            <h1 className={`${styles.titulo} ${titulo.className}`}>Gambeta</h1>
            <p className={`${styles.cinta} ${firma.className}`}>con Don Fulbio</p>
            <ul className={styles.instrucciones}>
              <li>
                <span className={styles.tecla}>{tactil ? 'Saltar' : 'Espacio'}</span>
                <span>Saltá las barridas.</span>
              </li>
              <li>
                <span className={styles.tecla}>{tactil ? 'Gambeta' : '→'}</span>
                <span>Gambeteá a los que te esperan parados. Si los querés saltar, saltan con vos.</span>
              </li>
              <li>
                <span className={styles.tecla}>{tactil ? 'Caño' : '↓'}</span>
                <span>Al que tiene las piernas abiertas, tirale un caño. Si las tiene cerradas, te la saca.</span>
              </li>
            </ul>
            <p className={styles.reglas}>
              Cada metro suma 1 punto, cada gambeta {PUNTOS_POR_GAMBETA} y cada caño {PUNTOS_POR_CAÑO}. El
              recorrido del {fechaLinda(fecha)} es el mismo para todos.
            </p>
            <button className={styles.jugar} onClick={jugar} autoFocus>Jugar</button>
            <p className={styles.nota}>Prototipo: en la versión final hay una sola vida por día.</p>
          </div>
        </div>
      )}

      {pantalla === 'pausa' && (
        <div className={styles.capa}>
          {cuenta !== null ? (
            <div className={styles.cuenta} aria-live="assertive">{cuenta}</div>
          ) : (
            <div className={styles.tarjeta}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/juego/cara-tranquilo.webp" alt="" className={styles.cara} />
              <h2 className={`${styles.titulo} ${titulo.className}`}>Pausa</h2>
              <p className={`${styles.frase} ${firma.className}`}>“Hoy juego tranquilo”</p>
              <button className={styles.jugar} onClick={seguir} autoFocus>Seguir</button>
            </div>
          )}
        </div>
      )}

      {pantalla === 'fin' && resultado && (
        <div className={styles.capa}>
          <div className={styles.tarjeta}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/juego/cara-${cara}.webp`} alt="" className={styles.cara} />
            <h2 className={`${styles.titulo} ${styles.tituloFin} ${titulo.className}`}>
              {resultado.motivo ? TITULOS[resultado.motivo] : '¡Fin!'}
            </h2>
            <p className={`${styles.frase} ${firma.className}`}>“{resultado.frase}”</p>
            <div className={styles.numeros}>
              <div><strong>{resultado.metros}</strong><span>metros</span></div>
              <div><strong>{resultado.gambetas}</strong><span>gambetas</span></div>
              <div><strong>{resultado.caños}</strong><span>caños</span></div>
              <div className={styles.total}><strong>{resultado.puntos}</strong><span>puntos</span></div>
            </div>
            <p className={styles.mejor}>
              {resultado.record ? '¡Nuevo récord del día! Valió la pena.' : `Tu mejor de hoy: ${resultado.mejor} puntos`}
            </p>
            <button className={styles.jugar} onClick={jugar} autoFocus>Jugar de nuevo</button>
            <p className={styles.nota}>En la versión final, acá diría «Volvé mañana».</p>
          </div>
        </div>
      )}
    </div>
  )
}
