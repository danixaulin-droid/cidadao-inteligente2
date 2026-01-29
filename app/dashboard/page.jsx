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

function shortText(s = "", max = 64) {
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
    if (min < 1) return "agora";
    if (min < 60) return `${min}m`;

    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;

    const days = Math.floor(h / 24);
    return `${days}d`;
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

  // rows = mensagens (chat_history)
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [msg, setMsg] = useState("");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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

  // ✅ Agrupa conversas por session_id (lista de conversas)
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

  function openConversation(c) {
    router.push(continueLink(c.session_id, c.topic));
  }

  async function deleteConversation(sessionId) {
    if (!userId || !sessionId || sessionId === "sem-session") {
      alert("Essa conversa não tem session_id. Não é possível excluir com segurança.");
      return;
    }

    const ok = confirm("Excluir esta conversa inteira? (todas as mensagens da sessão)");
    if (!ok) return;

    try {
      const { error } = await supabase
        .from("chat_history")
        .delete()
        .eq("user_id", userId)
        .eq("session_id", sessionId);

      if (error) throw error;

      setRows((prev) => prev.filter((r) => r.session_id !== sessionId));
    } catch (e) {
      alert(e?.message || "Falha ao excluir conversa.");
    }
  }

  async function clearAllConversations() {
    if (!userId) return;

    const ok = confirm("ATENÇÃO: isso vai apagar TODAS as conversas do seu histórico. Deseja continuar?");
    if (!ok) return;

    try {
      const { error } = await supabase.from("chat_history").delete().eq("user_id", userId);
      if (error) throw error;

      setRows([]);
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
    loadHistory({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, topic, query]);

  if (loadingUser) {
    return (
      <main className="container">
        <div className="card dashTop">
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p className="muted" style={{ marginTop: 8 }}>Carregando…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: 980 }}>
      {/* Top */}
      <div className="card dashTop">
        <div className="dashTopRow">
          <div style={{ minWidth: 0 }}>
            <h1 className="dashTitle">Dashboard</h1>
            <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              Logado como: <b style={{ color: "var(--text)" }}>{email}</b>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {lastConv ? (
                <>
                  Última: <b style={{ color: "var(--text)" }}>{lastTopicLabel}</b> • {timeAgoBR(lastConv.last_created_at)}
                </>
              ) : (
                "Você ainda não tem conversas."
              )}
            </div>
          </div>

          <div className="dashActions">
            <a className="btn" href="/assistente">+ Nova conversa</a>
            {isAdmin && <a className="btn" href="/admin">Admin</a>}
            <button className="btn" onClick={logout}>Sair</button>
          </div>
        </div>

        {msg ? <div className="statusChip err" style={{ marginTop: 10 }}>{msg}</div> : null}
      </div>

      {/* Filtros + Lista */}
      <div className="card dashCard" style={{ marginTop: 12 }}>
        <div className="dashHeaderRow">
          <div style={{ minWidth: 0 }}>
            <div className="dashSectionTitle">Conversas</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              {conversations.length} no filtro
            </div>
          </div>

          <button className="btn" onClick={clearAllConversations} title="Limpar todas">
            🧹 Limpar
          </button>
        </div>

        <div className="dashFilters">
          <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="all">Todos os temas</option>
            <option value="rg">RG</option>
            <option value="cpf">CPF</option>
            <option value="cnh">CNH</option>
            <option value="beneficios">Benefícios</option>
            <option value="outros">Outros</option>
            <option value="geral">Geral</option>
          </select>

          <input
            className="input"
            placeholder="Buscar… (ex: RG, CNH, boleto)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button className="btn" onClick={() => loadHistory({ reset: true })} disabled={loadingRows}>
            {loadingRows ? "Buscando…" : "Buscar"}
          </button>
        </div>

        <div className="dashList">
          {conversations.length === 0 ? (
            <div className="muted" style={{ padding: 10 }}>
              Nenhuma conversa encontrada.
            </div>
          ) : (
            conversations.map((c) => {
              const sid = c.session_id;
              const label = TOPIC_LABEL[(c.topic || "geral").toLowerCase()] || "Geral";
              const ago = timeAgoBR(c.last_created_at);
              const title = shortText(c.last_question || "", 58) || "Conversa";
              const deletable = sid && sid !== "sem-session";

              return (
                <div className="convoItem" key={sid}>
                  <div className="convoMain" onClick={() => openConversation(c)} role="button" tabIndex={0}>
                    <div className="convoTop">
                      <span className="convoTag">{label}</span>
                      <span className="muted" style={{ fontSize: 12 }}>{ago}</span>
                    </div>

                    <div className="convoTitle">{title}</div>

                    <div className="convoMeta muted">
                      {c.msgCount} msg • {fmtDateBR(c.last_created_at)}
                    </div>
                  </div>

                  <div className="convoActions">
                    <button
                      className="iconSquare"
                      title="Abrir"
                      onClick={() => openConversation(c)}
                      aria-label="Abrir"
                    >
                      ↗
                    </button>

                    <button
                      className="iconSquare"
                      title="Excluir"
                      onClick={() => deletable && deleteConversation(sid)}
                      disabled={!deletable}
                      aria-label="Excluir"
                      style={{ opacity: deletable ? 1 : 0.55 }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 10 }}>
            <div className="muted" style={{ fontSize: 12 }}>
              {hasMore ? "Carregue mais para ver conversas antigas." : "Fim da lista."}
            </div>

            {hasMore ? (
              <button className="btn" onClick={() => loadHistory({ reset: false })} disabled={loadingRows}>
                {loadingRows ? "Carregando…" : "Carregar mais"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
