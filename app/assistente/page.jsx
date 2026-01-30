import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AssistentePage() {
  redirect("/assistente/chat?topic=geral");
}
