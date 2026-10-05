import { ImageResponse } from 'next/og'
import { createServiceClient } from '@/lib/supabase/service'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const W = 629
const H = 907

function readFont(filename: string): ArrayBuffer {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', filename))
  const ab = new ArrayBuffer(buf.byteLength)
  new Uint8Array(ab).set(buf)
  return ab
}

function readAssetPng(filename: string): string {
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', filename))
  return `data:image/png;base64,${buf.toString('base64')}`
}

function calcEdad(fechaNac: string): string {
  const [y, m, d] = fechaNac.split('-').map(Number)
  const hoy = new Date()
  let e = hoy.getFullYear() - y
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) e--
  return String(e)
}

// Fonts — local TTF files (no variable fonts: Satori's fontkit can't parse fvar table)
const limelightData = readFont('Limelight-Regular.ttf')
const bebasData     = readFont('BebasNeue-Regular.ttf')
const lobsterData   = readFont('Lobster-Regular.ttf')

// Stat icons (PNG — safe for resvg)
const iconEdad     = readAssetPng('icon-edad.png')
const iconAltura   = readAssetPng('icon-altura.png')
const iconPosicion = readAssetPng('icon-posicion.png')

// Marco: WebP → PNG once, cached
let marcoPngSrc: string | null = null
async function getMarcoSrc(): Promise<string> {
  if (marcoPngSrc !== null) return marcoPngSrc
  const sharp   = (await import('sharp')).default
  const webpBuf = fs.readFileSync(path.join(process.cwd(), 'public', 'marco-figurita.webp'))
  const pngBuf  = await sharp(webpBuf).png().toBuffer()
  marcoPngSrc   = `data:image/png;base64,${pngBuf.toString('base64')}`
  return marcoPngSrc
}

const CAMPOS = 'nombre, nombre_figurita, apodo, imagen_ia, pais, fecha_nacimiento, altura, estilo_juego, descripcion_propia'

// La figurita actual sale del perfil; una del historial (?f=), de los datos que tenía el perfil cuando se generó
async function datosFigurita(supabase: ReturnType<typeof createServiceClient>, id: string, figuritaId: string | null) {
  if (!figuritaId) {
    const { data } = await supabase.from('perfiles').select(CAMPOS).eq('id', id).maybeSingle()
    return data
  }
  const { data: f } = await supabase
    .from('figuritas_generadas').select('url, snapshot').eq('id', figuritaId).eq('user_id', id).maybeSingle()
  if (!f) return null
  if (f.snapshot) return { ...f.snapshot, imagen_ia: f.url }
  const { data } = await supabase.from('perfiles').select(CAMPOS).eq('id', id).maybeSingle()
  return data && { ...data, imagen_ia: f.url }
}

// Satori tarda segundos por figurita: lo ya dibujado queda en memoria (WebP a tamaño completo).
// Miniatura y versión grande salen del mismo dibujo, y pedidos simultáneos esperan el mismo.
const CACHE_MAX = 80
const dibujadas = new Map<string, Promise<Buffer>>()

function webpCompleta(clave: string, dibujar: () => Promise<Buffer>) {
  const enCache = dibujadas.get(clave)
  if (enCache) {
    dibujadas.delete(clave)
    dibujadas.set(clave, enCache)   // queda como la más reciente
    return enCache
  }
  const nueva = dibujar().then(async png => (await import('sharp')).default(png).webp({ quality: 90 }).toBuffer())
  nueva.catch(() => dibujadas.delete(clave))   // si falla, que se pueda reintentar
  dibujadas.set(clave, nueva)
  if (dibujadas.size > CACHE_MAX) dibujadas.delete(dibujadas.keys().next().value!)
  return nueva
}

// La foto IA es una PNG de ~2,5 MB (1024×1536) y era lo más lento del dibujo: se baja una vez,
// se recorta a la ventana que se ve en la tarjeta (mismo escalado y posición que antes) y va a Satori como JPEG chico
const FOTO = { ancho: Math.round(W * 1.35), alto: Math.round(W * 2.025), x: Math.round(W * 0.175), y: 40, ventanaAlto: 630 }
const fotos = new Map<string, Promise<string>>()

function fotoRecortada(url: string) {
  const enCache = fotos.get(url)
  if (enCache) return enCache
  const nueva = (async () => {
    const r = await fetch(url)
    if (!r.ok) throw new Error(`foto ${r.status}`)
    const sharp = (await import('sharp')).default
    const jpg = await sharp(Buffer.from(await r.arrayBuffer()))
      .resize(FOTO.ancho, FOTO.alto, { fit: 'fill' })
      .extract({ left: FOTO.x, top: FOTO.y, width: W, height: FOTO.ventanaAlto })
      .jpeg({ quality: 88 })
      .toBuffer()
    return `data:image/jpeg;base64,${jpg.toString('base64')}`
  })()
  nueva.catch(() => fotos.delete(url))
  fotos.set(url, nueva)
  if (fotos.size > 100) fotos.delete(fotos.keys().next().value!)
  return nueva
}

// La bandera también se baja una vez por país (antes Satori la pedía a flagcdn en cada dibujo)
const banderas = new Map<string, Promise<string>>()

function bandera(codigo: string) {
  const url = `https://flagcdn.com/w80/${codigo}.png`
  let b = banderas.get(codigo)
  if (!b) {
    b = fetch(url)
      .then(async r => {
        if (!r.ok) throw new Error(`bandera ${r.status}`)
        return `data:image/png;base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`
      })
      .catch(() => { banderas.delete(codigo); return url })   // si falla, que Satori la pida como antes
    banderas.set(codigo, b)
  }
  return b
}

async function achicar(webp: Buffer, ancho: number) {
  const sharp = (await import('sharp')).default
  return sharp(webp).resize({ width: Math.max(ancho, 100) }).webp({ quality: 85 }).toBuffer()
}

// ?f=<id de figuritas_generadas>: una figurita del historial
// ?ancho=<px>: WebP achicado (para mostrar en la web; el PNG completo pesa más de 1 MB)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const busqueda = new URL(req.url).searchParams
  const ancho = Number(busqueda.get('ancho')) || null

  try {
    const supabase = createServiceClient()
    const [p, marcoSrc] = await Promise.all([
      datosFigurita(supabase, id, busqueda.get('f')),
      getMarcoSrc(),
    ])

    if (!p?.imagen_ia) {
      return new Response('Not found', { status: 404 })
    }

    const rawNombre = (p.nombre_figurita as string)?.trim() || (p.nombre as string)?.split(' ')[0] || 'Nombre'
    const nombre    = rawNombre.charAt(0).toUpperCase() + rawNombre.slice(1).toLowerCase()
    const apodo     = p.apodo ? String(p.apodo) : null
    // \p{L} y no a-zA-Z: si no, "Mágico" queda "MGICO"
    const posicion  = ((p.estilo_juego as string[])?.[0] ?? '').replace(/[^\p{L}\s]/gu, '').trim().toUpperCase().slice(0, 12) || '-'
    const edad      = p.fecha_nacimiento ? calcEdad(String(p.fecha_nacimiento)) : '-'
    const alturaRaw = p.altura as number | null
    const alturaStr = alturaRaw
      ? `${Math.floor(alturaRaw / 100)},${String(alturaRaw % 100).padStart(2, '0')}`
      : '-'
    const quote    = ((p.descripcion_propia as string) || '').slice(0, 25)
    const paisCode = ((p.pais as string) || 'ar').toLowerCase()

    // Si falla el recorte, Satori baja la foto original como antes
    const dibujar = async () => {
      const [foto, flag] = await Promise.all([
        fotoRecortada(p.imagen_ia as string).catch(() => null),
        bandera(paisCode),
      ])
      return Buffer.from(await new ImageResponse(
      (
        // Esquinas redondeadas como la tarjeta de la app (borderRadius 54 sobre 629)
        <div style={{ width: W, height: H, display: 'flex', position: 'relative', background: '#022232', borderRadius: 54, overflow: 'hidden' }}>

          {/* Player photo */}
          <div style={{ position: 'absolute', left: 0, top: 143, width: W, height: 630, display: 'flex', overflow: 'hidden' }}>
            {foto ? (
              <img src={foto} width={W} height={FOTO.ventanaAlto} style={{ position: 'absolute', top: 0, left: 0 }} />
            ) : (
              <img
                src={p.imagen_ia as string}
                width={FOTO.ancho}
                height={FOTO.alto}
                style={{ position: 'absolute', top: -FOTO.y, left: -FOTO.x }}
              />
            )}
          </div>

          {/* Country flag — rectangular, flush right */}
          <img
            src={flag}
            width={88} height={59}
            style={{ position: 'absolute', left: 515, top: 636 }}
          />

          {/* Marco PNG */}
          <img src={marcoSrc} width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }} />

          {/* Nombre + Apodo */}
          <div style={{ position: 'absolute', left: 12, right: 12, top: 82, display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
            <div style={{ fontFamily: 'Limelight', fontSize: 58, color: '#F8D8A7', lineHeight: 1, display: 'flex', flexShrink: 1 }}>
              {nombre}
            </div>
            {apodo !== null && (
              <div style={{ fontFamily: 'Lobster', fontSize: 32, color: '#F8D8A7', lineHeight: 1, marginBottom: 8, display: 'flex', flexShrink: 0 }}>
                {apodo}
              </div>
            )}
          </div>

          {/* EDAD */}
          <img src={iconEdad} width={46} height={46} style={{ position: 'absolute', left: 202, top: 788 }} />
          <div style={{ position: 'absolute', left: 254, top: 782, display: 'flex', fontFamily: 'Bebas Neue', fontSize: 19, color: '#1a0f03', letterSpacing: 0.5, lineHeight: 1 }}>EDAD</div>
          <div style={{ position: 'absolute', left: 252, top: 795, display: 'flex', fontFamily: 'Bebas Neue', fontSize: 42, color: '#1a0f03', lineHeight: 1 }}>{edad}</div>

          {/* ALTURA */}
          <img src={iconAltura} width={46} height={46} style={{ position: 'absolute', left: 300, top: 790 }} />
          <div style={{ position: 'absolute', left: 352, top: 784, display: 'flex', fontFamily: 'Bebas Neue', fontSize: 19, color: '#1a0f03', letterSpacing: 0.5, lineHeight: 1 }}>ALTURA</div>
          <div style={{ position: 'absolute', left: 350, top: 797, display: 'flex', fontFamily: 'Bebas Neue', fontSize: 42, color: '#1a0f03', lineHeight: 1 }}>{alturaStr}</div>

          {/* COMO JUEGA */}
          <img src={iconPosicion} width={38} height={42} style={{ position: 'absolute', left: 428, top: 791 }} />
          <div style={{ position: 'absolute', left: 472, top: 792, display: 'flex', fontFamily: 'Bebas Neue', fontSize: 19, color: '#1a0f03', letterSpacing: 0.5, lineHeight: 1 }}>COMO JUEGA</div>
          <div style={{ position: 'absolute', left: 472, top: 810, display: 'flex', fontFamily: 'Bebas Neue', fontSize: 24, color: '#1a0f03', lineHeight: 1 }}>{posicion}</div>

          {/* Frase personalizada */}
          {quote ? (
            <div style={{ position: 'absolute', left: 0, top: 841, width: W, display: 'flex', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'Lobster', fontSize: 22, color: '#1a0f03', display: 'flex' }}>{quote}</div>
            </div>
          ) : null}

        </div>
      ),
      {
        width: W,
        height: H,
        fonts: [
          { name: 'Limelight', data: limelightData, weight: 400, style: 'normal' },
          { name: 'Bebas Neue', data: bebasData,   weight: 400, style: 'normal' },
          { name: 'Lobster',   data: lobsterData,  weight: 400, style: 'normal' },
        ],
      }
      ).arrayBuffer())
    }

    // Las del historial no cambian: el navegador las puede guardar una semana
    const cache = busqueda.get('f') ? 'public, max-age=604800, s-maxage=604800' : 'public, max-age=3600, s-maxage=3600'

    if (ancho) {
      const completa = await webpCompleta(JSON.stringify([id, busqueda.get('f'), p, edad]), dibujar)
      const salida = ancho >= W ? completa : await achicar(completa, ancho)
      return new Response(new Uint8Array(salida), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': cache } })
    }

    // Eagerly buffer the render — surfaces any Satori errors here so we can catch them
    const png = await dibujar()
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': cache,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
    console.error('[figurita]', msg)
    return new Response(msg, { status: 500, headers: { 'Content-Type': 'text/plain' } })
  }
}
