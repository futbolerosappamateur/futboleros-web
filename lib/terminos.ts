// Versión vigente de los Términos y Condiciones y de la Política de Privacidad (la "Última actualización"
// de /terminos y /privacidad). Si cambian los textos, subirla acá y en utils/terminos.js de la app.
export const TERMINOS_VERSION = '2026-10'

// Desde cuándo una cuenta sin los textos aceptados tiene que aceptarlos antes de seguir: las que se crean con
// Google (las de email los aceptan en el registro). A las cuentas de antes todavía no se les pide; se les va a
// pedir cuando estén los textos definitivos. Mismo valor en utils/terminos.js de la app.
const TERMINOS_DESDE = Date.parse('2026-10-26T03:00:00Z')   // 26/10/2026 a las 0 de Argentina

// cuentaCreada: user.created_at. versionAceptada: la del perfil o, si todavía no hay perfil, la del registro
export function necesitaAceptarTerminos(cuentaCreada: string | undefined, versionAceptada: string | null | undefined) {
  if (versionAceptada) return false
  const creada = cuentaCreada ? Date.parse(cuentaCreada) : NaN
  return creada >= TERMINOS_DESDE
}
