'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './editar.module.css'

const VISOR = 280    // lado del recuadro de recorte, en px de pantalla
const SALIDA = 800   // lado de la foto final, igual que la app
const ZOOM_MAX = 3

type Props = {
  archivo: File
  onListo: (foto: Blob) => void
  onCancelar: () => void
}

// Recorte cuadrado (como el de la app al elegir la foto): arrastrar para encuadrar y zoom con el slider
export default function RecortarFoto({ archivo, onListo, onCancelar }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [fallo, setFallo] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const arrastre = useRef<{ x: number; y: number; desdeX: number; desdeY: number } | null>(null)

  useEffect(() => {
    // La URL vive mientras el recorte está abierto (la vista previa la usa) y se libera al limpiar.
    // En desarrollo React corre los efectos dos veces: la primera carga se corta al liberar su URL,
    // así que el resultado de un efecto ya limpiado se ignora (si no, quedaba el error de imagen).
    let vigente = true
    const url = URL.createObjectURL(archivo)
    const im = new Image()
    im.onload = () => {
      if (!vigente) return
      const s = VISOR / Math.min(im.naturalWidth, im.naturalHeight)
      setPos({ x: (VISOR - im.naturalWidth * s) / 2, y: (VISOR - im.naturalHeight * s) / 2 })
      setImg(im)
    }
    im.onerror = () => { if (vigente) setFallo(true) }
    im.src = url
    return () => {
      vigente = false
      URL.revokeObjectURL(url)
    }
  }, [archivo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancelar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancelar])

  const base = img ? VISOR / Math.min(img.naturalWidth, img.naturalHeight) : 1
  const escala = base * zoom

  // La imagen siempre tiene que cubrir todo el visor
  const limitar = (x: number, y: number, s: number) => img ? {
    x: Math.min(0, Math.max(VISOR - img.naturalWidth * s, x)),
    y: Math.min(0, Math.max(VISOR - img.naturalHeight * s, y)),
  } : { x, y }

  const cambiarZoom = (z: number) => {
    // mantener fijo el punto que está en el centro del visor
    const cx = (VISOR / 2 - pos.x) / escala
    const cy = (VISOR / 2 - pos.y) / escala
    const s = base * z
    setZoom(z)
    setPos(limitar(VISOR / 2 - cx * s, VISOR / 2 - cy * s, s))
  }

  const confirmar = () => {
    if (!img) return
    const lado = VISOR / escala
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = SALIDA
    canvas.getContext('2d')!.drawImage(img, -pos.x / escala, -pos.y / escala, lado, lado, 0, 0, SALIDA, SALIDA)
    canvas.toBlob(b => { if (b) onListo(b) }, 'image/jpeg', 0.8)
  }

  return (
    <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="recortar-titulo" onClick={onCancelar}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        <h2 id="recortar-titulo" className={styles.modalTitulo}>Ajustá tu foto</h2>

        {fallo ? (
          <p className={styles.modalError}>No se pudo abrir esa imagen. Probá con una foto JPG o PNG.</p>
        ) : (
          <>
            <div
              className={styles.visor}
              style={{ width: VISOR, height: VISOR }}
              onPointerDown={e => {
                e.currentTarget.setPointerCapture(e.pointerId)
                arrastre.current = { x: e.clientX, y: e.clientY, desdeX: pos.x, desdeY: pos.y }
              }}
              onPointerMove={e => {
                const a = arrastre.current
                if (a) setPos(limitar(a.desdeX + e.clientX - a.x, a.desdeY + e.clientY - a.y, escala))
              }}
              onPointerUp={() => { arrastre.current = null }}
              onPointerCancel={() => { arrastre.current = null }}
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.src}
                  alt=""
                  draggable={false}
                  className={styles.visorImg}
                  style={{
                    width: img.naturalWidth * escala,
                    height: img.naturalHeight * escala,
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                  }}
                />
              )}
            </div>
            <p className={styles.modalAyuda}>Arrastrá para encuadrar</p>
            <label className={styles.zoom}>
              <span>Zoom</span>
              <input
                type="range"
                min={1}
                max={ZOOM_MAX}
                step={0.01}
                value={zoom}
                onChange={e => cambiarZoom(Number(e.target.value))}
                disabled={!img}
              />
            </label>
          </>
        )}

        <div className={styles.modalAcciones}>
          <button type="button" className={styles.btnSecundario} onClick={onCancelar}>Cancelar</button>
          {!fallo && (
            <button type="button" className={styles.btnPrimario} onClick={confirmar} disabled={!img}>
              Usar foto
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
