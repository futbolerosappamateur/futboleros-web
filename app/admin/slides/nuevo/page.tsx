import SlideForm from '../../_components/SlideForm'

export default function NuevoSlide() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: 32 }}>
        NUEVO SLIDE
      </h1>
      <SlideForm />
    </div>
  )
}
