import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webhook Mercado Pago:
// Configure no painel do MP para "Preapproval" / "Assinaturas" e aponte para:
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

    // MP manda formatos diferentes: {type, data:{id}} ou {id}
    const preapprovalId = body?.data?.id || body?.id || body?.resource?.split("/").pop();

    if (!preapprovalId) return Response.json({ ok: true });

    // Busca status atualizado no MP
    const resp = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return Response.json({ ok: false, details: data }, { status: 500 });

    const external = (data?.external_reference || "").toString();
    const [userId, plan] = external.split(":");

    const status = (data?.status || "unknown").toLowerCase();
    // Status comuns: authorized/active, pending, cancelled, paused
    const mappedStatus =
      status === "authorized" || status === "active" ? "active" :
      status === "cancelled" ? "cancelled" :
      status === "paused" ? "paused" :
      status === "pending" ? "pending" : status;

    const sb = createClient(supabaseUrl, serviceKey);

    // Atualiza tabela user_plans
    await sb.from("user_plans").upsert(
      {
        user_id: userId || null,
        plan: (plan || "basic").toLowerCase(),
        status: mappedStatus,
        mp_preapproval_id: preapprovalId,
        mp_status_raw: status,
        mp_next_payment_date: data?.auto_recurring?.next_payment_date || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message || "webhook error" }, { status: 500 });
  }
}
