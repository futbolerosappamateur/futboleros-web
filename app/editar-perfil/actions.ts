'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { MAX_CARACTERISTICAS, REDES, TALLES } from '@/lib/perfil-opciones'

export type DatosPerfil = {
  nombre: string
  apodo: string
  username: string
  fechaNacimiento: string   // AAAA-MM-DD
  altura: string
  peso: string
  whatsapp: string
  sexo: string
  pais: string
  hinchaDe: string
  idolo: string
  estilo: string
  caracteristicas: string[]
  redes: Record<string, string>
  talleRemera: string
  tallePantalon: string
  talleCalzado: string
  nombreCamiseta: string
  numeroCamiseta: string
  domicilio: string
}

export type ResultadoGuardar = { error: string; campo?: keyof DatosPerfil } | { ruta: string }

type Supabase = Awaited<ReturnType<typeof createClient>>

// Actualiza la fila del usuario o la crea si todavía no existe (con los mismos valores iniciales que la app)
async function guardarFila(supabase: Supabase, userId: string, fila: Record<string, unknown>) {
  const { data: existe } = await supabase.from('perfiles').select('id').eq('id', userId).maybeSingle()
  const { data, error } = existe
    ? await supabase.from('perfiles').update(fila).eq('id', userId).select('id')
    : await supabase.from('perfiles')
        .insert({ id: userId, nombre: '', siguiendo: [], disponible_invitaciones: true, ...fila })
        .select('id')
  return { error, guardado: !!data?.length }
}

function revalidarPerfiles() {
  revalidatePath('/jugadores')
  revalidatePath('/jugadores/[slug]', 'page')
}

// Mismas validaciones que la app (screens/EditarPerfil.js), en el orden en que aparecen los campos
export async function guardarPerfil(d: DatosPerfil): Promise<ResultadoGuardar> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Volvé a ingresar.' }

  const nombre = d.nombre.trim()
  if (!nombre) return { error: 'Ingresá tu nombre completo.', campo: 'nombre' }

  const username = d.username.trim().toLowerCase() || null
  if (username) {
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return { error: 'El usuario solo puede tener letras minúsculas, números y guión bajo, entre 3 y 30 caracteres.', campo: 'username' }
    }
    const { data: ocupado } = await supabase
      .from('perfiles').select('id').eq('username', username).neq('id', user.id).maybeSingle()
    if (ocupado) return { error: 'Ese nombre de usuario ya está en uso, elegí otro.', campo: 'username' }
  }

  const fecha = d.fechaNacimiento.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!fecha) return { error: 'Ingresá tu fecha de nacimiento.', campo: 'fechaNacimiento' }
  const [anio, mes, dia] = fecha.slice(1).map(Number)
  const fechaObj = new Date(anio, mes - 1, dia)
  if (
    anio < 1920 || anio > new Date().getFullYear() - 5 ||
    fechaObj.getFullYear() !== anio || fechaObj.getMonth() !== mes - 1 || fechaObj.getDate() !== dia
  ) {
    return { error: 'Ingresá una fecha de nacimiento real.', campo: 'fechaNacimiento' }
  }

  const altura = parseInt(d.altura, 10)
  if (isNaN(altura) || altura < 100 || altura > 250) {
    return { error: 'Ingresá una altura válida, entre 100 y 250 cm.', campo: 'altura' }
  }

  let peso: number | null = null
  if (d.peso.trim()) {
    peso = parseInt(d.peso, 10)
    if (isNaN(peso) || peso < 30 || peso > 300) {
      return { error: 'Ingresá un peso válido, entre 30 y 300 kg.', campo: 'peso' }
    }
  }

  const whatsapp = d.whatsapp.trim()
  if (whatsapp) {
    const soloNumeros = whatsapp.replace(/[\s\-+()]/g, '')
    if (!/^\d{7,15}$/.test(soloNumeros)) {
      return { error: 'Ingresá un número de WhatsApp válido. Ejemplo: +54 9 11 1234 5678', campo: 'whatsapp' }
    }
  }

  if (!d.sexo) return { error: 'Seleccioná tu género.', campo: 'sexo' }
  if (!d.hinchaDe.trim()) return { error: 'Elegí de qué club sos hincha.', campo: 'hinchaDe' }
  if (!d.estilo.trim()) return { error: 'Elegí cómo jugás.', campo: 'estilo' }

  const numeroCamiseta = d.numeroCamiseta.trim()
  if (numeroCamiseta && !/^\d{1,3}$/.test(numeroCamiseta)) {
    return { error: 'El número de camiseta tiene que ser un número.', campo: 'numeroCamiseta' }
  }

  const redes = Object.fromEntries(
    REDES.map(r => [r.key, (d.redes[r.key] ?? '').trim()]).filter(([, v]) => v)
  )

  const { error, guardado } = await guardarFila(supabase, user.id, {
    nombre,
    apodo: d.apodo.trim() || null,
    username,
    fecha_nacimiento: d.fechaNacimiento,
    altura,
    peso,
    whatsapp: whatsapp || null,
    sexo: d.sexo,
    pais: d.pais || 'AR',
    hincha_de: d.hinchaDe.trim(),
    idolo: d.idolo.trim() || null,
    estilo_juego: [d.estilo.trim()],
    caracteristicas: d.caracteristicas.slice(0, MAX_CARACTERISTICAS),
    redes,
    talle_remera: TALLES.includes(d.talleRemera) ? d.talleRemera : null,
    talle_pantalon: TALLES.includes(d.tallePantalon) ? d.tallePantalon : null,
    talle_calzado: d.talleCalzado.trim().slice(0, 3) || null,
    nombre_camiseta: d.nombreCamiseta.trim().slice(0, 20) || null,
    numero_camiseta: numeroCamiseta ? parseInt(numeroCamiseta, 10) : null,
    domicilio: d.domicilio.trim().slice(0, 150) || null,
    actualizado_en: new Date().toISOString(),
  })

  if (error?.code === '23505') return { error: 'Ese nombre de usuario ya está en uso, elegí otro.', campo: 'username' }
  if (error || !guardado) return { error: 'No se pudo guardar el perfil. Probá de nuevo.' }

  revalidarPerfiles()
  return { ruta: `/jugadores/${username ?? user.id}` }
}

// La foto se sube desde el navegador al bucket "avatares" (como la app); acá solo se guarda la URL
export async function guardarFoto(url: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Volvé a ingresar.' }

  const propia = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatares/perfil_${user.id}_`
  if (!url.startsWith(propia)) return { error: 'No se pudo guardar la foto.' }

  const { error, guardado } = await guardarFila(supabase, user.id, {
    avatar_url: url,
    actualizado_en: new Date().toISOString(),
  })
  if (error || !guardado) return { error: 'No se pudo guardar la foto. Probá de nuevo.' }

  revalidarPerfiles()
  return {}
}

// El fondo del encabezado va al mismo bucket (perfil_<id>_fondo_...); null vuelve al predeterminado
export async function guardarFondo(url: string | null): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión expiró. Volvé a ingresar.' }

  const propio = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatares/perfil_${user.id}_fondo_`
  if (url !== null && !url.startsWith(propio)) return { error: 'No se pudo guardar el fondo.' }

  const { error, guardado } = await guardarFila(supabase, user.id, {
    fondo_url: url,
    actualizado_en: new Date().toISOString(),
  })
  if (error || !guardado) return { error: 'No se pudo guardar el fondo. Probá de nuevo.' }

  revalidarPerfiles()
  return {}
}
