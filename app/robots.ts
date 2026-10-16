import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/sitio'

// /robots.txt: los buscadores recorren todo menos el panel y las páginas de la cuenta.
// /api queda abierto: de ahí salen las figuritas que WhatsApp y X muestran al compartir un perfil
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/auth/', '/chat', '/editar-perfil', '/pagar', '/pago/', '/login', '/registro', '/recuperar-contrasena', '/nueva-contrasena'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
