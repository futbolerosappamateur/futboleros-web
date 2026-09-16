import NovedadForm from '../../_components/NovedadForm'

export default function NuevaNovedad() {
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.06em', color: 'var(--text)', marginBottom: 32 }}>
        NUEVA NOVEDAD
      </h1>
      <NovedadForm />
    </>
  )
}
