// Dominio publicado de la web: para links absolutos (compartir en redes, vista previa de los links)
export const SITE_URL = 'https://futboleros.com.ar'

// Web en prueba (NEXT_PUBLIC_SITIO_EN_PRUEBA=1 al compilar): está en el dominio pero no se lanzó, así que los
// buscadores no la indexan. Para lanzarla se compila sin la variable
export const SITIO_EN_PRUEBA = process.env.NEXT_PUBLIC_SITIO_EN_PRUEBA === '1'

// Imagen que se ve al compartir un link de la web (1200×630), salvo las páginas que traen la suya
export const OG_IMAGEN = { url: '/og-futboleros.jpg', width: 1200, height: 630, alt: 'Futboleros · El fútbol amateur, organizado' }

// La app en Google Play (paquete com.futboleros.app). Hasta que se publique, la página da "No se ha encontrado"
export const URL_GOOGLE_PLAY = 'https://play.google.com/store/apps/details?id=com.futboleros.app'
