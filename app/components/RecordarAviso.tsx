'use client'

import { useEffect } from 'react'

// Anota en una cookie qué aviso se vio en cada lugar, para que en la próxima carga BloquePublicidad
// muestre el siguiente. Guarda solo el id del aviso, nada de quien lo ve
export default function RecordarAviso({ slot, id }: { slot: string; id: string }) {
  useEffect(() => {
    document.cookie = `aviso_${slot}=${id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
  }, [slot, id])

  return null
}
