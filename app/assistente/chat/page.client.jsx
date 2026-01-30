"use client";

import { useSearchParams } from "next/navigation";
import ChatBox from "@/components/ChatBox";

export default function AssistenteChatClientPage() {
  const params = useSearchParams();

  const topic = (params.get("topic") || "geral").toLowerCase();
  const sessionFromUrl = (params.get("session") || "").trim();

  const context = `Tema: ${topic}`;

  return (
    <main
      style={{
        height: "calc(100vh - 64px)", // altura total menos header
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header do chat */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.05))",
        }}
      >
        <h1 style={{ margin: 0 }}>
          Chat • {topic.charAt(0).toUpperCase() + topic.slice(1)}
        </h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Envie sua dúvida e, se quiser, anexe PDF ou imagem para eu analisar.
        </p>
      </div>

      {/* Chat ocupa TODO o resto da tela */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatBox context={context} enableUpload sessionFromUrl={sessionFromUrl} />
      </div>
    </main>
  );
}
