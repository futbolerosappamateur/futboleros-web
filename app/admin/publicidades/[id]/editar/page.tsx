import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import PublicidadForm from '../../../_components/PublicidadForm'

export default async function EditarPublicidad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const { data: pub } = await supabase.from('publicidades').select('*').eq('id', id).single()

  if (!pub) notFound()

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: 32 }}>
        EDITAR PUBLICIDAD
      </h1>
      <PublicidadForm pub={pub} />
    </div>
  )
}
