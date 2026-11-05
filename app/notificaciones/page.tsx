import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import Filete from '../components/Filete'
import { createClient } from '@/lib/supabase/server'
import { armarAvisos } from '@/lib/notificaciones-servidor'
import { FONDO_PERFIL } from '@/lib/perfil-opciones'
import NotificacionesClient from './NotificacionesClient'
import styles from './notificaciones.module.css'

export const metadata: Metadata = {
  title: 'Notificaciones',
  robots: { index: false },
}

export default async function Notificaciones() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/notificaciones')

  // Los últimos 50 avisos de la web y los testimonios por aprobar (la campanita muestra los 5 primeros)
  const { avisos, pendientes } = await armarAvisos(supabase, user.id, 50)

  return (
    <>
      <Header />
      <main className={styles.page}>
        <ParallaxHero src={FONDO_PERFIL} className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.badge}>TU CUENTA</span>
            <h1 className={styles.title}>NOTIFICACIONES</h1>
            <p className={styles.subtitle}>Seguidores, testimonios, sorteos y grupos. Los avisos de los partidos siguen en la app.</p>
            <Filete />
          </div>
        </ParallaxHero>

        <div className={styles.body}>
          <NotificacionesClient userId={user.id} avisos={avisos} pendientes={pendientes} />
        </div>
      </main>
      <Footer />
    </>
  )
}
