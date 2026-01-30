"use client";

import { useEffect, useMemo, useState } from "react";

const PLANS = [
  {
    key: "basic",
    name: "Básico",
    priceLabel: "R$ 12,90/mês",
    subtitle: "Ideal pra quem usa todo dia e quer upload liberado.",
    perks: [
      "Upload de PDF/imagem (até 10/dia)",
      "Até 120 mensagens/dia",
      "Histórico e continuidade da conversa",
    ],
    highlight: true,
  },
  {
    key: "pro",
    name: "Pro",
    priceLabel: "R$ 24,90/mês",
    subtitle: "Para uso intenso e sem limites.",
    perks: ["Upload ilimitado", "Mensagens ilimitadas", "Prioridade e melhor experiência"],
    highlight: false,
  },
];

async function safeJson(res) {
  const text = await res.text().catch(() => "");
  if (!text) return { __empty: true };
  try {
    return JSON.parse(text);
  } catch {
    return { __invalid: true, raw: text };
  }
}

export default function PlanosPage() {
  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState("none");
  const [loading, setLoading] = useState(true);

  const [busyPlan, setBusyPlan] = useState(""); // basic|pro
  const [msg, setMsg] = useState("");

  const planLabel = useMemo(() => (plan || "free").toLowerCase(), [plan]);
  const statusLabel = useMemo(() => (status || "none").toLowerCase(), [status]);

  async function loadStatus() {
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/billing/status", { cache: "no-store" });
      const data = await safeJson(res);

      // mesmo se vier vazio, não quebra
      setPlan((data?.plan || "free").toLowerCase());
      setStatus((data?.status || "none").toLowerCase());
    } catch (e) {
      setMsg(e?.message || "Falha ao carregar status do plano.");
      setPlan("free");
      setStatus("none");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function subscribe(pickedPlan) {
    setMsg("");
    setBusyPlan(pickedPlan);

    try {
      const res = await fetch("/api/billing/create-preapproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: pickedPlan }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        const errMsg =
          data?.error ||
          data?.message ||
          (data?.__invalid ? "Resposta inválida do servidor." : null) ||
          "Falha ao iniciar pagamento.";
        throw new Error(errMsg);
      }

      const url = data?.init_point || data?.sandbox_init_point;
      if (!url) throw new Error("Não recebi o link de pagamento do Mercado Pago.");

      // redireciona para o MP
      window.location.href = url;
    } catch (e) {
      setMsg(e?.message || "Erro ao iniciar pagamento.");
    } finally {
      setBusyPlan("");
    }
  }

  const statusPill = (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 900 }}>Seu plano atual</div>
        <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
          <b style={{ color: "var(--text)" }}>{planLabel}</b> • status:{" "}
          <b style={{ color: "var(--text)" }}>{statusLabel}</b>
        </div>
      </div>

      <button
        className="btn"
        onClick={loadStatus}
        disabled={loading}
        title="Atualizar"
        style={{ borderRadius: 14, padding: "10px 12px", minWidth: 44 }}
      >
        {loading ? "…" : "↻"}
      </button>
    </div>
  );

  return (
    <main className="container" style={{ maxWidth: 980 }}>
      <div
        className="card"
        style={{
          padding: 18,
          borderRadius: 22,
          background:
            "radial-gradient(900px 420px at 16% 0%, rgba(16,163,127,0.14), transparent 60%), radial-gradient(820px 420px at 80% 0%, rgba(59,130,246,0.10), transparent 62%), rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 36, letterSpacing: -0.7 }}>Planos</h1>
            <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.55, maxWidth: 70 + "ch" }}>
              Desbloqueie upload de documentos, aumente seus limites e tenha uma experiência mais completa com a IA.
            </p>
          </div>

          {statusPill}

          {msg ? (
            <div className="statusChip err" style={{ marginTop: 2 }}>
              ⚠️ {msg}
            </div>
          ) : null}

          {/* GRID de planos */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
              marginTop: 6,
            }}
          >
            {PLANS.map((p) => {
              const isCurrent = planLabel === p.key && statusLabel === "active";
              const isBusy = busyPlan === p.key;

              return (
                <div
                  key={p.key}
                  style={{
                    borderRadius: 22,
                    border: p.highlight
                      ? "1px solid rgba(16,163,127,0.28)"
                      : "1px solid rgba(255,255,255,0.10)",
                    background: p.highlight
                      ? "linear-gradient(180deg, rgba(16,163,127,0.14), rgba(255,255,255,0.03))"
                      : "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
                    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                    overflow: "hidden",
                  }}
                >
                  {/* topo do card */}
                  <div style={{ padding: 16, display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 22, fontWeight: 950, letterSpacing: -0.2 }}>{p.name}</div>
                        <div className="muted" style={{ marginTop: 4, lineHeight: 1.4, fontSize: 13 }}>
                          {p.subtitle}
                        </div>
                      </div>

                      {isCurrent ? (
                        <div
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 900,
                            border: "1px solid rgba(16,163,127,0.30)",
                            background: "rgba(16,163,127,0.14)",
                            color: "rgba(255,255,255,0.92)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ATIVO
                        </div>
                      ) : null}
                    </div>

                    {/* preço (isolado, sem sobreposição) */}
                    <div style={{ display: "grid", gap: 2 }}>
                      <div style={{ fontSize: 22, fontWeight: 950 }}>{p.priceLabel}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        Renovação automática
                      </div>
                    </div>

                    {/* perks */}
                    <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                      {p.perks.map((t, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 9,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.18)",
                              display: "grid",
                              placeItems: "center",
                              flex: "0 0 auto",
                              marginTop: 1,
                            }}
                          >
                            ✓
                          </div>
                          <div style={{ color: "rgba(229,231,235,0.88)", lineHeight: 1.35 }}>{t}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ações */}
                  <div
                    style={{
                      padding: 14,
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(0,0,0,0.18)",
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      className="btn btnPrimary"
                      onClick={() => subscribe(p.key)}
                      disabled={isBusy}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 16,
                        fontWeight: 950,
                        minWidth: 160,
                      }}
                    >
                      {isBusy ? "Abrindo…" : `Assinar ${p.name}`}
                    </button>

                    <button
                      className="btn"
                      onClick={loadStatus}
                      disabled={loading}
                      style={{ padding: "12px 14px", borderRadius: 16, fontWeight: 900 }}
                      title="Atualizar status do plano"
                    >
                      Ver status
                    </button>
                  </div>

                  <div className="muted" style={{ padding: "10px 14px 14px", fontSize: 12, lineHeight: 1.5 }}>
                    Cancelamento e gestão da assinatura pelo Mercado Pago a qualquer momento.
                  </div>
                </div>
              );
            })}
          </div>

          <div className="muted" style={{ fontSize: 12, lineHeight: 1.6, marginTop: 6 }}>
            Dica: após pagar, toque em <b style={{ color: "var(--text)" }}>Ver status</b> para atualizar o plano.
          </div>
        </div>
      </div>
    </main>
  );
}
