"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const PLANS = [
  {
    key: "basic",
    name: "Básico",
    price: "R$ 12,90/mês",
    subtitle: "Ideal pra quem usa todo dia e quer upload liberado.",
    features: [
      "Upload de PDF/imagem (até 10/dia)",
      "Até 120 mensagens/dia",
      "Histórico e continuidade da conversa",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "R$ 24,90/mês",
    subtitle: "Para uso intenso e sem limites.",
    features: [
      "Upload ilimitado",
      "Mensagens ilimitadas",
      "Prioridade e melhor experiência",
    ],
    badge: "Recomendado",
  },
];

function normalizeStatus(s) {
  const t = String(s || "none").toLowerCase();
  if (t === "authorized" || t === "active") return "active";
  return t;
}

async function safeJson(res) {
  // evita "Unexpected end of JSON input"
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export default function PlanosPage() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState("none");

  const [busyPlan, setBusyPlan] = useState(""); // "basic" | "pro"
  const [err, setErr] = useState("");

  const statusLabel = useMemo(() => {
    const p = String(plan || "free").toLowerCase();
    const st = normalizeStatus(status);

    if (p === "free" || st === "none") return "free • status: none";
    return `${p} • status: ${st}`;
  }, [plan, status]);

  async function refreshStatus() {
    setErr("");
    setLoading(true);
    try {
      // chama API status
      const res = await fetch("/api/billing/status", { method: "GET" });
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || "Falha ao carregar status do plano.");
      }

      setPlan(String(data?.plan || "free").toLowerCase());
      setStatus(String(data?.status || "none").toLowerCase());
    } catch (e) {
      setErr(e?.message || "Erro ao carregar status.");
      setPlan("free");
      setStatus("none");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshStatus();

    // Atualiza ao logar/deslogar
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refreshStatus();
    });

    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function subscribe(planKey) {
    setErr("");
    setBusyPlan(planKey);

    try {
      const res = await fetch("/api/billing/create-preapproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        // mostra erro real do backend (token faltando, app_url faltando, etc)
        throw new Error(data?.error || "Falha ao iniciar assinatura.");
      }

      const url = data?.init_point || data?.sandbox_init_point;
      if (!url) throw new Error("Mercado Pago não retornou link de pagamento.");

      // Redireciona pro checkout
      window.location.href = url;
    } catch (e) {
      setErr(e?.message || "Erro ao assinar.");
    } finally {
      setBusyPlan("");
    }
  }

  const isActive = normalizeStatus(status) === "active";

  return (
    <main className="pricingWrap">
      <div className="pricingHeader">
        <div className="pricingTitle">Planos</div>
        <div className="pricingSub">
          Desbloqueie upload de documentos, aumente seus limites e tenha uma experiência mais completa com a IA.
        </div>

        <div className="planStatusPill">
          <span>Seu plano atual:</span>{" "}
          <b>{loading ? "carregando..." : statusLabel}</b>
          <button
            className="btn"
            onClick={refreshStatus}
            disabled={loading}
            style={{ padding: "8px 10px", borderRadius: 14 }}
            title="Atualizar status"
          >
            ↻
          </button>
        </div>

        {err ? (
          <div className="statusChip err" style={{ marginTop: 8 }}>
            <b>⚠️ Algo deu errado</b>
            <div style={{ marginTop: 6 }}>{err}</div>
            <div className="muted" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5 }}>
              Dica: se você ainda não colocou as variáveis do Mercado Pago na Vercel, o botão Assinar vai dar erro.
            </div>
          </div>
        ) : null}
      </div>

      <div className="pricingGrid">
        {PLANS.map((p) => {
          const current = String(plan).toLowerCase() === p.key;
          const disabled = busyPlan && busyPlan !== p.key;

          return (
            <div key={p.key} className="planCard">
              {p.badge ? <div className="planBadge">{p.badge}</div> : null}

              <div className="planCardInner">
                <div className="planTopRow">
                  <div>
                    <div className="planName">{p.name}</div>
                    <div className="planHint" style={{ marginTop: 6 }}>
                      {p.subtitle}
                    </div>
                  </div>

                  <div className="planPrice">
                    <div className="planPriceMain">{p.price}</div>
                    <div className="planPriceSub">Renovação automática</div>
                  </div>
                </div>

                <ul className="planList">
                  {p.features.map((f) => (
                    <li key={f} className="planItem">
                      <span className="planIcon">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="planCtaRow">
                  <button
                    className="planBtn"
                    onClick={() => subscribe(p.key)}
                    disabled={loading || disabled}
                    title={current && isActive ? "Você já está neste plano" : "Assinar"}
                  >
                    {busyPlan === p.key ? "Abrindo Mercado Pago…" : current && isActive ? "Plano ativo" : `Assinar ${p.name}`}
                  </button>

                  <button
                    className="planGhostBtn"
                    onClick={refreshStatus}
                    disabled={loading || !!busyPlan}
                    title="Atualizar status"
                  >
                    Ver status
                  </button>
                </div>

                <div className="planFooterNote">
                  Cancelamento e gestão da assinatura pelo Mercado Pago a qualquer momento.
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="muted" style={{ marginTop: 14, fontSize: 12, lineHeight: 1.6 }}>
        ⚠️ Importante: para o pagamento funcionar você precisa configurar na Vercel:
        <br />
        <b>MERCADOPAGO_ACCESS_TOKEN</b> e <b>NEXT_PUBLIC_APP_URL</b>.
      </div>

      <style jsx>{`
        /* Chip de status (quando não existe no seu CSS) */
        .statusChip {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.18);
          border-radius: 16px;
          padding: 12px 12px;
        }
        .statusChip.err {
          border-color: rgba(255, 180, 0, 0.25);
          background: rgba(255, 180, 0, 0.08);
        }
      `}</style>
    </main>
  );
}
