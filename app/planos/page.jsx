'use client';

import { useEffect, useState } from "react";

const cards = [
  {
    key: "basic",
    title: "Básico",
    price: "R$ 12,90/mês",
    bullets: [
      "✅ Upload de PDF/imagem (até 10/dia)",
      "✅ Até 120 mensagens/dia",
      "✅ Histórico e continuidade",
    ],
  },
  {
    key: "pro",
    title: "Pro",
    price: "R$ 24,90/mês",
    bullets: [
      "🚀 Upload ilimitado",
      "🚀 Mensagens ilimitadas",
      "🚀 Prioridade e limites maiores",
    ],
  },
];

export default function PlanosPage() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState("none");
  const [err, setErr] = useState("");

  async function loadStatus() {
    try {
      const r = await fetch("/api/billing/status", { cache: "no-store" });
      const d = await r.json();
      setPlan(d?.plan || "free");
      setStatus(d?.status || "none");
    } catch {}
  }

  useEffect(() => { loadStatus(); }, []);

  async function subscribe(p) {
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/billing/create-preapproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: p }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Falha ao iniciar pagamento.");
      const url = d?.init_point || d?.sandbox_init_point;
      if (!url) throw new Error("Link de pagamento não retornado.");
      window.location.href = url;
    } catch (e) {
      setErr(e?.message || "Erro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="card heroGlow" style={{ maxWidth: 980, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Planos</h1>
        <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
          Assine para liberar upload de documentos e aumentar os limites.
          <br />
          <span className="muted">
            Seu plano atual: <b style={{ color: "var(--text)" }}>{plan}</b> • status: <b style={{ color: "var(--text)" }}>{status}</b>
          </span>
        </p>

        {err && (
          <div className="card" style={{ background: "rgba(255,255,255,0.04)", marginTop: 10 }}>
            <b>Erro:</b> <span className="muted">{err}</span>
          </div>
        )}

        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {cards.map((c) => (
            <div key={c.key} className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{c.title}</div>
                  <div className="muted" style={{ marginTop: 4 }}>{c.price}</div>
                </div>

                <button className="btn btnPrimary" disabled={loading} onClick={() => subscribe(c.key)}>
                  {loading ? "Abrindo..." : "Assinar"}
                </button>
              </div>

              <ul className="muted" style={{ marginTop: 10, lineHeight: 1.8 }}>
                {c.bullets.map((b, i) => (<li key={i}>{b}</li>))}
              </ul>
            </div>
          ))}
        </div>

        <div className="muted" style={{ marginTop: 14, fontSize: 12, lineHeight: 1.6 }}>
          Pagamento por assinatura via Mercado Pago. Você pode cancelar pelo Mercado Pago a qualquer momento.
        </div>
      </div>
    </main>
  );
}
