'use client'

import Link from 'next/link'
import { AHORRO_ANUAL, DESCUENTO_ANUAL, PRECIOS, pesos, type TipoPlan } from '@/lib/plan10'
import styles from './plan10.module.css'

type Props = {
  // En /pagar el plan se elige ahí mismo; en /plan10 cada tarjeta lleva a /pagar
  elegido?: TipoPlan
  onElegir?: (tipo: TipoPlan) => void
}

export default function PlanButtons({ elegido, onElegir }: Props) {
  const tarjeta = (tipo: TipoPlan, clase: string, contenido: React.ReactNode) =>
    onElegir ? (
      <button
        type="button"
        className={`${clase} ${elegido === tipo ? styles.planCardSel : ''}`}
        onClick={() => onElegir(tipo)}
        aria-pressed={elegido === tipo}
      >
        {contenido}
      </button>
    ) : (
      <Link href={`/pagar?tipo=${tipo}`} className={clase}>{contenido}</Link>
    )

  return (
    <div className={styles.plans}>
      {tarjeta('mensual', styles.planCard, <>
        <div className={styles.planInfo}>
          <p className={styles.planName}>Mensual</p>
          <p className={styles.planDesc}>Renovación automática cada mes</p>
        </div>
        <div className={styles.planPrice}>
          <p className={styles.planAmount}>{pesos(PRECIOS.mensual)}</p>
          <p className={styles.planPeriod}>/mes</p>
        </div>
      </>)}

      {tarjeta('anual', `${styles.planCard} ${styles.planCardFeatured}`, <>
        <span className={styles.planSavingBadge}>{DESCUENTO_ANUAL}% OFF — AHORRÁS {pesos(AHORRO_ANUAL)}</span>
        <div className={styles.planInfo}>
          <p className={`${styles.planName} ${styles.planFeaturedName}`}>Anual</p>
          <p className={styles.planDesc}>Pago único, 12 meses de Plan 10</p>
        </div>
        <div className={styles.planPrice}>
          <p className={`${styles.planAmount} ${styles.planFeaturedAmount}`}>{pesos(PRECIOS.anual)}</p>
          <p className={styles.planPeriod}>/año</p>
        </div>
      </>)}
    </div>
  )
}
