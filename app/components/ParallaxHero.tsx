'use client'

import { useEffect, useRef } from 'react'

interface Props {
  src: string
  overlay?: string
  className?: string
  children: React.ReactNode
}

export default function ParallaxHero({
  src,
  overlay = 'rgba(10,10,18,0.58)',
  className,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const progress = -rect.top * 0.35
      el.style.backgroundPositionY = `calc(50% + ${progress}px)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        backgroundImage: `linear-gradient(${overlay}, ${overlay}), url('${src}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 50%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {children}
    </div>
  )
}
