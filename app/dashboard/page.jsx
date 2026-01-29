"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const ADMIN_EMAIL = "vandilmar19@gmail.com";
const PAGE_SIZE = 120;

const TOPIC_LABEL = {
  geral: "Geral",
  rg: "RG",
  cpf: "CPF",
  cnh: "CNH",
  beneficios: "Benefícios",
  outros: "Outros",
};

function shortText(s = "", max = 90) {
  const t = (s || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + "…";
}

function timeAgoBR(iso) {
  try {
    const d = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - d);

    const min = Math.floor(diff / 60000);
    if (min < 1) return "agora há pouco";
    if (min < 60) return `há ${min} min`;

    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h}h`;

    const days = Math.floor(h / 24);
    return `há ${days}d`;
  } catch {
    return "";
  }
}

function fmtDateBR(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function DashboardPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const isAdmin = useMemo(() => email === ADMIN_EMAIL, [email]);

  const [topic, setTopic] = useState("all");
  const [query, setQuery] = useState("");

  // rows = histórico (mensagens). A UI mostra como “conversas” (session_id)
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [msg, setMsg] = useState("");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // seleção
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("geral");

  // mensagens da conversa selecionada
  const [thread, setThread] = useState([]); // [{role, content, created_at}]
  const [loadingThread, setLoadingThread] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function buildBaseQuery(uid, selectedTopic, search) {
    let q = supabase
      .from("chat_history")
      .select("id,user_id,topic,user_message,assistant_message,created_at,session_id")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (selectedTopic && selectedTopic !== "all") {
      q = q.eq("topic", selectedTopic);
    }

    const s = (search || "").trim();
    if (s) {
      q = q.or(`user_message.ilike.%${s}%,assistant_message.ilike.%${s}%`);
    }

    return q;
  }

  async function loadHistory({ reset = false } = {}) {
    if (!userId) return;

    setLoadingRows(true);
    setMsg("");

    const nextPage = reset ? 0 : page;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      const q = buildBaseQuery(userId, topic, query).range(from, to);
      const { data, error } = await q;

      if (error) {
        setMsg(error.message);
        if (reset) setRows([]);
        setHasMore(false);
      } else {
        const list = data || [];
        if (reset) setRows(list);
        else setRows((prev) => [...prev, ...list]);

        setHasMore(list.length === PAGE_SIZE);
        setPage(nextPage + 1);
      }
    } catch (e) {
      setMsg(e?.message || "Falha ao carregar histórico.");
      if (reset) setRows([]);
      setHasMore(false);
    } finally {
      setLoadingRows(false);
    }
  }

  // ✅ AGRUPA “conversas” por session_id
  const conversations = useMemo(() => {
    const map = new Map();

    for (const r of rows) {
      const sid = r.session_id || "sem-session";
      if (!map.has(sid)) {
        map.set(sid, {
          session_id: sid,
          topic: (r.topic || "geral").toLowerCase(),
          last_created_at: r.created_at,
          last_question: r.user_message || "",
          msgCount: 0,
        });
      }

      const c = map.get(sid);
      c.msgCount += 1;

      const rt = new Date(r.created_at).getTime();
      const ct = new Date(c.last_created_at).getTime();
      if (rt > ct) {
        c.last_created_at = r.created_at;
        c.last_question = r.user_message || c.last_question;
        c.topic = (r.topic || c.topic || "geral").toLowerCase();
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.last_created_at).getTime() - new Date(a.last_created_at).getTime()
    );
  }, [rows]);

  const lastConv = useMemo(() => (conversations.length ? conversations[0] : null), [conversations]);
  const lastTopicLabel = useMemo(() => {
    const t = (lastConv?.topic || "geral").toLowerCase();
    return TOPIC_LABEL[t] || "Geral";
  }, [lastConv]);

  function continueLink(sessionId, topicValue) {
    const t = (topicValue || "geral").toLowerCase();
    if (!sessionId || sessionId === "sem-session") return `/assistente/chat?topic=${encodeURIComponent(t)}`;
    return `/assistente/chat?topic=${encodeURIComponent(t)}&session=${encodeURIComponent(sessionId)}`;
  }

  async function loadThread(sessionId) {
    if (!userId || !sessionId) return;

    setLoadingThread(true);
    setMsg("");
    try {
      const { data, error } = await supabase
        .from("chat_history")
        .select("user_message,assistant_message,created_at,topic,session_id")
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) throw error;

      const t = [];
      for (const row of data || []) {
        if (row.user_message) t.push({ role: "user", content: row.user_message, created_at: row.created_at });
        if (row.assistant_message)
          t.push({ role: "assistant", content: row.assistant_message, created_at: row.created_at });
      }
      setThread(t);
    } catch (e) {
      setMsg(e?.message || "Falha ao abrir conversa.");
      setThread([]);
    } finally {
      setLoadingThread(false);
    }
  }

  function selectConversation(c) {
    setSelectedSession(c.session_id);
    setSelectedTopic((c.topic || "geral").toLowerCase());
    loadThread(c.session_id);
  }

  async function deleteConversation(sessionId) {
    if (!userId || !sessionId || sessionId === "sem-session") {
      alert("Essa conversa não tem session_id. Não é possível excluir com segurança.");
      return;
    }

    const ok = confirm("Excluir esta conversa inteira? (todas as mensagens da sessão)");
    if (!ok) return;

    try {
      const { error } = await supabase.from("chat_history").delete().eq("user_id", userId).eq("session_id", sessionId);

      if (error) throw error;

      setRows((prev) => prev.filter((r) => r.session_id !== sessionId));
      if (selectedSession === sessionId) {
        setSelectedSession("");
        setThread([]);
      }
    } catch (e) {
      alert(e?.message || "Falha ao excluir conversa.");
    }
  }

  async function clearAllConversations() {
    if (!userId) return;

    const ok = confirm("ATENÇÃO: isso vai apagar TODAS as conversas do seu histórico (todas as sessões). Deseja continuar?");
    if (!ok) return;

    try {
      const { error } = await supabase.from("chat_history").delete().eq("user_id", userId);
      if (error) throw error;

      setRows([]);
      setSelectedSession("");
      setThread([]);
      setHasMore(false);
      setPage(0);
    } catch (e) {
      alert(e?.message || "Falha ao limpar tudo.");
    }
  }

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!mounted) return;

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");
      setUserId(user.id || "");
      setLoadingUser(false);

      setPage(0);
      setHasMore(true);
      setSelectedSession("");
      setThread([]);
    }

    boot();
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    setPage(0);
    setHasMore(true);
    setSelectedSession("");
    setThread([]);
    loadHistory({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, topic, query]);

  // auto-seleciona a conversa mais recente (desktop)
  useEffect(() => {
    if (!conversations.length) return;
    if (selectedSession) return;
    const first = conversations[0];
    if (!first?.session_id) return;
    if (first.session_id === "sem-session") return;
    setSelectedSession(first.session_id);
    setSelectedTopic((first.topic || "geral").toLowerCase());
    loadThread(first.session_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  if (loadingUser) {
    return (
      <main className="container">
        <div className="card" style={{ maxWidth: 980, margin: "0 auto" }}>
          <h1 style={{ marginTop: 0 }}>Dashboard</h1>
          <p className="muted">Carregando…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: 1120 }}>
      {/* Top bar */}
      <div className="card" style={{ padding: 14, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              Logado como: <b style={{ color: "var(--text)" }}>{email}</b>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {lastConv ? (
                <>
                  Última conversa: <b style={{ color: "var(--text)" }}>{lastTopicLabel}</b> •{" "}
                  {timeAgoBR(lastConv.last_created_at)}
                </>
              ) : (
                "Você ainda não tem conversas."
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <a className="btn" href="/assistente">
              + Nova conversa
            </a>
            {isAdmin && (
              <a className="btn" href="/admin">
                Admin
              </a>
            )}
            <button className="btn" onClick={logout}>
              Sair
            </button>
          </div>
        </div>

        {msg ? (
          <div className="statusChip err" style={{ marginTop: 10 }}>
            {msg}
          </div>
        ) : null}
      </div>

      {/* Grid */}
      <div className="dashGrid" style={{ gap: 12, marginTop: 14 }}>
        {/* SIDEBAR */}
        <section className="card dashPanel">
          <div style={{ display: "grid", gap: 10, height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900 }}>Conversas</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {conversations.length} conversa(s) no filtro
                </div>
              </div>

              <button className="btn" onClick={clearAllConversations} title="Limpar todas as conversas">
                🧹 Limpar
              </button>
            </div>

            {/* filtros */}
            <div style={{ display: "grid", gap: 8 }}>
              <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="all">Todos os temas</option>
                <option value="rg">RG</option>
                <option value="cpf">CPF</option>
                <option value="cnh">CNH</option>
                <option value="beneficios">Benefícios</option>
                <option value="outros">Outros</option>
                <option value="geral">Geral</option>
              </select>

              <input className="input" placeholder="Buscar conversas…" value={query} onChange={(e) => setQuery(e.target.value)} />

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" onClick={() => loadHistory({ reset: true })} disabled={loadingRows} style={{ flex: 1 }}>
                  {loadingRows ? "Buscando…" : "Buscar"}
                </button>
                {hasMore ? (
                  <button className="btn" onClick={() => loadHistory({ reset: false })} disabled={loadingRows}>
                    +
                  </button>
                ) : null}
              </div>
            </div>

            {/* lista */}
            <div className="dashList">
              {conversations.length === 0 ? (
                <div className="muted" style={{ padding: 8 }}>
                  Nenhuma conversa encontrada.
                </div>
              ) : (
                conversations.map((c) => {
                  const sid = c.session_id;
                  const label = TOPIC_LABEL[(c.topic || "geral").toLowerCase()] || "Geral";
                  const ago = timeAgoBR(c.last_created_at);
                  const title = shortText(c.last_question || "", 52) || "Conversa";
                  const active = sid === selectedSession;
                  const deletable = sid && sid !== "sem-session";

                  return (
                    <div
                      key={sid}
                      style={{
                        borderRadius: 14,
                        border: active ? "1px solid rgba(124,58,237,0.55)" : "1px solid rgba(255,255,255,0.10)",
                        background: active ? "rgba(124,58,237,0.10)" : "rgba(255,255,255,0.04)",
                        padding: 10,
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <button
                        onClick={() => selectConversation(c)}
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          display: "grid",
                          gap: 4,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                          <div
                            style={{
                              fontSize: 12,
                              padding: "4px 8px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(0,0,0,0.18)",
                              width: "fit-content",
                            }}
                          >
                            {label}
                          </div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {ago}
                          </div>
                        </div>

                        <div style={{ fontWeight: 850, lineHeight: 1.2 }}>{title}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {c.msgCount} msg • {fmtDateBR(c.last_created_at)}
                        </div>
                      </button>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <a className="btn" href={continueLink(sid, c.topic)} style={{ padding: "8px 10px", borderRadius: 12 }}>
                          Abrir
                        </a>

                        <button
                          className="btn"
                          title="Excluir conversa"
                          onClick={() => deletable && deleteConversation(sid)}
                          disabled={!deletable}
                          style={{ padding: "8px 10px", borderRadius: 12, opacity: deletable ? 1 : 0.5 }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {hasMore ? (
                <button className="btn" onClick={() => loadHistory({ reset: false })} disabled={loadingRows} style={{ marginTop: 6 }}>
                  {loadingRows ? "Carregando…" : "Carregar mais"}
                </button>
              ) : (
                <div className="muted" style={{ fontSize: 12, padding: "6px 8px" }}>
                  Fim da lista.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* THREAD */}
        <section className="card dashPanel">
          {!selectedSession ? (
            <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
              <div style={{ textAlign: "center", maxWidth: 420 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Selecione uma conversa</div>
                <p className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>
                  Escolha uma conversa ao lado para ver o histórico e continuar no Assistente.
                </p>
                <a className="btn btnPrimary" href="/assistente">
                  Abrir Assistente
                </a>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", gap: 10, height: "100%" }}>
              {/* header */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900 }}>Histórico</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    Tema: <b style={{ color: "var(--text)" }}>{TOPIC_LABEL[selectedTopic] || "Geral"}</b>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a className="btn" href={continueLink(selectedSession, selectedTopic)}>
                    Continuar no Assistente
                  </a>
                  <button className="btn" onClick={() => deleteConversation(selectedSession)}>
                    🗑️ Excluir
                  </button>
                </div>
              </div>

              {/* ✅ THREAD com scroll interno (não vaza) */}
              <div className="dashThread">
                {loadingThread ? (
                  <div className="muted" style={{ padding: 8 }}>
                    Carregando conversa…
                  </div>
                ) : thread.length === 0 ? (
                  <div className="muted" style={{ padding: 8 }}>
                    Nenhuma mensagem nesta conversa.
                  </div>
                ) : null}

                {thread.map((m, i) => (
                  <div key={i} className={"chatBubble " + (m.role === "user" ? "chatUser" : "chatAssistant")}>
                    {m.content}
                  </div>
                ))}
              </div>

              {/* footer */}
              <div className="muted" style={{ fontSize: 12, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <span>Conversa: {String(selectedSession).slice(0, 8)}…</span>
                <span>Dica: “Continuar no Assistente” abre exatamente esta sessão.</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
