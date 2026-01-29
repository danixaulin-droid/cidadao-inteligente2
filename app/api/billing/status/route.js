import { getSupabaseServer, getActivePlan } from "@/lib/billing/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      return Response.json({ plan: "free", status: "none", error: userErr.message }, { status: 200 });
    }

    const user = userData?.user;
    if (!user) return Response.json({ plan: "free", status: "none" }, { status: 200 });

    const { plan, status } = await getActivePlan(supabase, user.id);
    return Response.json({ plan, status }, { status: 200 });
  } catch (e) {
    return Response.json({ plan: "free", status: "none", error: e?.message || "status error" }, { status: 200 });
  }
}
