import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ParallaxHero from '../components/ParallaxHero'
import { createClient } from '@/lib/supabase/server'
import EditarPerfilForm, { type PerfilEditable } from './EditarPerfilForm'
import styles from './editar.module.css'

export const metadata: Metadata = {
  title: 'Editar perfil',
  robots: { index: false },
}

const CAMPOS = 'id, nombre, apodo, username, avatar_url, fecha_nacimiento, altura, peso, whatsapp, sexo, pais, hincha_de, idolo, estilo_juego, caracteristicas, redes, talle_remera, talle_pantalon, talle_calzado, nombre_camiseta, numero_camiseta, domicilio, es_pro'

export default async function EditarPerfil() {
  // Con la sesión del usuario (no service role): lee y guarda con los mismos permisos que la app
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/editar-perfil')

  const { data: perfil } = await supabase.from('perfiles').select(CAMPOS).eq('id', user.id).maybeSingle()
  const tienePassword = user.identities?.some(i => i.provider === 'email') ?? false

  return (
    <>
      <Header />
      <main className={styles.page}>
        <ParallaxHero src="/fondos/jugador.webp" className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.badge}>TU CUENTA</span>
            <h1 className={styles.title}>EDITAR PERFIL</h1>
            <p className={styles.subtitle}>Lo que cambies acá también se ve en la app.</p>
          </div>
        </ParallaxHero>

        <div className={styles.body}>
          <EditarPerfilForm
            userId={user.id}
            perfil={perfil as PerfilEditable | null}
            tienePassword={tienePassword}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
