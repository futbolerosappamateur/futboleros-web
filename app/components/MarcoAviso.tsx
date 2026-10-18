'use client'

import { useEffect, useRef } from 'react'

// Marco de una publicidad con imagen (lo arma BloquePublicidad):
// - Anota en una cookie qué aviso se vio en este lugar, para que en la próxima carga vaya el siguiente.
//   Guarda solo el id del aviso, nada de quien lo ve.
// - Cuenta una vista cuando al menos la mitad del aviso está en pantalla un segundo seguido, con la
//   pestaña a la vista, y un clic cuando abren su link. Una vez cada uno por visita a la página.
export default function MarcoAviso({ id, slot, className, children }: {
  id: string
  slot: string
  className: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    document.cookie = `aviso_${slot}=${id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`

    const marco = ref.current
    if (!marco) return

    let enPantalla = false
    let espera: ReturnType<typeof setTimeout> | undefined
    function revisar() {
      clearTimeout(espera)
      if (!enPantalla || document.visibilityState !== 'visible') return
      espera = setTimeout(() => {
        contar(id, 'vista')
        observer.disconnect()
        document.removeEventListener('visibilitychange', revisar)
      }, 1000)
    }
    const observer = new IntersectionObserver(([e]) => {
      enPantalla = e.intersectionRatio >= 0.5
      revisar()
    }, { threshold: 0.5 })
    observer.observe(marco)
    document.addEventListener('visibilitychange', revisar)

    // El link lo pone BloquePublicidad alrededor del marco. Escuchándolo a él también cuenta si lo abren
    // con el teclado; auxclick con button 1 es la rueda del mouse (abre en otra pestaña)
    const enlace = marco.closest('a')
    let tocado = false
    const tocar = (e: MouseEvent) => {
      if (tocado || (e.type === 'auxclick' && e.button !== 1)) return
      tocado = true
      contar(id, 'clic')
    }
    enlace?.addEventListener('click', tocar)
    enlace?.addEventListener('auxclick', tocar)

    return () => {
      clearTimeout(espera)
      observer.disconnect()
      document.removeEventListener('visibilitychange', revisar)
      enlace?.removeEventListener('click', tocar)
      enlace?.removeEventListener('auxclick', tocar)
    }
  }, [slot, id])

  return (
    <aside ref={ref} className={className} aria-label="Publicidad">
      {children}
    </aside>
  )
}

// fetch y no sendBeacon: uBlock corta los sendBeacon. keepalive lo deja terminar aunque se cierre la página
function contar(id: string, tipo: 'vista' | 'clic') {
  fetch('/api/marcas', { method: 'POST', body: JSON.stringify({ id, tipo }), keepalive: true }).catch(() => {})
}
