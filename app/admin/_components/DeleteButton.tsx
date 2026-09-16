'use client'

import { useRouter } from 'next/navigation'

interface Props {
  id: string
  onDelete: (id: string) => Promise<void>
  label?: string
}

export default function DeleteButton({ id, onDelete, label = 'ELIMINAR' }: Props) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('¿Confirmar eliminación?')) return
    try {
      await onDelete(id)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error al eliminar. Intentá de nuevo.')
    }
  }
  return (
    <button
      onClick={handleDelete}
      style={{
        color: '#ff6b6b',
        fontFamily: 'var(--font-display)',
        fontSize: '0.8rem',
        letterSpacing: '0.06em',
        background: 'none',
        border: '1px solid #ff6b6b44',
        borderRadius: 6,
        padding: '6px 14px 4px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
