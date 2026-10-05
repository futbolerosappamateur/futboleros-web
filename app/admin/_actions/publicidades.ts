'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const PATHS = ['/', '/admin/publicidades']

export async function subirImagenPublicidad(formData: FormData): Promise<string> {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file')
  const supabase = createServiceClient()
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await supabase.storage
    .from('publicidades')
    .upload(filename, buffer, { contentType: file.type, upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('publicidades').getPublicUrl(filename)
  return data.publicUrl
}

export async function crearPublicidad(formData: FormData) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('publicidades').insert({
    slot:        formData.get('slot') as string,
    titulo:      (formData.get('titulo') as string) || null,
    imagen_url:  formData.get('imagen_url') as string,
    url_destino: (formData.get('url_destino') as string) || null,
    para_free:   formData.get('para_free') === 'on',
    para_plan10: formData.get('para_plan10') === 'on',
    activa:      formData.get('activa') === 'on',
    orden:       parseInt((formData.get('orden') as string) || '0'),
  })
  if (error) throw error
  PATHS.forEach(p => revalidatePath(p))
  redirect('/admin/publicidades')
}

export async function editarPublicidad(id: string, formData: FormData) {
  const supabase = createServiceClient()
  const updates: Record<string, unknown> = {
    slot:        formData.get('slot') as string,
    titulo:      (formData.get('titulo') as string) || null,
    url_destino: (formData.get('url_destino') as string) || null,
    para_free:   formData.get('para_free') === 'on',
    para_plan10: formData.get('para_plan10') === 'on',
    activa:      formData.get('activa') === 'on',
    orden:       parseInt((formData.get('orden') as string) || '0'),
  }
  const nuevaImagen = formData.get('imagen_url') as string
  if (nuevaImagen) updates.imagen_url = nuevaImagen
  const { error } = await supabase.from('publicidades').update(updates).eq('id', id)
  if (error) throw error
  PATHS.forEach(p => revalidatePath(p))
  redirect('/admin/publicidades')
}

export async function toggleActiva(id: string, activa: boolean) {
  const supabase = createServiceClient()
  await supabase.from('publicidades').update({ activa }).eq('id', id)
  PATHS.forEach(p => revalidatePath(p))
}

export async function eliminarPublicidad(id: string) {
  const supabase = createServiceClient()
  await supabase.from('publicidades').delete().eq('id', id)
  PATHS.forEach(p => revalidatePath(p))
}
