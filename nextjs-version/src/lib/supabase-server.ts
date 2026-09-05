import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll pode ser chamado em Server Component (read-only).
            // O erro é esperado e seguro — o middleware cuida da sessão.
          }
        },
      },
    }
  )
}