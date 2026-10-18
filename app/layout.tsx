import type { Metadata } from 'next'
import { SITE_URL, OG_IMAGEN, SITIO_EN_PRUEBA } from '@/lib/sitio'
import './globals.css'

const DESCRIPCION = 'Organizá partidos, seguí tus estadísticas y conectá con otros jugadores.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),   // las imágenes de la vista previa van con la dirección completa
  title: {
    default: 'Futboleros · El fútbol amateur, organizado',
    template: '%s · Futboleros',
  },
  description: DESCRIPCION,
  icons: { icon: '/favicon.png' },
  // Vista previa al compartir un link (WhatsApp, Facebook, X): las páginas que no traen la suya usan esta
  openGraph: {
    type: 'website',
    siteName: 'Futboleros',
    locale: 'es_AR',
    title: 'Futboleros · El fútbol amateur, organizado',
    description: DESCRIPCION,
    images: [OG_IMAGEN],
  },
  twitter: { card: 'summary_large_image' },
  // Web en prueba: ninguna página se indexa (además del robots.txt)
  ...(SITIO_EN_PRUEBA ? { robots: { index: false, follow: false } } : {}),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
