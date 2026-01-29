'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SucessoPlano() {
  const params = useSearchParams();
  const plan = params.get("plan") || "basic";
  const [status, setStatus] = useState("Verificando...");

  useEffect(() => {
    let t = setInterval(async () => {
      try {
        const r = await fetch("/api/billing/status", { cache: "no-store" });
        const d = await r.json();
        if (d?.status === "active") {
          setStatus("✅ Assinatura ativa! Você já pode usar os recursos do plano.");
          clearInterval(t);
        } else {
          setStatus("⏳ Pagamento em processamento… assim que confirmar, o plano ativa automaticamente.");
        }
      } catch {}
    }, 2500);

    return () => clearInterval(t);
  }, []);

  return (
    <main className="container">
      <div className="card heroGlow" style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Quase lá 🎉</h1>
        <p className="muted" style={{ lineHeight: 1.7, marginTop: 8 }}>
          Voltamos do Mercado Pago (plano: <b style={{ color: "var(--text)" }}>{plan}</b>).
          <br />
          {status}
        </p>

        <div className="nav" style={{ marginTop: 14 }}>
          <a className="btn btnPrimary" href="/assistente/chat?topic=geral">
            Ir para o chat
          </a>
          <a className="btn" href="/dashboard">
            Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
