"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function friendlyError(msg = "") {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid") || m.includes("credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Abra o e-mail de confirmação (caixa de entrada/spam) e tente novamente.";
  }
  if (m.includes("too many") || m.includes("rate")) {
    return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  }
  return msg || "Ocorreu um erro. Tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // mensagens no topo do card (feedback rápido)
  const [banner, setBanner] = useState(null); // {type:'ok'|'err'|'info', text}

  // recuperar senha
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const canLogin = useMemo(() => {
    return email.trim().length > 3 && password.trim().length >= 6 && !busy;
  }, [email, password, busy]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!canLogin) return;

    setBusy(true);
    setBanner(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setBanner({ type: "err", text: friendlyError(error.message) });
        return;
      }

      setBanner({ type: "ok", text: "Login realizado ✅ Redirecionando…" });

      // ✅ leva direto para o Assistente (mais "ChatGPT-like")
      setTimeout(() => {
        router.push("/assistente");
        router.refresh();
      }, 450);
    } catch (err) {
      setBanner({ type: "err", text: friendlyError(err?.message) });
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    const em = (resetEmail || "").trim();
    if (!em) return;

    setResetBusy(true);
    setBanner(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(em, {
        redirectTo,
      });

      if (error) {
        setBanner({ type: "err", text: friendlyError(error.message) });
        return;
      }

      setBanner({
        type: "ok",
        text: "Enviei um link de recuperação para o seu e-mail ✅ (confira também o spam).",
      });

      setShowReset(false);
      setResetEmail("");
    } catch (err) {
      setBanner({ type: "err", text: friendlyError(err?.message) });
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: 6 }}>Entrar</h1>
            <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
              Acesse seu Cidadão Inteligente e continue suas conversas.
            </p>
          </div>

          {banner && (
            <div
              className="card"
              style={{
                padding: 12,
                borderRadius: 14,
                boxShadow: "none",
                background:
                  banner.type === "ok"
                    ? "rgba(34,197,94,0.12)"
                    : banner.type === "err"
                    ? "rgba(239,68,68,0.12)"
                    : "rgba(255,255,255,0.06)",
                border:
                  banner.type === "ok"
                    ? "1px solid rgba(34,197,94,0.25)"
                    : banner.type === "err"
                    ? "1px solid rgba(239,68,68,0.25)"
                    : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div style={{ fontWeight: 800 }}>{banner.text}</div>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "grid", gap: 10 }}>
            <input
              className="input"
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={busy}
            />

            <input
              className="input"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={busy}
            />

            <button className="btn btnPrimary" disabled={!canLogin}>
              {busy ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowReset((v) => !v);
                setBanner(null);
                setResetEmail(email);
              }}
            >
              Esqueci minha senha
            </button>

            <a className="btn" href="/signup">
              Criar conta
            </a>
          </div>

          {showReset && (
            <div className="card" style={{ padding: 14, borderRadius: 16, boxShadow: "none" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Recuperar senha</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                Digite seu e-mail e eu vou te enviar um link para redefinir a senha.
              </div>

              <form onSubmit={handleResetPassword} style={{ display: "grid", gap: 10, marginTop: 10 }}>
                <input
                  className="input"
                  type="email"
                  placeholder="Seu e-mail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={resetBusy}
                  autoComplete="email"
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn btnPrimary" disabled={resetBusy || !resetEmail.trim()}>
                    {resetBusy ? "Enviando…" : "Enviar link"}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setShowReset(false);
                      setResetEmail("");
                    }}
                    disabled={resetBusy}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            Dica: se você acabou de criar a conta, confirme o e-mail antes de entrar.
          </div>
        </div>
      </div>
    </main>
  );
}
