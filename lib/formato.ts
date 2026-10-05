// Rating con un decimal, salvo el 10 (el máximo), que va sin decimales: "10" y no "10.0".
// Se redondea primero para que un 9.96 tampoco quede como "10.0". Igual que en la app (utils/formato.js).
export function formatoRating(valor: number | string) {
  const r = Math.round(Number(valor) * 10) / 10
  return r >= 10 ? '10' : r.toFixed(1)
}
