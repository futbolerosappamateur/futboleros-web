'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './juego.module.css'
import {
  nuevoJuego, avanzar, apretarSalto, soltarSalto, apretarGambeta, metros, puntos, PUNTOS_POR_GAMBETA,
  type Juego as EstadoJuego, type TipoRival,
} from './motor'
import { calcularVista, dibujar, ropaJugador, ropaRival, type Vista } from './dibujo'

type Pantalla = 'inicio' | 'jugando' | 'pausa' | 'fin'

interface Resultado {
  metros: number
  gambetas: number
  puntos: number
  motivo: TipoRival | null
  mejor: number
  record: boolean
}

const PASO = 1 / 120    // la simulación avanza siempre de a 1/120 s, vaya el celular a la velocidad que vaya
const RESERVA_BOTONES = 64   // celular acostado: la línea por la que corre queda arriba de los botones
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function fechaLinda(fecha: string) {
  const [, m, d] = fecha.split('-').map(Number)
  return `${d} de ${MESES[m - 1]}`
}

const esSalto = (codigo: string) => codigo === 'Space' || codigo === 'ArrowUp' || codigo === 'KeyW'
const esGambeta = (codigo: string) => codigo === 'ArrowRight' || codigo === 'KeyD' || codigo === 'ShiftLeft' || codigo === 'ShiftRight'

export default function Juego({ colores, fecha }: { colores: [string, string] | null; fecha: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const medidaRef = useRef<HTMLDivElement>(null)
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
      metros: metros(j), gambetas: j.gambetas, puntos: total, motivo: j.motivo,
      mejor: Math.max(anterior, total), record: anterior > 0 && total > anterior,
    })
    setPantalla('fin')
  }, [setPantalla])

  // Canvas y bucle de juego
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const jugador = ropaJugador(colores)
    const ropas = { jugador, rival: ropaRival(jugador) }
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
      dibujar(ctx, j, vista, ropas, { tactil: tactilRef.current, arriba })
      if (j.estado === 'fin' && pantallaRef.current === 'jugando') terminar(j)
    }
    cuadro = requestAnimationFrame(paso)
    return () => {
      cancelAnimationFrame(cuadro)
      observador.disconnect()
    }
  }, [colores, terminar, tactil])

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

  return (
    <div className={styles.juego} onContextMenu={(e) => e.preventDefault()}>
      <canvas ref={canvasRef} className={styles.lienzo} aria-label="Gambeta: un futbolista corre y esquiva rivales" />
      <div ref={medidaRef} className={styles.medida} aria-hidden="true" />

      {pantalla === 'jugando' && (
        <button className={styles.pausa} onClick={pausar} aria-label="Pausa">II</button>
      )}

      {tactil && pantalla === 'jugando' && (
        <div className={styles.controles}>
          <button className={styles.boton} {...botonSalto}>
            <span className={styles.icono} aria-hidden="true">↑</span>Saltar
          </button>
          <button
            className={styles.boton}
            onPointerDown={(e) => { e.preventDefault(); apretarGambeta(juegoRef.current) }}
          >
            <span className={styles.icono} aria-hidden="true">↝</span>Gambeta
          </button>
        </div>
      )}

      {pantalla === 'inicio' && (
        <div className={styles.capa}>
          <div className={styles.tarjeta}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="" className={styles.logo} />
            <h1 className={styles.titulo}>Gambeta</h1>
            <p className={styles.bajada}>Esquivá a los rivales y llegá lo más lejos que puedas.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/filete-1.webp" alt="" aria-hidden="true" className={styles.filete} />
            <ul className={styles.instrucciones}>
              <li>
                <span className={styles.tecla}>{tactil ? 'Saltar' : 'Espacio'}</span>
                <span>Saltá las barridas.</span>
              </li>
              <li>
                <span className={styles.tecla}>{tactil ? 'Gambeta' : '→'}</span>
                <span>Gambeteá a los que te esperan parados. Si los querés saltar, saltan con vos.</span>
              </li>
            </ul>
            <p className={styles.reglas}>
              Cada metro suma 1 punto y cada gambeta, {PUNTOS_POR_GAMBETA}. El recorrido del {fechaLinda(fecha)} es
              el mismo para todos.
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
              <h2 className={styles.titulo}>Pausa</h2>
              <button className={styles.jugar} onClick={seguir} autoFocus>Seguir</button>
            </div>
          )}
        </div>
      )}

      {pantalla === 'fin' && resultado && (
        <div className={styles.capa}>
          <div className={styles.tarjeta}>
            <h2 className={styles.titulo}>{resultado.motivo === 'barrida' ? '¡Te barrieron!' : '¡Te la sacaron!'}</h2>
            <div className={styles.numeros}>
              <div><strong>{resultado.metros}</strong><span>metros</span></div>
              <div><strong>{resultado.gambetas}</strong><span>gambetas</span></div>
              <div className={styles.total}><strong>{resultado.puntos}</strong><span>puntos</span></div>
            </div>
            <p className={styles.mejor}>
              {resultado.record ? '¡Nuevo récord del día!' : `Tu mejor de hoy: ${resultado.mejor} puntos`}
            </p>
            <button className={styles.jugar} onClick={jugar} autoFocus>Jugar de nuevo</button>
            <p className={styles.nota}>En la versión final, acá diría «Volvé mañana».</p>
          </div>
        </div>
      )}
    </div>
  )
}
