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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const supabase = createServiceClient()
    const [{ data: p }, marcoSrc] = await Promise.all([
      supabase
        .from('perfiles')
        .select('nombre, nombre_figurita, apodo, imagen_ia, pais, fecha_nacimiento, altura, estilo_juego, descripcion_propia')
        .eq('id', id)
        .maybeSingle(),
      getMarcoSrc(),
    ])

    if (!p?.imagen_ia) {
      return new Response('Not found', { status: 404 })
    }

    const rawNombre = (p.nombre_figurita as string)?.trim() || (p.nombre as string)?.split(' ')[0] || 'Nombre'
    const nombre    = rawNombre.charAt(0).toUpperCase() + rawNombre.slice(1).toLowerCase()
    const apodo     = p.apodo ? String(p.apodo) : null
    const posicion  = ((p.estilo_juego as string[])?.[0] ?? '').replace(/[^a-zA-Z\s]/g, '').trim().toUpperCase().slice(0, 12) || '-'
    const edad      = p.fecha_nacimiento ? calcEdad(String(p.fecha_nacimiento)) : '-'
    const alturaRaw = p.altura as number | null
    const alturaStr = alturaRaw
      ? `${Math.floor(alturaRaw / 100)},${String(alturaRaw % 100).padStart(2, '0')}`
      : '-'
    const quote    = ((p.descripcion_propia as string) || '').slice(0, 25)
    const paisCode = ((p.pais as string) || 'ar').toLowerCase()

    const imageResponse = new ImageResponse(
      (
        <div style={{ width: W, height: H, display: 'flex', position: 'relative', background: '#022232' }}>

          {/* Player photo */}
          <div style={{ position: 'absolute', left: 0, top: 143, width: W, height: 630, display: 'flex', overflow: 'hidden' }}>
            <img
              src={p.imagen_ia as string}
              width={Math.round(W * 1.35)}
              height={Math.round(W * 2.025)}
              style={{ position: 'absolute', top: -40, left: -Math.round(W * 0.175) }}
            />
          </div>

          {/* Country flag — rectangular, flush right */}
          <img
            src={`https://flagcdn.com/w80/${paisCode}.png`}
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
    )

    // Eagerly buffer the render — surfaces any Satori errors here so we can catch them
    const buf = await imageResponse.arrayBuffer()
    return new Response(buf, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
    console.error('[figurita]', msg)
    return new Response(msg, { status: 500, headers: { 'Content-Type': 'text/plain' } })
  }
}
