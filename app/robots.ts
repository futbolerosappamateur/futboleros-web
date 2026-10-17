import type { MetadataRoute } from 'next'
import { SITE_URL, SITIO_EN_PRUEBA } from '@/lib/sitio'

// /robots.txt: los buscadores recorren todo menos el panel y las páginas de la cuenta.
// /api queda abierto: de ahí salen las figuritas que WhatsApp y X muestran al compartir un perfil.
// Con la web en prueba no recorren nada
export default function robots(): MetadataRoute.Robots {
  if (SITIO_EN_PRUEBA) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/auth/', '/chat', '/editar-perfil', '/pagar', '/pago/', '/login', '/registro', '/recuperar-contrasena', '/nueva-contrasena'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
