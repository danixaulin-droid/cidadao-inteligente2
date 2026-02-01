import { getSupabaseServer, getActivePlan } from "@/lib/billing/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    // 🔑 tenta pegar usuário (erro aqui NÃO é fatal)
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    // 👤 visitante (não logado)
    if (!user) {
      return Response.json(
        {
          logged: false,
          plan: "free",
          status: "none",
        },
        { status: 200 }
      );
    }

    // 👤 usuário logado → buscar plano
    const result = await getActivePlan(supabase, user.id);

    return Response.json(
      {
        logged: true,
        plan: (result?.plan || "free").toLowerCase(),
        status: (result?.status || "none").toLowerCase(),
      },
      { status: 200 }
    );
  } catch (e) {
    // 🛟 fallback absoluto (nunca quebra o app)
    return Response.json(
      {
        logged: false,
        plan: "free",
        status: "none",
        error: "billing_status_error",
      },
      { status: 200 }
    );
  }
}
