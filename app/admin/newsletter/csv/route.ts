import { NextResponse, type NextRequest } from 'next/server'
import { clienteAdmin } from '@/lib/supabase/admin'

type Fila = { email: string; nombre: string; suscripto: boolean; fecha: string; cuenta_borrada: boolean }

const ZONA = 'America/Argentina/Buenos_Aires'

// "Marcos Díaz Pérez" → ["Marcos", "Díaz Pérez"]: el plugin separa nombre y apellido
function partirNombre(nombre: string): [string, string] {
  const [primero = '', ...resto] = nombre.trim().split(/\s+/)
  return [primero, resto.join(' ')]
}

// Comillas cuando hace falta; un nombre que arranca con = + - @ no se ejecuta como fórmula en Excel
function celda(valor: string, texto = false) {
  const v = texto && /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

// CSV de la newsletter para el plugin de WordPress (supabase/newsletter.sql). El layout de /admin no
// protege las rutas: el chequeo de admin lo hace clienteAdmin
export async function GET(request: NextRequest) {
  let supabase
  try {
    supabase = await clienteAdmin()
  } catch {
    return new NextResponse('No autorizado', { status: 403 })
  }

  const lista = request.nextUrl.searchParams.get('lista') === 'bajas' ? 'bajas' : 'suscriptos'
  const { data, error } = await supabase.rpc('newsletter_lista')
  if (error) return new NextResponse('No se pudo leer la lista. ¿Ya corriste supabase/newsletter.sql?', { status: 500 })

  const filas = (data ?? []) as Fila[]
  const lineas = lista === 'suscriptos'
    ? [
        'email,nombre,apellido',
        ...filas.filter(f => f.suscripto).map(f => {
          const [nombre, apellido] = partirNombre(f.nombre)
          return [celda(f.email), celda(nombre, true), celda(apellido, true)].join(',')
        }),
      ]
    : [
        'email,fecha,motivo',
        ...filas.filter(f => !f.suscripto).map(f => [
          celda(f.email),
          new Date(f.fecha).toLocaleString('sv-SE', { timeZone: ZONA }).slice(0, 16),   // 2026-10-15 14:30
          f.cuenta_borrada ? 'borró la cuenta' : 'se dio de baja',
        ].join(',')),
      ]

  const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: ZONA })
  return new NextResponse(lineas.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="newsletter-${lista}-${hoy}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
