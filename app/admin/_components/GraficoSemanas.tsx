import styles from './GraficoSemanas.module.css'

export type Semana = { semana: string; valor: number }   // semana: el lunes, "2026-10-12"

const ALTO = 140   // px del área de las barras

// "2026-10-12" → "12/10"
const corta = (semana: string) => `${semana.slice(8, 10)}/${semana.slice(5, 7)}`

// Un tope redondo para la escala (1, 2, 5, 10, 20, 50…), así la línea de arriba lleva un número limpio
function tope(maximo: number) {
  if (maximo <= 1) return 1
  const potencia = 10 ** Math.floor(Math.log10(maximo))
  return [1, 2, 5, 10].map(m => m * potencia).find(v => v >= maximo)!
}

// Columnas de una sola serie: sin leyenda (el título dice qué es), el número arriba solo en la semana actual
// y en la más alta, y el resto al pasar el mouse o con el teclado, y en la tabla de abajo
export default function GraficoSemanas({ titulo, datos, unidad }: {
  titulo: string
  datos: Semana[]
  unidad: [singular: string, plural: string]
}) {
  const maximo = Math.max(0, ...datos.map(d => d.valor))
  const escala = tope(maximo)
  const iMaximo = datos.findIndex(d => d.valor === maximo)
  const cantidad = (v: number) => `${v} ${v === 1 ? unidad[0] : unidad[1]}`

  return (
    <figure className={styles.grafico}>
      <figcaption className={styles.titulo}>
        {titulo}
        <span>Por semana, de lunes a domingo</span>
      </figcaption>

      <div className={styles.plano}>
        <div className={styles.eje} style={{ height: ALTO }} aria-hidden="true">
          <span className={styles.tope}>{escala}</span>
          <span className={styles.cero}>0</span>
        </div>
        <div className={styles.barras} style={{ height: ALTO }}>
          {datos.map((d, i) => {
            const actual = i === datos.length - 1
            const lado = i < 2 ? styles.tipIzquierda : i > datos.length - 3 ? styles.tipDerecha : ''
            return (
              <div key={d.semana} className={styles.columna} tabIndex={0} aria-label={`Semana del ${corta(d.semana)}: ${cantidad(d.valor)}`}>
                <div className={styles.barra} style={{ height: (d.valor / escala) * ALTO }}>
                  {d.valor > 0 && (actual || i === iMaximo) && <span className={styles.valor}>{d.valor}</span>}
                </div>
                <span className={`${styles.tip} ${lado}`}>
                  Semana del {corta(d.semana)}{actual ? ' (esta)' : ''}: {cantidad(d.valor)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className={styles.fechas} style={{ gridTemplateColumns: `36px repeat(${datos.length}, minmax(0, 1fr))` }} aria-hidden="true">
        {datos.map(d => <span key={d.semana}>{corta(d.semana)}</span>)}
      </div>

      <details className={styles.tabla}>
        <summary>Ver como tabla</summary>
        <table>
          <thead>
            <tr><th>Semana del</th><th>{unidad[1][0].toUpperCase() + unidad[1].slice(1)}</th></tr>
          </thead>
          <tbody>
            {datos.map(d => <tr key={d.semana}><td>{corta(d.semana)}</td><td>{d.valor}</td></tr>)}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
