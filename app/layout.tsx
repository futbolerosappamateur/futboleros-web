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
  // suppressHydrationWarning: hay extensiones del navegador que le agregan atributos al <body> antes de que
  // cargue React (la "Screenshot Tool" de Chrome le pone location="localhost") y en desarrollo saltaba el
  // aviso de hidratación. Solo ignora los atributos del <body>; lo de adentro se sigue chequeando.
  return (
    <html lang="es">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
