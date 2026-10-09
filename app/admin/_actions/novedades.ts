'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function subirImagenNovedad(formData: FormData): Promise<string> {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file')
  const supabase = createServiceClient()
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await supabase.storage
    .from('novedades')
    .upload(filename, buffer, { contentType: file.type, upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('novedades').getPublicUrl(filename)
  return data.publicUrl
}

export async function crearNovedad(formData: FormData) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('novedades').insert({
    titulo: formData.get('titulo') as string,
    slug: formData.get('slug') as string,
    resumen: (formData.get('resumen') as string) || null,
    contenido: (formData.get('contenido') as string) || null,
    imagen_url: (formData.get('imagen_url') as string) || null,
    categoria: (formData.get('categoria') as string) || null,
    publicado: formData.get('publicado') === 'on',
  })
  if (error) throw error
  revalidatePath('/novedades')
  revalidatePath('/admin/novedades')
  redirect('/admin/novedades')
}

export async function editarNovedad(id: string, formData: FormData) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('novedades').update({
    titulo: formData.get('titulo') as string,
    slug: formData.get('slug') as string,
    resumen: (formData.get('resumen') as string) || null,
    contenido: (formData.get('contenido') as string) || null,
    imagen_url: (formData.get('imagen_url') as string) || null,
    categoria: (formData.get('categoria') as string) || null,
    publicado: formData.get('publicado') === 'on',
    actualizado_en: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/novedades')
  revalidatePath(`/novedades/${formData.get('slug')}`)
  revalidatePath('/admin/novedades')
  redirect('/admin/novedades')
}

export async function eliminarNovedad(id: string) {
  const supabase = createServiceClient()
  await supabase.from('novedades').delete().eq('id', id)
  revalidatePath('/novedades')
  revalidatePath('/admin/novedades')
}
