"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/* ======================
   PLANOS
====================== */
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
    perks: [
      "Upload ilimitado",
      "Mensagens ilimitadas",
      "Prioridade e melhor experiência",
    ],
    highlight: false,
  },
];

/* ======================
   STATUS → UX HUMANA
====================== */
function getStatusUI(status) {
  switch (status) {
    case "active":
      return { label: "Plano ativo", icon: "✅" };
    case "pending":
      return { label: "Pagamento em processamento", icon: "⏳" };
    case "canceled":
      return { label: "Assinatura cancelada", icon: "⚠️" };
    default:
      return { label: "Plano gratuito", icon: "🆓" };
  }
}

async function safeJson(res) {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export default function PlanosPage() {
  const router = useRouter();
  const pathname = usePathname() || "/planos";

  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState("none");
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState("");
  const [msg, setMsg] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  const planLabel = useMemo(() => plan || "free", [plan]);
  const statusLabel = useMemo(() => status || "none", [status]);
  const statusUI = getStatusUI(statusLabel);

  function goLogin() {
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
  }

  async function loadStatus() {
    setLoading(true);
    setMsg("");
    setAuthRequired(false);

    try {
      const res = await fetch("/api/billing/status", { cache: "no-store" });
      const data = await safeJson(res);

      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        setPlan("free");
        setStatus("none");
        return;
      }

      setPlan((data?.plan || "free").toLowerCase());
      setStatus((data?.status || "none").toLowerCase());
    } catch {
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
    setBusyPlan(pickedPlan);
    setMsg("");

    try {
      const res = await fetch("/api/billing/create-preapproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: pickedPlan }),
      });

      if (res.status === 401 || res.status === 403) {
        goLogin();
        return;
      }

      const data = await safeJson(res);
      const url = data?.init_point || data?.sandbox_init_point;
      if (url) window.location.href = url;
      else throw new Error();
    } catch {
      setMsg("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setBusyPlan("");
    }
  }

  return (
    <main className="container" style={{ maxWidth: 980 }}>
      <div className="card" style={{ padding: 18, borderRadius: 22 }}>
        <h1 style={{ fontSize: 36, marginBottom: 6 }}>Planos</h1>
        <p className="muted" style={{ maxWidth: "70ch" }}>
          Desbloqueie recursos avançados e tenha a melhor experiência com a IA.
        </p>

        {/* STATUS */}
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.18)",
          }}
        >
          <b>Seu plano atual</b>
          <div className="muted" style={{ marginTop: 6 }}>
            {statusUI.icon} <b>{statusUI.label}</b>
          </div>

          {statusLabel === "pending" && (
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              Assim que o Mercado Pago confirmar o pagamento, seu plano será ativado automaticamente.
            </div>
          )}

          {authRequired && (
            <button
              className="btn btnPrimary"
              onClick={goLogin}
              style={{ marginTop: 10 }}
            >
              Entrar na conta
            </button>
          )}

          <button
            className="btn"
            onClick={loadStatus}
            disabled={loading}
            style={{ marginTop: 10 }}
          >
            {loading ? "Atualizando…" : "↻ Atualizar status"}
          </button>
        </div>

        {/* PLANOS */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
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
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: p.highlight
                    ? "linear-gradient(180deg, rgba(16,163,127,0.18), rgba(255,255,255,0.03))"
                    : "rgba(255,255,255,0.05)",
                  padding: 16,
                }}
              >
                <h2>{p.name}</h2>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{p.priceLabel}</div>
                <div className="muted" style={{ marginBottom: 10 }}>
                  {p.subtitle}
                </div>

                {p.perks.map((perk, i) => (
                  <div key={i} className="muted">✓ {perk}</div>
                ))}

                <button
                  className={isCurrent ? "btn" : "btn btnPrimary"}
                  disabled={isCurrent || isBusy}
                  onClick={() => subscribe(p.key)}
                  style={{ marginTop: 14, width: "100%" }}
                >
                  {isCurrent ? "Plano atual" : isBusy ? "Abrindo…" : `Assinar ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {msg && (
          <div className="muted" style={{ marginTop: 14 }}>
            ⚠️ {msg}
          </div>
        )}
      </div>
    </main>
  );
}
