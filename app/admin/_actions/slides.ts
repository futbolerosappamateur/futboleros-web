'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function subirImagenSlide(formData: FormData): Promise<string> {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file')
  const supabase = createServiceClient()
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await supabase.storage
    .from('slides')
    .upload(filename, buffer, { contentType: file.type, upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('slides').getPublicUrl(filename)
  return data.publicUrl
}

export async function crearSlide(formData: FormData) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('slides').insert({
    titulo: formData.get('titulo') as string,
    subtitulo: (formData.get('subtitulo') as string) || null,
    imagen_url: (formData.get('imagen_url') as string) || null,
    cta_texto: (formData.get('cta_texto') as string) || null,
    cta_url: (formData.get('cta_url') as string) || null,
    orden: parseInt((formData.get('orden') as string) || '0'),
    activo: formData.get('activo') === 'on',
  })
  if (error) throw error
  revalidatePath('/')
  revalidatePath('/admin/slides')
  redirect('/admin/slides')
}

export async function editarSlide(id: string, formData: FormData) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('slides').update({
    titulo: formData.get('titulo') as string,
    subtitulo: (formData.get('subtitulo') as string) || null,
    imagen_url: (formData.get('imagen_url') as string) || null,
    cta_texto: (formData.get('cta_texto') as string) || null,
    cta_url: (formData.get('cta_url') as string) || null,
    orden: parseInt((formData.get('orden') as string) || '0'),
    activo: formData.get('activo') === 'on',
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/')
  revalidatePath('/admin/slides')
  redirect('/admin/slides')
}

export async function eliminarSlide(id: string) {
  const supabase = createServiceClient()
  await supabase.from('slides').delete().eq('id', id)
  revalidatePath('/')
  revalidatePath('/admin/slides')
}
