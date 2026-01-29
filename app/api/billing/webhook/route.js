import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webhook Mercado Pago:
// Configure no painel do MP para "Assinaturas / Preapproval" e aponte para:
// https://SEU_APP_URL/api/billing/webhook
export async function POST(request) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!token) return Response.json({ ok: false, error: "missing mp token" }, { status: 500 });
    if (!supabaseUrl || !serviceKey) {
      return Response.json({ ok: false, error: "missing supabase service key" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));

    // MP manda formatos diferentes:
    // { type, data:{ id } }  ou { id } ou { resource: "..." }
    const preapprovalId =
      body?.data?.id ||
      body?.id ||
      (typeof body?.resource === "string" ? body.resource.split("/").pop() : null);

    // Se não veio id, devolve 200 pra não ficar reenviando sem parar
    if (!preapprovalId) return Response.json({ ok: true });

    // Busca status atualizado no MP (isso já "valida" que a assinatura existe)
    const resp = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const mp = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error("MP preapproval fetch failed:", mp);
      // retorna 200 para evitar loop de retry infinito, mas marca erro
      return Response.json({ ok: true, warned: "mp_fetch_failed" });
    }

    const external = String(mp?.external_reference || "").trim();

    // Seu app usa external_reference = "userId:plan"
    const [userIdRaw, planRaw] = external.split(":");
    const userId = (userIdRaw || "").trim();
    const plan = (planRaw || "basic").trim().toLowerCase();

    // ✅ Sem userId => NÃO atualiza nada (evita user_id null)
    if (!userId) {
      console.warn("Webhook without external_reference userId. preapproval:", preapprovalId, "external:", external);
      return Response.json({ ok: true, warned: "missing_userId_in_external_reference" });
    }

    const statusRaw = String(mp?.status || "unknown").toLowerCase();

    // Status comuns: authorized/active, pending, cancelled, paused
    const mappedStatus =
      statusRaw === "authorized" || statusRaw === "active"
        ? "active"
        : statusRaw === "cancelled"
        ? "cancelled"
        : statusRaw === "paused"
        ? "paused"
        : statusRaw === "pending"
        ? "pending"
        : statusRaw;

    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const payload = {
      user_id: userId,
      plan,
      status: mappedStatus,
      mp_preapproval_id: preapprovalId,
      mp_status_raw: statusRaw,
      mp_next_payment_date: mp?.auto_recurring?.next_payment_date || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await sb.from("user_plans").upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error("Supabase upsert error:", error);
      // 200 pra não causar retry infinito do MP
      return Response.json({ ok: true, warned: "supabase_upsert_failed" });
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    // 200 pra não ficar loopando no Mercado Pago
    return Response.json({ ok: true, warned: e?.message || "webhook_error" });
  }
}
