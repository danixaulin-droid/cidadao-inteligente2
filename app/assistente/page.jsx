import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AssistentePage() {
  // Experiência principal do app (estilo ChatGPT)
  redirect("/assistente/chat?topic=geral");
}
