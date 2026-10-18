// HTML del mail de la newsletter. Lo arma el panel admin (/admin/newsletter/mail) para pegarlo en el plugin
// Newsletter de WordPress. Es HTML de mail y no de página: tablas, estilos en cada elemento y 600 px de ancho,
// porque Gmail y sobre todo Outlook no entienden buena parte del CSS de la web. Las imágenes son JPG y PNG
// (public/mail) porque Outlook de Windows no muestra WebP. Sin imports: también corre en el navegador.

export type NovedadMail = {
  titulo: string
  slug: string
  resumen: string | null
  imagen_url: string | null
  categoria: string | null
  fecha: string   // 17/10/2026
}

export type SeccionesMail = {
  queEs: boolean
  comoFunciona: boolean
  app: boolean
  figurita: boolean
  enVivo: boolean
  cierre: boolean
}

// Una cabecera subida desde el admin (la de siempre, el vestuario, está en public/mail)
export type CabeceraMail = { url: string; ancho: number; alto: number }

// Las cabeceras subidas van al bucket público de novedades, carpeta mail/: las URL tienen que durar para
// siempre porque los mails ya enviados las siguen pidiendo. El nombre lleva la medida
// (cabecera-<fecha>-1200x600.jpg) para poner el alto en el mail sin abrir la imagen
export const CABECERAS = { bucket: 'novedades', carpeta: 'mail' }
export function medidaCabecera(nombre: string) {
  const m = nombre.match(/^cabecera-\d+-(\d+)x(\d+)\.jpg$/)
  return m ? { ancho: Number(m[1]), alto: Number(m[2]) } : null
}

export type ContenidoMail = {
  vistaPrevia: string   // el renglón que muestra la bandeja de entrada al lado del asunto
  cabecera: CabeceraMail | null   // null: el vestuario
  titulo: string
  texto: string         // los párrafos van separados por una línea en blanco
  secciones: SeccionesMail
  novedades: NovedadMail[]   // la primera va grande
}

export type EnlacesMail = {
  sitio: string        // https://futboleros.com.ar
  googlePlay: string
  imagenes?: string    // de dónde salen las de public/mail: la vista previa local usa las de la PC
}

const OSCURO = '#12120e'
const PIE = '#0a0a08'
const DORADO = '#c9a84c'
const GRIS = '#f2f2f2'
const TEXTO = '#1a1a18'
const TEXTO_SUAVE = '#5a5a56'
const CLARO = '#ece6d8'          // texto sobre oscuro
const CLARO_SUAVE = '#a9a291'
const ROJO = '#e63946'

// Bebas Neue y Montserrat cargan en Apple Mail y en otros. Gmail y Outlook usan las de la compu: Bebas Neue si
// está instalada, si no Bahnschrift Condensed (Windows 10 y 11), Arial Narrow (Mac), Roboto Condensed (Android)
// o Arial. Va en negrita porque la familia Bebas Neue que se instala en una compu trae Bold y su Regular es
// fina. Impact no va: no tiene Bold y en negrita el navegador la engorda y se deforma
const TITULOS = "font-family:'Bebas Neue','Bahnschrift Condensed','Arial Narrow','Roboto Condensed',sans-serif-condensed,Arial,sans-serif;font-weight:bold;"
const CUERPO = 'Montserrat,Arial,Helvetica,sans-serif'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const espacio = (alto: number) => `<div style="height:${alto}px;line-height:${alto}px;font-size:0;">&nbsp;</div>`

const parrafos = (texto: string, estilo: string) =>
  texto.trim().split(/\n\s*\n/).filter(p => p.trim())
    .map(p => `<p style="${estilo}">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')

// border-collapse separate: con collapse (el de todas las tablas) no se redondean las esquinas
function boton(texto: string, url: string, contorno = false) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;border-collapse:separate;"><tr>`
    + `<td style="border-radius:8px;border:2px solid ${DORADO};background:${contorno ? 'transparent' : DORADO};mso-padding-alt:12px 26px;">`
    + `<a href="${url}" target="_blank" style="display:inline-block;padding:12px 26px;${TITULOS}font-size:20px;line-height:20px;letter-spacing:2px;color:${contorno ? DORADO : '#0a0a1a'};text-decoration:none;">${texto}</a>`
    + `</td></tr></table>`
}

// Botones uno al lado del otro; en el celular, si no entran, se acomodan uno abajo del otro
function botones(...lista: string[]) {
  return `<div style="text-align:center;font-size:0;">`
    + `<!--[if mso]><table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 6px;"><![endif]-->`
    + lista.map(b => `<div style="display:inline-block;margin:6px;">${b}</div>`).join('<!--[if mso]></td><td style="padding:0 6px;"><![endif]-->')
    + `<!--[if mso]></td></tr></table><![endif]-->`
    + `</div>`
}

const titulo = (texto: string, color: string) =>
  `<h2 class="titulo" style="margin:0;${TITULOS}font-size:38px;line-height:40px;letter-spacing:2px;color:${color};text-align:center;">${texto}</h2>`

const bajada = (texto: string, color: string) =>
  `<p style="margin:10px 0 0;font-family:${CUERPO};font-size:15px;line-height:23px;color:${color};text-align:center;">${texto}</p>`

const filete = (img: string) =>
  `<img src="${img}/mail/filete.png" width="96" height="36" alt="" style="display:block;margin:0 auto;border:0;width:96px;height:36px;">`

const imagen = (src: string, ancho: number, alto: number, alt: string, url?: string) => {
  const tag = `<img src="${esc(src)}" width="${ancho}" height="${alto}" alt="${esc(alt)}" style="display:block;margin:0 auto;border:0;width:100%;max-width:${ancho}px;height:auto;font-family:${CUERPO};font-size:14px;color:${TEXTO_SUAVE};">`
  return url ? `<a href="${url}" target="_blank" style="text-decoration:none;">${tag}</a>` : tag
}

const lista = (items: string[], color: string, punto: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px auto 0;">`
  + items.map(t => `<tr><td valign="top" style="width:18px;font-family:${CUERPO};font-size:10px;line-height:23px;color:${punto};">&#9679;</td>`
    + `<td style="font-family:${CUERPO};font-size:14px;line-height:23px;color:${color};">${t}</td></tr>`).join('')
  + `</table>`

const etiqueta = (texto: string, fondo: string, color: string, borde = fondo) =>
  `<span style="display:inline-block;padding:5px 12px 3px;background:${fondo};border:1px solid ${borde};border-radius:4px;${TITULOS}font-size:15px;line-height:16px;letter-spacing:3px;color:${color};">${texto}</span>`

// Las fotos de las novedades pesan hasta 2 MB: se piden achicadas al servicio de imágenes de Supabase
function fotoNovedad(url: string, ancho: number, alto: number) {
  if (!url.includes('/storage/v1/object/public/')) return url
  return `${url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')}?width=${ancho}&height=${alto}&resize=cover&quality=75`
}

// px: en el celular el relleno de los costados baja a 20 px (no va en los que tienen una foto de borde a borde)
type Bloque = { fondo: string; relleno: string; html: string; px?: false }

// ── Secciones: los textos son los de la home ──

function apertura(c: ContenidoMail, e: Required<EnlacesMail>): Bloque | null {
  if (!c.titulo.trim() && !c.texto.trim()) return null
  return {
    fondo: OSCURO,
    relleno: '36px 40px 44px',
    html: (c.titulo.trim()
      ? `<h1 class="apertura" style="margin:0;${TITULOS}font-size:48px;line-height:50px;letter-spacing:2px;color:#ffffff;text-align:center;">${esc(c.titulo.trim())}</h1>`
      : '')
      + parrafos(c.texto, `margin:16px 0 0;font-family:${CUERPO};font-size:16px;line-height:25px;color:${CLARO};text-align:center;`)
      + espacio(24)
      + botones(boton('DESCARGÁ LA APP', e.googlePlay), boton('ENTRÁ A LA WEB', e.sitio, true)),
  }
}

const FUNCIONES = [
  { icono: 'ic-cal', titulo: 'ORGANIZÁ PARTIDOS', texto: 'Programá tus partidos semanales, mandá convocatorias automáticas y manejá la lista de espera sin un solo mensaje de WhatsApp.' },
  { icono: 'ic-stats', titulo: 'SEGUÍ TUS STATS', texto: 'Goles, asistencias, partidos jugados, premios del partido. Tu historial completo, partido a partido.' },
  { icono: 'ic-contacts', titulo: 'CONECTÁ CON JUGADORES', texto: 'Buscá jugadores, mirá sus figuritas y sumá nuevos cracks a tu grupo cuando alguien no puede.' },
]

function queEs(img: string): Bloque {
  return {
    fondo: OSCURO,
    relleno: '44px 40px 48px',
    html: titulo('¿QUÉ ES FUTBOLEROS?', DORADO)
      + bajada('La plataforma para organizar tu fútbol semanal sin el quilombo de siempre.', CLARO)
      + espacio(10)
      + FUNCIONES.map(f =>
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;border-collapse:separate;background:#1c1b15;border:1px solid #4a4128;border-radius:10px;">`
        + `<tr><td width="68" valign="top" style="padding:20px 0 20px 20px;"><img src="${img}/mail/${f.icono}.png" width="48" height="48" alt="" style="display:block;border:0;width:48px;height:48px;"></td>`
        + `<td valign="top" style="padding:18px 20px 18px 16px;">`
        + `<p style="margin:0;${TITULOS}font-size:22px;line-height:24px;letter-spacing:1px;color:${DORADO};">${f.titulo}</p>`
        + `<p style="margin:6px 0 0;font-family:${CUERPO};font-size:14px;line-height:21px;color:${CLARO};">${f.texto}</p>`
        + `</td></tr></table>`).join(''),
  }
}

// Cómo es en la app: convocatoria con "Confirmo" / "No puedo" y reemplazo desde la lista de espera,
// partido en vivo, y al cerrar puntaje del 1 al 10 y premios (CierrePartido)
const PASOS = [
  { titulo: 'ARMÁ TU GRUPO', texto: 'Creá el grupo de tu fútbol e invitá a los de siempre, o buscá un grupo y pedí entrar.' },
  { titulo: 'PROGRAMÁ EL PARTIDO', texto: 'Cargalo una vez con día, hora y cancha: la convocatoria sale sola antes de cada fecha y cada uno confirma desde la app. Si alguien no puede, entra uno de la lista de espera.' },
  { titulo: 'JUGÁ Y SEGUILO EN VIVO', texto: 'Durante el partido se cargan los goles y las asistencias al instante, y todos lo siguen desde el celular.' },
  { titulo: 'PUNTAJES Y PREMIOS', texto: 'Al terminar, cada jugador recibe su puntaje del 1 al 10 y se eligen la figura, el tronco y el leñador. Todo queda en tus estadísticas.' },
]

function comoFunciona(): Bloque {
  return {
    fondo: GRIS,
    relleno: '48px 40px',
    html: titulo('CÓMO FUNCIONA', DORADO)
      + bajada('De armar el grupo al tercer tiempo, en cuatro pasos.', TEXTO_SUAVE)
      + espacio(14)
      + PASOS.map((p, i) =>
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;">`
        + `<tr><td width="52" valign="top" style="${TITULOS}font-size:48px;line-height:46px;color:${DORADO};">${i + 1}</td>`
        + `<td valign="top">`
        + `<p style="margin:0;${TITULOS}font-size:22px;line-height:24px;letter-spacing:1px;color:${TEXTO};">${p.titulo}</p>`
        + `<p style="margin:4px 0 0;font-family:${CUERPO};font-size:14px;line-height:21px;color:${TEXTO_SUAVE};">${p.texto}</p>`
        + `</td></tr></table>`).join(''),
  }
}

function app(img: string, e: Required<EnlacesMail>): Bloque {
  return {
    fondo: '#ffffff',
    relleno: '48px 40px',
    html: titulo('LA APP DEL FULBITO Y LOS DOLORES', DORADO)
      + bajada('Tu próximo partido, tus estadísticas y tu figurita, siempre a mano.', TEXTO_SUAVE)
      + espacio(20)
      + imagen(`${img}/mail/celulares.jpg`, 520, 307, 'Tres pantallas de la app: tus estadísticas, el inicio con tu próximo partido y tu figurita', e.googlePlay)
      + espacio(24)
      + botones(boton('DESCARGÁ LA APP', e.googlePlay)),
  }
}

function figurita(img: string, e: Required<EnlacesMail>): Bloque {
  return {
    fondo: OSCURO,
    relleno: '44px 40px 48px',
    html: `<div style="text-align:center;">${etiqueta('PLAN 10', DORADO, OSCURO)}</div>`
      + espacio(14)
      + titulo('TU FIGURITA, GENERADA CON&nbsp;IA', '#ffffff')
      + bajada('Subí una foto, elegí tu pose y la inteligencia artificial genera tu figurita de jugador. Un álbum digital donde cada crack tiene su carta.', CLARO_SUAVE)
      + lista(['Generada con IA a partir de tu selfie', '4 poses disponibles para elegir', 'Visible en tu perfil y en el de tu grupo'], CLARO, DORADO)
      + espacio(24)
      + imagen(`${img}/mail/figuritas.jpg`, 440, 359, 'Tres figuritas de jugadores de Futboleros')
      + espacio(24)
      + botones(boton('CONSEGUÍ TU FIGURITA', `${e.sitio}/plan10`)),
  }
}

function enVivo(img: string): Bloque {
  return {
    fondo: DORADO,
    relleno: '48px 40px',
    // Como el cartel del partido en vivo de la app: punto rojo sobre oscuro (rojo sobre dorado casi no se lee)
    html: `<div style="text-align:center;">${etiqueta(`<span style="color:${ROJO};">&#9679;</span> EN VIVO`, OSCURO, '#ffffff')}</div>`
      + espacio(14)
      + titulo('EL PARTIDO, EN TIEMPO REAL', OSCURO)
      + bajada('Mientras juegan, el administrador registra goles, asistencias y eventos al instante desde el banco. Todos los jugadores siguen el partido desde sus teléfonos.', '#2b2716')
      + lista(['Marcador actualizado en tiempo real', 'Registro de goles y asistencias por jugador', 'Premios del partido: figura, tronco y leñador', 'Historial completo generado automáticamente al finalizar'], OSCURO, OSCURO)
      + espacio(26)
      + imagen(`${img}/mail/en-vivo.jpg`, 520, 450, 'Tres pantallas del partido en la app: la timeline, el partido en vivo con el marcador y el cierre con los premios'),
  }
}

function novedades(lista: NovedadMail[], e: Required<EnlacesMail>): Bloque {
  const [principal, ...resto] = lista
  const url = (n: NovedadMail) => `${e.sitio}/novedades/${n.slug}`
  const datos = (n: NovedadMail) => [n.categoria, n.fecha].filter(Boolean).map(t => esc(t!)).join(' · ')

  const grande = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">`
    + (principal.imagen_url ? `<tr><td>${imagen(fotoNovedad(principal.imagen_url, 1040, 694), 520, 347, principal.titulo, url(principal))}</td></tr>` : '')
    + `<tr><td style="padding-top:14px;">`
    + `<p style="margin:0;font-family:${CUERPO};font-size:12px;line-height:18px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${DORADO};">${datos(principal)}</p>`
    + `<p style="margin:4px 0 0;${TITULOS}font-size:30px;line-height:32px;letter-spacing:1px;"><a href="${url(principal)}" target="_blank" style="color:${TEXTO};text-decoration:none;">${esc(principal.titulo)}</a></p>`
    + (principal.resumen ? `<p style="margin:8px 0 0;font-family:${CUERPO};font-size:15px;line-height:23px;color:${TEXTO_SUAVE};">${esc(principal.resumen)}</p>` : '')
    + `<p style="margin:10px 0 0;${TITULOS}font-size:18px;line-height:20px;letter-spacing:2px;"><a href="${url(principal)}" target="_blank" style="color:${DORADO};text-decoration:none;">LEER LA NOTA &rarr;</a></p>`
    + `</td></tr></table>`

  const chicas = resto.map(n =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;border-top:1px solid #e6e1d6;">`
    + `<tr>`
    + (n.imagen_url ? `<td class="foto-chica" width="150" valign="top" style="padding-top:22px;"><a href="${url(n)}" target="_blank"><img src="${esc(fotoNovedad(n.imagen_url, 300, 220))}" width="150" height="110" alt="${esc(n.titulo)}" style="display:block;border:0;width:150px;height:110px;border-radius:6px;"></a></td>` : '')
    + `<td valign="top" style="padding:22px 0 0 ${n.imagen_url ? 18 : 0}px;">`
    + `<p style="margin:0;font-family:${CUERPO};font-size:11px;line-height:16px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${DORADO};">${datos(n)}</p>`
    + `<p style="margin:4px 0 0;${TITULOS}font-size:22px;line-height:24px;letter-spacing:1px;"><a href="${url(n)}" target="_blank" style="color:${TEXTO};text-decoration:none;">${esc(n.titulo)}</a></p>`
    + `<p style="margin:8px 0 0;${TITULOS}font-size:16px;line-height:18px;letter-spacing:2px;"><a href="${url(n)}" target="_blank" style="color:${DORADO};text-decoration:none;">LEER &rarr;</a></p>`
    + `</td></tr></table>`).join('')

  return {
    fondo: '#ffffff',
    relleno: '48px 40px',
    html: titulo('ÚLTIMAS NOVEDADES', DORADO)
      + bajada('Actualizaciones, mejoras y noticias de Futboleros.', TEXTO_SUAVE)
      + grande + chicas
      + espacio(30)
      + botones(boton('VER TODAS LAS NOVEDADES', `${e.sitio}/novedades`)),
  }
}

function cierre(img: string, e: Required<EnlacesMail>): Bloque {
  return {
    fondo: OSCURO,
    relleno: '0 0 48px',
    px: false,
    html: imagen(`${img}/mail/cierre.jpg`, 600, 240, 'Una cancha al atardecer con la pelota y el bolso')
      + `<div class="px" style="padding:36px 40px 0;">`
      + titulo('¿LISTO PARA JUGAR?', '#ffffff')
      + bajada('Creá tu cuenta, armá tu grupo y empezá a organizar.', CLARO)
      + espacio(24)
      + botones(boton('CREAR CUENTA GRATIS', `${e.sitio}/registro`), boton('DESCARGÁ LA APP', e.googlePlay, true))
      + `</div>`,
  }
}

// Pie: la baja bien visible y los textos de la Disposición 4/2009 (retiro o bloqueo de los datos).
// {unsubscription_url} y {email_url} los reemplaza el plugin con los links de cada suscriptor
function pie(img: string, e: Required<EnlacesMail>): Bloque {
  const link = (texto: string, url: string) => `<a href="${url}" target="_blank" style="color:${DORADO};text-decoration:none;">${texto}</a>`
  const chico = `margin:12px 0 0;font-family:${CUERPO};font-size:11px;line-height:17px;color:#7d776a;text-align:center;`
  return {
    fondo: PIE,
    relleno: '36px 40px 40px',
    html: `<a href="${e.sitio}" target="_blank"><img src="${img}/mail/logo.png" width="180" height="51" alt="Futboleros" style="display:block;margin:0 auto;border:0;width:180px;height:51px;"></a>`
      + `<p style="margin:18px 0 0;font-family:${CUERPO};font-size:13px;line-height:20px;color:${CLARO_SUAVE};text-align:center;">`
      + [link('futboleros.com.ar', e.sitio), link('Contacto', `${e.sitio}/contacto`), link('Términos', `${e.sitio}/terminos`), link('Privacidad', `${e.sitio}/privacidad`)].join(' &nbsp;·&nbsp; ')
      + `</p>`
      + `<p style="margin:22px 0 0;font-family:${CUERPO};font-size:13px;line-height:20px;color:${CLARO};text-align:center;">`
      + `Recibís este mail porque aceptaste recibir las novedades de Futboleros. Podés pedir en cualquier momento el retiro o bloqueo, total o parcial, de tus datos: `
      + `${link('darte de baja acá', '{unsubscription_url}')} o escribir a ${link('contacto@futboleros.com.ar', 'mailto:contacto@futboleros.com.ar')}.</p>`
      + `<p style="${chico}">Ley 25.326, art. 27, inc. 3: «El titular podrá en cualquier momento solicitar el retiro o bloqueo de su nombre de los bancos de datos a los que se refiere el presente artículo».</p>`
      + `<p style="${chico}">Decreto 1558/01, anexo I, art. 27, tercer párrafo: «En toda comunicación con fines de publicidad que se realice por correo, teléfono, correo electrónico, Internet u otro medio a distancia a conocer, se deberá indicar, en forma expresa y destacada, la posibilidad del titular del dato de solicitar el retiro o bloqueo, total o parcial, de su nombre de la base de datos. A pedido del interesado, se deberá informar el nombre del responsable o usuario del banco de datos que proveyó la información».</p>`
      + `<p style="${chico}">La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley N.° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>`
      + `<p style="${chico}">${link('Ver este mail en el navegador', '{email_url}')}</p>`,
  }
}

export function armarMail(c: ContenidoMail, enlaces: EnlacesMail): string {
  const e = { ...enlaces, imagenes: enlaces.imagenes ?? enlaces.sitio }
  const img = e.imagenes

  // Se ve a 600 de ancho; el alto sale de la proporción de la imagen subida
  const cabecera = c.cabecera
    ? imagen(c.cabecera.url, 600, Math.round((600 * c.cabecera.alto) / c.cabecera.ancho), c.titulo.trim() || 'Futboleros', e.sitio)
    : imagen(`${img}/mail/cabecera.jpg`, 600, 300, 'Futboleros: la app del fulbito y los dolores', e.sitio)
  const s = c.secciones

  const bloques = [
    apertura(c, e),
    s.queEs && queEs(img),
    s.comoFunciona && comoFunciona(),
    s.app && app(img, e),
    s.figurita && figurita(img, e),
    s.enVivo && enVivo(img),
    c.novedades.length > 0 && novedades(c.novedades, e),
    s.cierre && cierre(img, e),
    pie(img, e),
  ].filter((b): b is Bloque => !!b)

  // Entre dos bloques oscuros seguidos va el filete, como entre las secciones de la home
  const filas = bloques.map((b, i) =>
    (i > 0 && b.fondo === OSCURO && bloques[i - 1].fondo === OSCURO
      ? `<tr><td style="background:${OSCURO};padding:0 40px;">${filete(img)}</td></tr>`
      : '')
    + `<tr><td${b.px === false ? '' : ' class="px"'} style="background:${b.fondo};padding:${b.relleno};">${b.html}</td></tr>`).join('\n')

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Futboleros</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  /* La Bebas Neue de Google tiene un solo grosor: con la negrita pedida, que no la engorde de mentira */
  * { font-synthesis: none; }
  /* Celulares (hasta 480 px; más ancho, la tabla de 600 se angosta sola) */
  @media only screen and (max-width: 480px) {
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .titulo { font-size: 32px !important; line-height: 34px !important; }
    .apertura { font-size: 40px !important; line-height: 42px !important; }
    .foto-chica, .foto-chica img { width: 110px !important; height: 81px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(c.vistaPrevia.trim())}${'&#847;&zwnj;&nbsp;'.repeat(80)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="background:#ffffff;">
<tr><td align="center" style="padding:0;">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;">
<tr><td style="background:${OSCURO};padding:0;">${cabecera}</td></tr>
${filas}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`
}
