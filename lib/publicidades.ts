// Hoy en hora argentina, en el formato de las fechas de las publicidades: "2026-10-18"
export const hoyEnArgentina = () =>
  new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })

// Clics cada 100 vistas, con un decimal: "1,5 %". Sin vistas, una raya
export const porcentajeClics = (clics: number, vistas: number) =>
  vistas > 0
    ? `${((clics / vistas) * 100).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
    : '—'
