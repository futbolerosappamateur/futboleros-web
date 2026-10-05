import PublicidadForm from '../../_components/PublicidadForm'

export default function NuevaPublicidad() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: 32 }}>
        NUEVA PUBLICIDAD
      </h1>
      <PublicidadForm />
    </div>
  )
}
