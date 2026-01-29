import { createSupabaseServerClient } from "@/lib/supabase/server";

export function getSupabaseServer() {
  return createSupabaseServerClient();
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

  // robustez extra (se algum dia vier "authorized")
  const status = statusRaw === "authorized" ? "active" : statusRaw;

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
