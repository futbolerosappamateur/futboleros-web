'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from './jugador.module.css'

// La página del jugador es estática (la ve cualquiera): el botón se decide en el navegador, solo para el dueño
export default function BotonEditar({ perfilId }: { perfilId: string }) {
  const [esMio, setEsMio] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      setEsMio(session?.user.id === perfilId)
    })
  }, [perfilId])

  if (!esMio) return null
  return <Link href="/editar-perfil" className={styles.btnEditar}>Editar perfil</Link>
}
