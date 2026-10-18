import { buscarGrupos } from '../_actions/grupos'
import GruposClient from './GruposClient'

export const revalidate = 0

// La pestaña Grupos del panel de admin de la app: arranca con los últimos creados, también los eliminados
export default async function GruposAdmin() {
  const iniciales = await buscarGrupos('')
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: 8 }}>
        GRUPOS
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Buscá por nombre. Sin buscar, los últimos que se crearon, también los eliminados.
      </p>
      <GruposClient iniciales={iniciales} />
    </>
  )
}
