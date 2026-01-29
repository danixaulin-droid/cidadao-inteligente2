"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("APP ERROR:", error);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#0b0f14", color: "#e5e7eb", padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Ops, ocorreu um erro no app.</h2>

        <div style={{ opacity: 0.8, marginTop: 8 }}>
          Abra o console do navegador para ver detalhes (F12 → Console).
        </div>

        <pre
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {String(error?.message || error)}
        </pre>

        <button
          onClick={() => reset()}
          style={{
            marginTop: 14,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.08)",
            color: "#e5e7eb",
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
