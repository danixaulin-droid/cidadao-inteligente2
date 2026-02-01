import { createSupabaseServerClient } from "@/lib/supabase/server";

/* ======================
   SUPABASE SERVER
====================== */
export function getSupabaseServer() {
  return createSupabaseServerClient();
}

/* ======================
   PLANO ATIVO DO USUÁRIO
====================== */
export async function getActivePlan(supabase, userId) {
  const { data, error } = await supabase
    .from("user_plans")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();

  // qualquer erro → free
  if (error || !data) {
    return { plan: "free", status: "none" };
  }

  const plan = (data.plan || "free").toLowerCase();
  const statusRaw = (data.status || "none").toLowerCase();

  // robustez extra (Mercado Pago às vezes retorna "authorized")
  const status = statusRaw === "authorized" ? "active" : statusRaw;

  if (status === "active") {
    return { plan, status };
  }

  // plano existe mas não está ativo → trata como free
  return { plan: "free", status };
}

/* ======================
   LIMITES POR PLANO
====================== */
export function planLimits(plan = "free") {
  const p = (plan || "free").toLowerCase();

  if (p === "pro") {
    return {
      dailyMessages: Infinity, // ilimitado
      dailyUploads: Infinity,  // ilimitado
      uploadAllowed: true,
    };
  }

  if (p === "basic") {
    return {
      dailyMessages: 120,
      dailyUploads: 10,
      uploadAllowed: true,
    };
  }

  // ✅ FREE (AJUSTADO CONFORME PEDIDO)
  return {
    dailyMessages: 5,   // ✅ 5 mensagens por dia
    dailyUploads: 0,    // ❌ sem upload
    uploadAllowed: false,
  };
}
