export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0f14",
        color: "#e5e7eb",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Logo / Marca */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <div
            aria-hidden
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            CI
          </div>

          <div style={{ lineHeight: 1.1, textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Cidadão Inteligente</div>
            <div style={{ fontSize: 12, color: "rgba(229,231,235,0.7)" }}>
              Assistente de documentos
            </div>
          </div>
        </div>

        {/* “Card” */}
        <div
          style={{
            borderRadius: 18,
            padding: 18,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Spinner */}
            <span
              aria-label="Carregando"
              style={{
                width: 18,
                height: 18,
                borderRadius: "999px",
                border: "2px solid rgba(255,255,255,0.25)",
                borderTopColor: "rgba(255,255,255,0.9)",
                display: "inline-block",
                animation: "ciSpin 0.9s linear infinite",
              }}
            />
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Carregando…
              <div style={{ fontSize: 12, marginTop: 2, color: "rgba(229,231,235,0.7)" }}>
                Preparando seu painel e conversas
              </div>
            </div>
          </div>

          {/* Skeleton */}
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div style={sk()} />
            <div style={sk(0.78)} />
            <div style={sk(0.62)} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ciSpin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

function sk(w = 1) {
  return {
    height: 12,
    width: `${Math.round(w * 100)}%`,
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
    backgroundSize: "200% 100%",
    animation: "ciSk 1.15s ease-in-out infinite",
  };
}
