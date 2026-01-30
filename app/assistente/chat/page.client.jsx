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
        minHeight: "calc(100vh - 72px)", // respeita o Header global do app
        padding: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* Chat ocupa tudo, sem card, sem título */}
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ChatBox
          context={context}
          enableUpload
          sessionFromUrl={sessionFromUrl}
        />
      </div>
    </main>
  );
}
