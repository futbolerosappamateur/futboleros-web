import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import Filete from '../components/Filete'
import { createClient } from '@/lib/supabase/server'
import { FONDO_PERFIL } from '@/lib/perfil-opciones'
import ChatClient from './ChatClient'
import styles from './chat.module.css'

export const metadata: Metadata = {
  title: 'Mensajes',
  robots: { index: false },
}

export default async function Chat() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/chat')

  return (
    <>
      <Header />
      <main className={styles.page}>
        <ParallaxHero src={FONDO_PERFIL} className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.badge}>TU CUENTA</span>
            <h1 className={styles.title}>MENSAJES</h1>
            <p className={styles.subtitle}>Los mismos chats que tenés en la app.</p>
            <Filete />
          </div>
        </ParallaxHero>

        <div className={styles.body}>
          <Suspense>
            <ChatClient userId={user.id} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
