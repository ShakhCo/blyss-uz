import { getTenant } from '@/lib/tenant'

export default async function TenantPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const tenant = await getTenant()

  // Verify the request is actually from a subdomain
  if (!tenant.isTenant || tenant.slug !== tenantSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Tenant</h1>
          <p className="text-gray-600">This page must be accessed via a subdomain.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-3xl p-8">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
          <h1 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Welcome to {tenantSlug}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            You are accessing the tenant subdomain: <strong>{tenantSlug}.blyss.uz</strong>
          </p>
          <div className="mt-6 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
            <h2 className="font-semibold text-blue-900 dark:text-blue-100">Tenant Info</h2>
            <pre className="mt-2 text-sm text-blue-800 dark:text-blue-200">
              {JSON.stringify({ tenantSlug, isTenant: tenant.isTenant }, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  )
}
