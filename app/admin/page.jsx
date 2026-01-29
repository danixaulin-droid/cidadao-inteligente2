"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AdminPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [settings, setSettings] = useState({
    whatsapp_number: "",
    home_title: "",
    home_subtitle: "",
    whatsapp_message: "",
  });

  async function loadData() {
    setLoading(true);
    setMsg(null);

    const { data: userData } = await supabase.auth.getUser();
    setEmail(userData?.user?.email ?? "");

    const { data, error } = await supabase
      .from("app_settings")
      .select("key,value")
      .in("key", [
        "whatsapp_number",
        "home_title",
        "home_subtitle",
        "whatsapp_message",
      ]);

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    const next = { ...settings };
    for (const row of data || []) {
      next[row.key] = row.value;
    }
    setSettings(next);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function save() {
    setSaving(true);
    setMsg(null);

    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value ?? "",
    }));

    const { error } = await supabase.from("app_settings").upsert(rows, {
      onConflict: "key",
    });

    setSaving(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Salvo com sucesso ✅");
  }

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Painel Admin</h1>
        <p>Carregando...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>Painel Admin</h1>

      <p>
        Logado como: <b>{email}</b>
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <a href="/dashboard">Ir para Dashboard</a>
        <button onClick={logout}>Sair</button>
        <button onClick={loadData}>Recarregar</button>
      </div>

      <hr style={{ margin: "24px 0" }} />

      <h2>Configurações do App</h2>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <label>
          <div>WhatsApp (com DDI)</div>
          <input
            value={settings.whatsapp_number}
            onChange={(e) =>
              setSettings((s) => ({ ...s, whatsapp_number: e.target.value }))
            }
            placeholder="+5517996559435"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          <div>Mensagem padrão do WhatsApp</div>
          <textarea
            value={settings.whatsapp_message}
            onChange={(e) =>
              setSettings((s) => ({ ...s, whatsapp_message: e.target.value }))
            }
            placeholder="Olá! Vim pelo Cidadão Inteligente e preciso de ajuda."
            rows={3}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          <div>Título da Home</div>
          <input
            value={settings.home_title}
            onChange={(e) =>
              setSettings((s) => ({ ...s, home_title: e.target.value }))
            }
            placeholder="Cidadão Inteligente"
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          <div>Subtítulo da Home</div>
          <input
            value={settings.home_subtitle}
            onChange={(e) =>
              setSettings((s) => ({ ...s, home_subtitle: e.target.value }))
            }
            placeholder="Seu assistente..."
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <button onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>

        {msg && (
          <p style={{ color: msg.includes("✅") ? "green" : "crimson" }}>{msg}</p>
        )}
      </div>
    </main>
  );
}
