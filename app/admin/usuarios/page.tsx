import { buscarUsuarios } from '../_actions/usuarios'
import UsuariosClient from './UsuariosClient'

export const revalidate = 0

// La pestaña Usuarios del panel de admin de la app: arranca con los últimos que se registraron
export default async function UsuariosAdmin() {
  const iniciales = await buscarUsuarios('')
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: 8 }}>
        USUARIOS
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Buscá por nombre, apodo, usuario o mail. Sin buscar, los últimos que se registraron.
      </p>
      <UsuariosClient iniciales={iniciales} />
    </>
  )
}
