import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // ✅ IMPORTANTE:
        // Em Server Components, o Next pode bloquear escrita de cookies.
        // Isso gera erro raro ao carregar a Home (quando o Supabase tenta refresh da sessão).
        // Então: tentamos setar e, se o Next bloquear, ignoramos aqui.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // no-op: evita crash raro no Server Component
        }
      },
    },
  });
}
