'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './plan10.module.css'

export default function PlanButtons() {
  const [loading, setLoading] = useState<'mensual' | 'anual' | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handlePlan = async (tipo: 'mensual' | 'anual') => {
    setLoading(tipo)
    setError('')
    try {
      const res = await fetch('/api/mp/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login?next=/plan10')
          return
        }
        setError(data.error ?? 'Ocurrió un error. Intentá de nuevo.')
        return
      }
      window.location.href = data.init_point
    } catch {
      setError('No se pudo conectar. Intentá de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={styles.plans}>
      {error && <p className={styles.errorMsg}>{error}</p>}

      <button
        className={styles.planCard}
        onClick={() => handlePlan('mensual')}
        disabled={loading !== null}
      >
        <div className={styles.planInfo}>
          <p className={styles.planName}>Mensual</p>
          <p className={styles.planDesc}>Renovación automática cada mes</p>
        </div>
        <div className={styles.planPrice}>
          <p className={styles.planAmount}>{loading === 'mensual' ? '...' : '$4.900'}</p>
          <p className={styles.planPeriod}>/mes</p>
        </div>
      </button>

      <button
        className={`${styles.planCard} ${styles.planCardFeatured}`}
        onClick={() => handlePlan('anual')}
        disabled={loading !== null}
      >
        <span className={styles.planSavingBadge}>50% OFF — AHORRÁS $29.400</span>
        <div className={styles.planInfo}>
          <p className={`${styles.planName} ${styles.planFeaturedName}`}>Anual</p>
          <p className={styles.planDesc}>Pago único, 12 meses de Plan 10</p>
        </div>
        <div className={styles.planPrice}>
          <p className={`${styles.planAmount} ${styles.planFeaturedAmount}`}>{loading === 'anual' ? '...' : '$29.400'}</p>
          <p className={styles.planPeriod}>/año</p>
        </div>
      </button>
    </div>
  )
}
