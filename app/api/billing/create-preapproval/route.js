import { getSupabaseServer } from "@/lib/billing/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANS = {
  basic: { title: "Plano Básico", amount: 12.9 },
  pro: { title: "Plano Pro", amount: 24.9 },
};

export async function POST(request) {
  try {
    const supabase = getSupabaseServer();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      return Response.json({ error: "Você precisa estar logado." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = (body?.plan || "").toLowerCase();
    const picked = PLANS[plan];

    if (!picked) {
      return Response.json({ error: "Plano inválido." }, { status: 400 });
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!token) {
      return Response.json({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado." }, { status: 500 });
    }
    if (!appUrl) {
      return Response.json({ error: "NEXT_PUBLIC_APP_URL não configurado." }, { status: 500 });
    }

    // Criar assinatura (preapproval)
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

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return Response.json(
        { error: data?.message || "Falha ao criar assinatura no Mercado Pago.", details: data },
        { status: 500 }
      );
    }

    // Salva referência inicial no Supabase
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

    return Response.json({
      init_point: data?.init_point,
      sandbox_init_point: data?.sandbox_init_point,
      preapproval_id: data?.id,
    });
  } catch (e) {
    return Response.json({ error: e?.message || "Erro desconhecido." }, { status: 500 });
  }
}
