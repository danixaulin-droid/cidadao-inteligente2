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
        padding: 0,
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "flex",
          flexDirection: "column",
          height: "100%",
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
