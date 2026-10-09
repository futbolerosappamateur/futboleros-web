'use client'

import { useState } from 'react'
import styles from './novedad.module.css'

// Botones para compartir la nota: Facebook, X (Twitter), WhatsApp y copiar el link
export default function CompartirNota({ url, titulo }: { url: string; titulo: string }) {
  const [copiado, setCopiado] = useState(false)
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(titulo)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch { /* sin permiso para el portapapeles: no hace nada */ }
  }

  return (
    <div className={styles.compartir}>
      <span className={styles.compartirLabel}>Compartir</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${u}`}
        target="_blank" rel="noopener noreferrer"
        className={styles.compartirBtn} aria-label="Compartir en Facebook" title="Facebook"
      >
        <span className={styles.compartirIcono} style={{ '--icono': 'url(/redes/facebook.webp)' } as React.CSSProperties} aria-hidden="true" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`}
        target="_blank" rel="noopener noreferrer"
        className={styles.compartirBtn} aria-label="Compartir en X (Twitter)" title="X (Twitter)"
      >
        <span className={styles.compartirIcono} style={{ '--icono': 'url(/redes/x.webp)' } as React.CSSProperties} aria-hidden="true" />
      </a>
      <a
        href={`https://wa.me/?text=${t}%20${u}`}
        target="_blank" rel="noopener noreferrer"
        className={styles.compartirBtn} aria-label="Compartir por WhatsApp" title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
        </svg>
      </a>
      <button type="button" onClick={copiar} className={styles.compartirBtn} aria-label="Copiar link" title="Copiar link">
        {copiado ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13.5a4.5 4.5 0 0 0 6.36.04l3-3a4.5 4.5 0 0 0-6.36-6.36l-1.25 1.24" />
            <path d="M14 10.5a4.5 4.5 0 0 0-6.36-.04l-3 3a4.5 4.5 0 0 0 6.36 6.36l1.24-1.24" />
          </svg>
        )}
      </button>
      {copiado && <span className={styles.compartirAviso} role="status">¡Link copiado!</span>}
    </div>
  )
}
