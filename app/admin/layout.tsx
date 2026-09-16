import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNav from './_components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/slides')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!perfil?.is_admin) redirect('/')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AdminNav />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 80px' }}>
        {children}
      </main>
    </div>
  )
}
