'use client'

import { useEffect } from 'react'

// Hace aparecer, a medida que se baja, los elementos con data-revelar (estilos en globals.css).
// Lo que ya se ve al cargar no se esconde, así no parpadea; sin JavaScript se ve todo de entrada.
// Un --retraso en el style escalona elementos que entran juntos
export default function AnimarAlScroll() {
  useEffect(() => {
    const observer = new IntersectionObserver(entradas => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue
        e.target.classList.remove('revelar-oculto')
        observer.unobserve(e.target)
      }
    }, { rootMargin: '0px 0px -8% 0px' })

    for (const el of document.querySelectorAll<HTMLElement>('[data-revelar]')) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add('revelar-oculto')
        observer.observe(el)
      }
    }
    return () => observer.disconnect()
  }, [])

  return null
}
