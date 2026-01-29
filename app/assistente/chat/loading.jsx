export default function LoadingChat() {
  return (
    <main style={{ minHeight: "100vh", background: "#0b0f14", color: "#e5e7eb", padding: 16 }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 14 }}>
          Iniciando conversa…
        </div>
        <div style={{ marginTop: 10, opacity: 0.75 }}>
          Carregando sessão, histórico e interface do chat.
        </div>

        <div
          style={{
            marginTop: 18,
            borderRadius: 18,
            padding: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ height: 14, width: "40%", borderRadius: 999, background: "rgba(255,255,255,0.08)" }} />
            <div style={{ height: 14, width: "60%", borderRadius: 999, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ height: 14, width: "55%", borderRadius: 999, background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>
      </div>
    </main>
  );
}
