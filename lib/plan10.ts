// Precios del Plan 10 en pesos (los usa el servidor para cobrar y la web para mostrarlos).
// El anual es 12 meses con 30% de descuento.
export const PRECIOS = { mensual: 2900, anual: 24360 } as const

export type TipoPlan = keyof typeof PRECIOS

export const esTipoPlan = (t: unknown): t is TipoPlan => t === 'mensual' || t === 'anual'

export const AHORRO_ANUAL = PRECIOS.mensual * 12 - PRECIOS.anual
export const DESCUENTO_ANUAL = Math.round((AHORRO_ANUAL / (PRECIOS.mensual * 12)) * 100)

// $24.360: a mano y no con toLocaleString, para que el servidor y el navegador escriban lo mismo
export const pesos = (n: number) => `$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
