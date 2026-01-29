import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function getSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Em alguns ambientes (ou durante render estático), set pode falhar.
            // Ignorar aqui evita crash; o Supabase ainda funciona para requests normais.
          }
        },
      },
    }
  );
}

export async function getActivePlan(supabase, userId) {
  const { data, error } = await supabase
    .from("user_plans")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { plan: "free", status: "none" };

  const plan = (data?.plan || "free").toLowerCase();
  const statusRaw = (data?.status || "none").toLowerCase();

  // Se quiser ser extra robusto:
  const status = statusRaw === "authorized" ? "active" : statusRaw;

  if (status === "active") return { plan, status };

  // Mantém status para UI mostrar "pending/cancelled", mas limita como free.
  return { plan: "free", status };
}

export function planLimits(plan) {
  const p = (plan || "free").toLowerCase();

  if (p === "pro") {
    return { dailyMessages: Infinity, dailyUploads: Infinity, uploadAllowed: true };
  }

  if (p === "basic") {
    return { dailyMessages: 120, dailyUploads: 10, uploadAllowed: true };
  }

  return { dailyMessages: 8, dailyUploads: 0, uploadAllowed: false };
}
