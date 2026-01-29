"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function friendlyError(msg = "") {
  const m = (msg || "").toLowerCase();
  if (m.includes("password") && (m.includes("short") || m.includes("length") || m.includes("should"))) {
    return "Senha fraca. Use pelo menos 6 caracteres.";
  }
  return msg || "Erro inesperado.";
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (!password || password.length < 6) return false;
    if (password !== confirm) return false;
    return true;
  }, [password, confirm, busy]);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        // quando o usuário clica no link do e-mail, o Supabase coloca a sessão automaticamente
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          setStatus({ type: "error", text: friendlyError(error.message) });
          setReady(false);
        } else {
          const hasSession = !!data?.session;
          setReady(hasSession);
          if (!hasSession) {
            setStatus({
              type: "error",
              text: "Link inválido ou expirado. Solicite um novo em 'Esqueci minha senha'.",
            });
          }
        }
      } catch (e) {
        if (!mounted) return;
        setStatus({ type: "error", text: friendlyError(e?.message) });
        setReady(false);
      } finally {
        if (!mounted) return;
        setChecking(false);
      }
    }

    checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setStatus({ type: "", text: "" });

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStatus({ type: "success", text: "Senha atualizada ✅ Redirecionando…" });
      setTimeout(() => {
        router.push("/assistente");
        router.refresh();
      }, 900);
    } catch (e2) {
      setStatus({ type: "error", text: friendlyError(e2?.message) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <div className="pageTitle" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Definir nova senha</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          Abra este link no mesmo navegador em que você solicitou a recuperação.
        </p>
      </div>

      <div className="card" style={{ padding: 16 }}>
        {status.text && (
          <div
            className={"statusChip " + (status.type === "success" ? "ok" : status.type === "error" ? "err" : "")}
            style={{ marginBottom: 12 }}
          >
            {status.text}
          </div>
        )}

        {checking ? (
          <div className="muted">Verificando link…</div>
        ) : !ready ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div className="muted">Não foi possível continuar.</div>
            <a className="btn" href="/login">
              Voltar ao login
            </a>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Nova senha
              </span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Confirmar senha
              </span>
              <input
                className="input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
            </label>

            <button className="btn btnPrimary" disabled={!canSubmit} type="submit">
              {busy ? "Salvando…" : "Salvar nova senha"}
            </button>

            <a className="btn" href="/login">
              Cancelar
            </a>
          </form>
        )}
      </div>
    </main>
  );
}
