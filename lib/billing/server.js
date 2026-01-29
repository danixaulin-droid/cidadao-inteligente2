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
        setAll() {},
      },
    }
  );
}

export async function getActivePlan(supabase, userId) {
  // Table expected: user_plans (user_id PK, plan text, status text, mp_preapproval_id text, updated_at timestamptz)
  const { data, error } = await supabase
    .from("user_plans")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { plan: "free", status: "none" };
  const plan = (data?.plan || "free").toLowerCase();
  const status = (data?.status || "none").toLowerCase();
  if (status === "active") return { plan, status };
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
