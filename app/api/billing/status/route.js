import { getSupabaseServer, getActivePlan } from "@/lib/billing/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return Response.json({ plan: "free", status: "none" }, { status: 200 });

  const { plan, status } = await getActivePlan(supabase, user.id);
  return Response.json({ plan, status });
}
