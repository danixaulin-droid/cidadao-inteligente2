"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function clsx(...arr){ return arr.filter(Boolean).join(" "); }

export default function MeusDadosPage(){
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [msg, setMsg] = useState(null); // {type, text}

  const canSavePassword = useMemo(() => {
    if (!newPassword) return false;
    if (newPassword.length < 6) return false;
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  useEffect(() => {
    let mounted = true;
    async function boot(){
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if(!mounted) return;

      if(!u){
        router.push("/login");
        return;
      }

      setUser(u);
      setEmail(u.email || "");
      setPhone((u.user_metadata && (u.user_metadata.phone || u.user_metadata.telefone)) || "");
      setNewEmail(u.email || "");
      setNewPhone((u.user_metadata && (u.user_metadata.phone || u.user_metadata.telefone)) || "");
      setLoading(false);
    }
    boot();
    return ()=>{ mounted=false; };
  }, [router]);

  async function saveContact(){
    if(!user) return;
    setSaving(true);
    setMsg(null);

    try{
      // phone em metadata (não precisa tabela extra)
      const phoneValue = (newPhone || "").trim();
      const { data, error } = await supabase.auth.updateUser({
        data: { phone: phoneValue }
      });
      if(error) throw new Error(error.message);

      setPhone(phoneValue);
      setUser(data?.user || user);
      setMsg({ type: "ok", text: "Dados atualizados ✅" });
    }catch(e){
      setMsg({ type: "err", text: e?.message || "Falha ao salvar." });
    }finally{
      setSaving(false);
    }
  }

  async function saveEmail(){
    if(!user) return;
    const val = (newEmail || "").trim();
    if(!val || !val.includes("@")){
      setMsg({ type: "err", text: "Digite um e-mail válido." });
      return;
    }

    setSaving(true);
    setMsg(null);
    try{
      // OBS: se o projeto exigir confirmação, o Supabase envia e-mail.
      const { error } = await supabase.auth.updateUser({ email: val });
      if(error) throw new Error(error.message);

      setMsg({ type: "ok", text: "Pedido de troca de e-mail enviado ✅ Verifique sua caixa de entrada para confirmar." });
    }catch(e){
      setMsg({ type: "err", text: e?.message || "Falha ao atualizar e-mail." });
    }finally{
      setSaving(false);
    }
  }

  async function savePassword(){
    if(!user) return;
    if(!canSavePassword){
      setMsg({ type: "err", text: "Senha inválida. Use 6+ caracteres e confirme corretamente." });
      return;
    }

    setSaving(true);
    setMsg(null);
    try{
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if(error) throw new Error(error.message);

      setNewPassword("");
      setConfirmPassword("");
      setMsg({ type: "ok", text: "Senha atualizada ✅" });
    }catch(e){
      setMsg({ type: "err", text: e?.message || "Falha ao atualizar senha." });
    }finally{
      setSaving(false);
    }
  }

  if(loading){
    return (
      <main className="container">
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Meus dados</h1>
          <p className="muted">Carregando…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ marginTop: 0, marginBottom: 6 }}>Meus dados</h1>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>
              Atualize suas informações de conta.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <a className="btn" href="/assistente">Assistente</a>
            <a className="btn" href="/dashboard">Dashboard</a>
          </div>
        </div>

        {msg?.text && (
          <div
            className="card"
            style={{
              marginTop: 14,
              background: msg.type === "ok" ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
              border: msg.type === "ok" ? "1px solid rgba(16,185,129,0.22)" : "1px solid rgba(239,68,68,0.22)",
              boxShadow: "none",
            }}
          >
            <div style={{ fontWeight: 800 }}>{msg.type === "ok" ? "Tudo certo" : "Atenção"}</div>
            <div className="muted" style={{ marginTop: 6 }}>{msg.text}</div>
          </div>
        )}

        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          <div className="card" style={{ background: "rgba(255,255,255,0.04)", boxShadow: "none" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Contato</div>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>Telefone (opcional)</span>
                <input
                  className="input"
                  placeholder="Ex: +55 17 99999-9999"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  inputMode="tel"
                />
              </label>

              <button className="btn btnPrimary" onClick={saveContact} disabled={saving}>
                {saving ? "Salvando…" : "Salvar contato"}
              </button>
            </div>
          </div>

          <div className="card" style={{ background: "rgba(255,255,255,0.04)", boxShadow: "none" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>E-mail</div>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>E-mail atual</span>
                <input className="input" value={email} disabled />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>Novo e-mail</span>
                <input
                  className="input"
                  placeholder="seuemail@exemplo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  inputMode="email"
                />
              </label>

              <button className="btn btnPrimary" onClick={saveEmail} disabled={saving}>
                {saving ? "Enviando…" : "Atualizar e-mail"}
              </button>

              <div className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>
                Se a confirmação de e-mail estiver ativada no Supabase, você receberá um link para confirmar.
              </div>
            </div>
          </div>

          <div className="card" style={{ background: "rgba(255,255,255,0.04)", boxShadow: "none" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Senha</div>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>Nova senha (mín. 6 caracteres)</span>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>Confirmar nova senha</span>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>

              <button className="btn btnPrimary" onClick={savePassword} disabled={saving || !canSavePassword}>
                {saving ? "Salvando…" : "Atualizar senha"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
