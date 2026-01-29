"use client";

import { useSearchParams } from "next/navigation";
import ChatBox from "@/components/ChatBox";

export default function AssistenteChatClientPage() {
  const params = useSearchParams();

  const topic = (params.get("topic") || "geral").toLowerCase();
  const sessionFromUrl = (params.get("session") || "").trim();

  const context = `Tema: ${topic}`;

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>
          Chat • {topic.charAt(0).toUpperCase() + topic.slice(1)}
        </h1>

        <p className="muted" style={{ marginTop: 8 }}>
          Envie sua dúvida e, se quiser, anexe PDF ou imagem para eu analisar.
        </p>

        {/* ✅ passa a sessão correta */}
        <ChatBox context={context} enableUpload sessionFromUrl={sessionFromUrl} />
      </div>
    </main>
  );
}
