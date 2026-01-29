import { getSupabaseServer } from "@/lib/billing/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANS = {
  basic: { title: "Plano Básico", amount: 12.9 },
  pro: { title: "Plano Pro", amount: 24.9 },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function POST(request) {
  try {
    const supabase = getSupabaseServer();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) return json({ error: "Falha ao ler usuário", details: userErr.message }, 401);

    const user = userData?.user;
    if (!user) return json({ error: "Você precisa estar logado." }, 401);

    const body = await request.json().catch(() => ({}));
    const plan = String(body?.plan || "").toLowerCase();
    const picked = PLANS[plan];
    if (!picked) return json({ error: "Plano inválido." }, 400);

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!token) return json({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado." }, 500);
    if (!appUrl) return json({ error: "NEXT_PUBLIC_APP_URL não configurado." }, 500);

    const payload = {
      reason: `${picked.title} • Cidadão Inteligente`,
      payer_email: user.email,
      back_url: `${appUrl}/planos/sucesso?plan=${encodeURIComponent(plan)}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: picked.amount,
        currency_id: "BRL",
      },
      status: "pending",
      external_reference: `${user.id}:${plan}`,
    };

    const resp = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text(); // ← importante: garante que não quebra
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!resp.ok) {
      return json(
        { error: data?.message || "Falha ao criar assinatura no Mercado Pago.", details: data },
        500
      );
    }

    await supabase.from("user_plans").upsert(
      {
        user_id: user.id,
        plan,
        status: "pending",
        mp_preapproval_id: data?.id || null,
        mp_init_point: data?.init_point || null,
      },
      { onConflict: "user_id" }
    );

    return json({
      init_point: data?.init_point,
      sandbox_init_point: data?.sandbox_init_point,
      preapproval_id: data?.id,
    });
  } catch (e) {
    return json({ error: e?.message || "Erro desconhecido." }, 500);
  }
}
