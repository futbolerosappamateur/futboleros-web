'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { EVENTO_CHAT_LEIDO, contarNoLeidos } from '@/lib/chat'
import styles from './Header.module.css'

type UserInfo = {
  id: string
  nombre: string | null
  username: string | null
  avatar_url: string | null
  tienePerfil: boolean
}

export default function Header({ darkLinks = false }: { darkLinks?: boolean }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [noLeidos, setNoLeidos] = useState(0)
  const userId = user?.id

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('id, nombre, username, avatar_url')
        .eq('id', u.id)
        .maybeSingle()
      // Cuenta sin perfil todavía (registrada en la web): igual se muestra el menú para que pueda completarlo
      setUser(perfil
        ? { ...perfil, tienePerfil: true }
        : { id: u.id, nombre: u.user_metadata?.nombre_completo ?? null, username: null, avatar_url: null, tienePerfil: false })
    })
  }, [])

  // Globito del chat: mensajes sin leer cada 15 s, como en la app, y al momento cuando el chat los marca leídos
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    let vigente = true
    const cargar = () => {
      contarNoLeidos(supabase, userId).then(n => { if (vigente) setNoLeidos(n) }).catch(() => {})
    }
    cargar()
    const intervalo = setInterval(cargar, 15000)
    window.addEventListener(EVENTO_CHAT_LEIDO, cargar)
    return () => {
      vigente = false
      clearInterval(intervalo)
      window.removeEventListener(EVENTO_CHAT_LEIDO, cargar)
    }
  }, [userId])

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''} ${darkLinks && !scrolled ? styles.headerDarkLinks : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo.webp"
            alt="Futboleros"
            width={128}
            height={141}
            priority
            className={`${styles.logoShield} ${scrolled ? styles.logoHidden : styles.logoVisible}`}
          />
          <Image
            src="/logoFoot2.webp"
            alt="Futboleros"
            width={180}
            height={48}
            priority
            className={`${styles.logoTipo} ${scrolled ? styles.logoVisible : styles.logoHidden}`}
          />
        </Link>

        <nav className={`${styles.nav} ${open ? styles.navOpen : ''}`}>
          <Link href="/jugadores" className={styles.navLink} onClick={() => setOpen(false)}>Jugadores</Link>
          <Link href="/grupos" className={styles.navLink} onClick={() => setOpen(false)}>Grupos</Link>
          <Link href="/novedades" className={styles.navLink} onClick={() => setOpen(false)}>Novedades</Link>
          <Link href="/plan10" className={styles.navLink} onClick={() => setOpen(false)}>Plan 10</Link>
        </nav>

        <div className={styles.actions}>
          {user && (
            <Link href="/chat" className={styles.chatBtn} aria-label="Mensajes" title="Mensajes">
              <span className={styles.chatIcono} />
              {noLeidos > 0 && <span className={styles.chatBadge}>{noLeidos > 9 ? '9+' : noLeidos}</span>}
            </Link>
          )}
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.userChip}>
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.nombre ?? ''}
                    width={32}
                    height={32}
                    className={styles.userAvatar}
                    unoptimized
                  />
                ) : (
                  <span className={styles.userAvatarPh}>
                    {user.nombre?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                )}
                <span className={styles.userNombre}>{user.nombre?.split(' ')[0]}</span>
              </div>
              <div className={styles.userDropdown}>
                <div className={styles.userDropdownInner}>
                  {user.tienePerfil && (
                    <Link
                      href={`/jugadores/${user.username ?? user.id}`}
                      className={styles.dropdownItem}
                      onClick={() => setOpen(false)}
                    >
                      Perfil
                    </Link>
                  )}
                  <Link href="/editar-perfil" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                    Editar perfil
                  </Link>
                  <button
                    className={styles.dropdownItem}
                    onClick={async () => {
                      const supabase = createClient()
                      await supabase.auth.signOut()
                      setUser(null)
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.btnSecondary}>Ingresar</Link>
              <Link href="/registro" className={styles.btnPrimary}>Registrarse</Link>
            </>
          )}
        </div>

        <button
          className={styles.hamburger}
          onClick={() => setOpen(o => !o)}
          aria-label="Menú"
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  )
}
