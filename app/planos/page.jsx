"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function PlanosPage() {
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [status, setStatus] = useState("none");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPlan() {
      setErr("");
      setLoading(true);

      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;

        if (!user) {
          if (!mounted) return;
          setCurrentPlan("free");
          setStatus("none");
          return;
        }

        const { data, error } = await supabase
          .from("user_plans")
          .select("plan,status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw new Error(error.message);

        if (!mounted) return;
        setCurrentPlan(data?.plan || "free");
        setStatus(data?.status || "none");
      } catch (e) {
        if (!mounted) return;
        setErr(e?.message || "Falha ao carregar seu plano.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadPlan();
    return () => {
      mounted = false;
    };
  }, []);

  async function subscribe(plan) {
    setErr("");
    setBusy(true);

    try {
      const res = await fetch("/api/mp/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao iniciar assinatura.");

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("Link de pagamento não retornou. Tente novamente.");
      }
    } catch (e) {
      setErr(e?.message || "Erro ao assinar.");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel =
    loading ? "carregando..." : `${currentPlan} • status: ${status}`;

  return (
    <main className="pricingWrap">
      <div className="pricingHeader">
        <div className="pricingTitle">Planos</div>
        <div className="pricingSub">
          Desbloqueie upload de documentos, aumente seus limites e tenha uma
          experiência mais completa com a IA.
        </div>

        <div className="planStatusPill">
          <span style={{ opacity: 0.8 }}>Seu plano atual:</span>
          <b>{statusLabel}</b>
        </div>

        {err && (
          <div className="card" style={{ borderRadius: 16, padding: 14 }}>
            <div style={{ fontWeight: 900 }}>⚠️ Algo deu errado</div>
            <div className="muted" style={{ marginTop: 6 }}>
              {err}
            </div>
          </div>
        )}
      </div>

      <div className="pricingGrid">
        {/* Básico */}
        <div className="planCard">
          <div className="planCardInner">
            <div className="planTopRow">
              <div>
                <div className="planName">Básico</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  Ideal pra quem usa todo dia e quer upload liberado.
                </div>
              </div>

              <div className="planPrice">
                <div className="planPriceMain">R$ 12,90/mês</div>
                <div className="planPriceSub">Renovação automática</div>
              </div>
            </div>

            <ul className="planList">
              <li className="planItem">
                <span className="planIcon">✅</span>
                Upload de PDF/imagem (até 10/dia)
              </li>
              <li className="planItem">
                <span className="planIcon">✅</span>
                Até 120 mensagens/dia
              </li>
              <li className="planItem">
                <span className="planIcon">✅</span>
                Histórico e continuidade da conversa
              </li>
            </ul>

            <div className="planCtaRow">
              <button
                className="planBtn"
                onClick={() => subscribe("basic")}
                disabled={busy}
              >
                {busy ? "Aguarde..." : "Assinar Básico"}
              </button>

              <div className="planHint">
                Cancelamento pelo Mercado Pago a qualquer momento.
              </div>
            </div>

            <div className="planFooterNote">
              💡 Dica: se você usa upload com frequência, o Básico já resolve bem.
            </div>
          </div>
        </div>

        {/* Pro */}
        <div className="planCard">
          <div className="planBadge">Mais popular</div>

          <div className="planCardInner">
            <div className="planTopRow">
              <div>
                <div className="planName">Pro</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  Para uso intenso, respostas rápidas e sem limites apertados.
                </div>
              </div>

              <div className="planPrice">
                <div className="planPriceMain">R$ 24,90/mês</div>
                <div className="planPriceSub">Renovação automática</div>
              </div>
            </div>

            <ul className="planList">
              <li className="planItem">
                <span className="planIcon">🚀</span>
                Upload ilimitado
              </li>
              <li className="planItem">
                <span className="planIcon">🚀</span>
                Mensagens ilimitadas
              </li>
              <li className="planItem">
                <span className="planIcon">🚀</span>
                Prioridade e limites maiores
              </li>
            </ul>

            <div className="planCtaRow">
              <button
                className="planBtn"
                onClick={() => subscribe("pro")}
                disabled={busy}
              >
                {busy ? "Aguarde..." : "Assinar Pro"}
              </button>

              <div className="planHint">
                Melhor custo/benefício pra quem usa todo dia.
              </div>
            </div>

            <div className="planFooterNote">
              ⚡ Pro é ótimo para análise de PDFs e uso contínuo no dia a dia.
            </div>
          </div>
        </div>
      </div>

      <div className="planFooterNote" style={{ marginTop: 16 }}>
        Pagamento por assinatura via Mercado Pago. Ao assinar, você concorda com
        renovação mensal automática.
      </div>
    </main>
  );
}
