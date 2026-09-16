import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import NovedadForm from '../../../_components/NovedadForm'

export default async function EditarNovedad({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const { data: novedad } = await supabase
    .from('novedades')
    .select('id, titulo, slug, resumen, contenido, imagen_url, publicado')
    .eq('id', id)
    .maybeSingle()

  if (!novedad) notFound()

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.06em', color: 'var(--text)', marginBottom: 32 }}>
        EDITAR NOVEDAD
      </h1>
      <NovedadForm novedad={novedad} />
    </>
  )
}
