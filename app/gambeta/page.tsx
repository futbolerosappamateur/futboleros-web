import type { Metadata, Viewport } from 'next'
import { fechaDeHoy } from './motor'
import Juego from './Juego'

export const metadata: Metadata = {
  title: 'Gambeta',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { themeColor: '#0a1528' }

// Se arma en cada visita: el recorrido sale de la fecha de hoy (si se armara al compilar, quedaría fijo)
export const dynamic = 'force-dynamic'

// Prototipo del juego diario con Don Fulbio, abierto para mostrarlo: no está enlazado desde el sitio, los
// buscadores no lo indexan y no guarda nada en la base (todavía no está atado al Plan 10 ni a una vida por día)
export default function GambetaPage() {
  return <Juego fecha={fechaDeHoy()} />
}
