"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Conta criada! Agora faça login.");
    setTimeout(() => router.push("/login"), 1000);
  }

  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 460, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Criar conta</h1>

        <form
          onSubmit={onSubmit}
          style={{ display: "grid", gap: 12, marginTop: 12 }}
        >
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="input"
            type="password"
            placeholder="Senha (mín. 6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <button className="btn btnPrimary" type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </button>

          <a className="btn" href="/login">
            Já tenho conta
          </a>

          {msg && (
            <p style={{ marginTop: 4, marginBottom: 0 }} className="muted">
              {msg}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
