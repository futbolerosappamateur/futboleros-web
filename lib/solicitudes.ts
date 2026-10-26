// Pedidos de los botones de arrepentimiento y de baja (tabla solicitudes_consumidor)
export type TipoSolicitud = 'arrepentimiento' | 'baja'

export const TITULO_SOLICITUD: Record<TipoSolicitud, string> = {
  arrepentimiento: 'Botón de arrepentimiento',
  baja: 'Botón de baja',
}

// Lo que va adelante del código de trámite (ARR-7K2M9Q)
export const PREFIJO_SOLICITUD: Record<TipoSolicitud, string> = {
  arrepentimiento: 'ARR',
  baja: 'BAJ',
}
