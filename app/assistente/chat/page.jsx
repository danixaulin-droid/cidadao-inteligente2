import { Suspense } from "react";
import ChatPageClient from "./page.client";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatPageClient />
    </Suspense>
  );
}

function ChatLoading() {
  return (
    <main
      style={{
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          padding: 20,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          Iniciando conversa…
        </div>

        <p style={{ marginTop: 8, opacity: 0.6 }}>
          Preparando histórico e interface do chat.
        </p>

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={skeleton(40)} />
          <div style={skeleton(65)} />
          <div style={skeleton(55)} />
        </div>
      </div>
    </main>
  );
}

function skeleton(widthPercent) {
  return {
    height: 14,
    width: `${widthPercent}%`,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
  };
}
