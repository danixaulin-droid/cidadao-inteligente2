"use client";

import { useSearchParams } from "next/navigation";
import ChatBox from "@/components/ChatBox";

export default function AssistenteChatClientPage() {
  const params = useSearchParams();

  const topic = (params.get("topic") || "geral").toLowerCase();
  const sessionFromUrl = (params.get("session") || "").trim();

  const context = `Tema: ${topic}`;

  const title = `Chat • ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;

  return (
    <main
      className="container"
      style={{
        minHeight: "calc(100dvh - 72px)", // respeita Header sticky
        display: "flex",
        flexDirection: "column",
        paddingTop: 12,
        paddingBottom: 12,
      }}
    >
      {/* Shell do chat em tela cheia (sem "card pequeno") */}
      <section
        className="chatShell"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0, // IMPORTANTE pro scroll interno funcionar
        }}
      >
        {/* Header do chat */}
        <div className="chatHeaderRow">
          <div style={{ minWidth: 0 }}>
            <div className="chatTitle" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {title}
            </div>
            <div className="chatMeta">
              Envie sua dúvida e, se quiser, anexe PDF ou imagem para eu analisar.
            </div>
          </div>
        </div>

        {/* ChatBox ocupa o resto da altura */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <ChatBox context={context} enableUpload sessionFromUrl={sessionFromUrl} />
        </div>
      </section>
    </main>
  );
}
