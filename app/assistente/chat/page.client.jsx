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
        height: "100dvh",
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        overflow: "hidden",

        // ✅ isso resolve o “não centraliza” no app instalado (safe-area)
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          margin: "0 auto",
        }}
      >
        <ChatBox context={context} enableUpload sessionFromUrl={sessionFromUrl} />
      </div>
    </main>
  );
}
