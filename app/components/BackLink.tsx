import Link from 'next/link'

interface Props {
  href: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function BackLink({ href, children, className, style }: Props) {
  return (
    <Link href={href} className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ic-flechita.webp"
        alt=""
        width={14}
        height={14}
        style={{ transform: 'rotate(90deg)', display: 'block', flexShrink: 0 }}
      />
      {children}
    </Link>
  )
}
