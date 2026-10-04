import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Futboleros · El fútbol amateur, organizado',
    template: '%s · Futboleros',
  },
  description: 'Organizá partidos, seguí tus estadísticas y conectá con jugadores de tu zona.',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
