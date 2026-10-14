import LoginForm from './LoginForm'

// ?next= y ?error= se leen acá, en el servidor: con useSearchParams en el cliente la página
// no se puede pre-armar y next build falla. Así además llega con el formulario ya dibujado.
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>
}) {
  const { next, error } = await searchParams
  const pedido = typeof next === 'string' && next ? next : '/'
  return (
    <LoginForm
      next={/^\/(?![/\\])/.test(pedido) ? pedido : '/'}   // solo rutas internas
      errorGoogle={error === 'google'}
    />
  )
}
