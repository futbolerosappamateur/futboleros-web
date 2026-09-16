import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import SlideForm from '../../../_components/SlideForm'

export default async function EditarSlide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const { data: slide } = await supabase.from('slides').select('*').eq('id', id).single()

  if (!slide) notFound()

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: 32 }}>
        EDITAR SLIDE
      </h1>
      <SlideForm slide={slide} />
    </div>
  )
}
