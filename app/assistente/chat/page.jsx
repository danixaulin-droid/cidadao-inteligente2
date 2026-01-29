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

/* Loading simples, sem card, sem quebrar layout */
function ChatLoading() {
  return (
    <main
      style={{
        minHeight: "calc(100vh - 72px)", // respeita o Header
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
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
        <p className="muted" style={{ marginTop: 8 }}>
          Preparando histórico e interface do chat.
        </p>

        {/* Skeleton simples estilo ChatGPT */}
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
