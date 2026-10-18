'use server'

import sharp from 'sharp'
import { clienteAdmin } from '@/lib/supabase/admin'
import { IMAGENES_MAIL, type ImagenMail } from '@/lib/newsletter-mail'

// Imagen subida desde "Armar el mail", para la cabecera o el bloque libre. Se guarda en JPG de hasta 1200 px de
// ancho (en el mail se ve a 600: nítida en el celular), como mucho cuadrada (si es más alta se recorta al
// centro) y liviana: Outlook de Windows no muestra WebP y una foto en PNG pesa demasiado para un mail
export async function subirImagenMail(formData: FormData): Promise<ImagenMail> {
  const archivo = formData.get('file') as File | null
  if (!archivo || !archivo.size) throw new Error('Falta la imagen')
  const supabase = await clienteAdmin()

  // rotate() endereza las fotos del celular según su orientación
  const base = await sharp(Buffer.from(await archivo.arrayBuffer()))
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true })
  const ancho = base.info.width
  const { data, info } = await sharp(base.data)
    .resize(ancho, Math.min(base.info.height, ancho), { fit: 'cover' })
    .flatten({ background: '#12120e' })   // las PNG con transparencia, sobre el oscuro del mail
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toBuffer({ resolveWithObject: true })

  const ruta = `${IMAGENES_MAIL.carpeta}/imagen-${Date.now()}-${info.width}x${info.height}.jpg`
  const { error } = await supabase.storage
    .from(IMAGENES_MAIL.bucket)
    .upload(ruta, data, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) throw error
  const { data: publica } = supabase.storage.from(IMAGENES_MAIL.bucket).getPublicUrl(ruta)
  return { url: publica.publicUrl, ancho: info.width, alto: info.height }
}
