"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const BUCKET_DEFAULT = "uploads";

function isAllowedFile(name = "") {
  const n = name.toLowerCase();
  return (
    n.endsWith(".pdf") ||
    n.endsWith(".png") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".webp") ||
    n.endsWith(".heic")
  );
}

function getFileType(name = "") {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".webp") || n.endsWith(".heic"))
    return "image";
  return "unknown";
}

function inferTopicFromContext(context = "") {
  const c = (context || "").toLowerCase();
  if (c.includes("rg")) return "rg";
  if (c.includes("cpf")) return "cpf";
  if (c.includes("cnh")) return "cnh";
  if (c.includes("benef")) return "beneficios";
  if (c.includes("outros")) return "outros";
  return "geral";
}

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function storageKey(userId, topic) {
  return `ci:chat_session:${userId}:${topic}`;
}

export default function ChatBox({
  context = "",
  enableUpload = true,
  bucket = BUCKET_DEFAULT,
  sessionFromUrl = "",
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [attached, setAttached] = useState(null);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [errText, setErrText] = useState("");

  const topic = useMemo(() => inferTopicFromContext(context), [context]);

  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");

  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context || "";
  }, [context]);

  const endRef = useRef(null);
  const fileRef = useRef(null);
  const taRef = useRef(null);

  function scrollToBottom(force = false) {
    if (force) endRef.current?.scrollIntoView({ behavior: "auto" });
    else endRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, uploading, loading, historyLoading]);

  // auto-resize textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    const h = Math.min(el.scrollHeight, 140);
    el.style.height = h + "px";
  }, [input]);

  // boot auth + session
  useEffect(() => {
    let mounted = true;

    async function boot() {
      setErrText("");

      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!mounted) return;

      if (!user) {
        setUserId("");
        setSessionId("");
        setMessages([]);
        return;
      }

      setUserId(user.id);

      const key = storageKey(user.id, topic);

      // 1) session da URL
      const incoming = (sessionFromUrl || "").trim();
      if (incoming) {
        localStorage.setItem(key, incoming);
        setSessionId(incoming);
        return;
      }

      // 2) última sessão salva
      const saved = localStorage.getItem(key);
      if (saved) {
        setSessionId(saved);
        return;
      }

      // 3) nova
      const fresh = uuid();
      localStorage.setItem(key, fresh);
      setSessionId(fresh);
    }

    boot();
    return () => {
      mounted = false;
    };
  }, [topic, sessionFromUrl]);

  async function loadHistory({ reset = true } = {}) {
    setErrText("");
    setHistoryLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        setErrText("Você precisa estar logado para ver o histórico.");
        if (reset) setMessages([]);
        return;
      }

      if (!sessionId) {
        setErrText("Sessão ainda não foi criada. Tente novamente.");
        if (reset) setMessages([]);
        return;
      }

      const { data, error } = await supabase
        .from("chat_history")
        .select("user_message, assistant_message, created_at, topic, session_id")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) throw new Error(error.message);

      const loaded = [];
      for (const row of data || []) {
        if (row.user_message) loaded.push({ role: "user", content: row.user_message });
        if (row.assistant_message) loaded.push({ role: "assistant", content: row.assistant_message });
      }

      setMessages(loaded);
    } catch (e) {
      setErrText(e?.message || "Falha ao carregar histórico.");
      if (reset) setMessages([]);
    } finally {
      setHistoryLoading(false);
      requestAnimationFrame(() => scrollToBottom(true));
    }
  }

  useEffect(() => {
    if (!userId || !sessionId) return;
    loadHistory({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sessionId]);

  async function uploadAndAttach(file) {
    if (!file) return;

    if (!isAllowedFile(file.name)) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Formato não suportado. Envie PDF ou imagem (JPG/PNG/WEBP/HEIC)." },
      ]);
      return;
    }

    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        setMessages((m) => [...m, { role: "assistant", content: "Você precisa estar logado para enviar arquivo." }]);
        return;
      }

      const displayName = file.name.replace(/[^\w.\-() ]+/g, "_");
      const storagePath = `${user.id}/${Date.now()}-${displayName}`;

      const { error: upErr } = await supabase.storage.from(bucket).upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

      if (upErr) throw new Error(upErr.message);

      const { data: signed, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 300);
      if (signErr) throw new Error(signErr.message);

      setAttached({
        displayName,
        storagePath,
        fileUrl: signed.signedUrl,
        fileType: getFileType(displayName),
      });
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: e?.message || "Falha ao anexar arquivo." }]);
    } finally {
      setUploading(false);
      requestAnimationFrame(() => taRef.current?.focus());
    }
  }

  async function send() {
    if (!input.trim() || loading) return;

    setErrText("");

    const userText = input.trim();
    setInput("");

    setMessages((m) => [...m, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const payload = {
        message: userText,
        context: contextRef.current,
        sessionId,
      };

      if (attached?.fileUrl) {
        payload.fileUrl = attached.fileUrl;
        payload.fileName = attached.displayName || "arquivo";
        payload.fileType = attached.fileType || "unknown";
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.answer) {
        setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
      } else if (res.status === 402) {
        const msg = (data?.error || "Para continuar, escolha um plano.") + "\n\n👉 Abra **Planos**: /planos";
        setMessages((m) => [...m, { role: "assistant", content: msg }]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data?.error || "Desculpe, não consegui responder agora." },
        ]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Erro ao conectar com a IA." }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => taRef.current?.focus());
    }
  }

  function newConversation() {
    if (!userId) return;

    const fresh = uuid();
    const key = storageKey(userId, topic);
    localStorage.setItem(key, fresh);
    setSessionId(fresh);

    setMessages([]);
    setAttached(null);
    setErrText("");
    setInput("");
    requestAnimationFrame(() => taRef.current?.focus());
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <section className="chatFull">
      {/* Toolbar mínima (sem título) */}
      <div className="chatMiniBar">
        <button className="btn" onClick={() => loadHistory({ reset: true })} disabled={historyLoading || loading}>
          {historyLoading ? "Carregando..." : "Recarregar"}
        </button>
        <button className="btn" onClick={newConversation} disabled={loading || historyLoading}>
          Nova
        </button>
      </div>

      <div className="chatMessages chatMessagesFull">
        {errText ? (
          <div className="muted" style={{ fontSize: 14 }}>
            {errText}
          </div>
        ) : messages.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>
            {historyLoading ? "Carregando histórico..." : "Sem mensagens ainda. Envie sua primeira pergunta 🙂"}
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div key={i} className={`chatBubble ${m.role === "user" ? "chatUser" : "chatAssistant"}`}>
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="chatBubble chatAssistant">
            <span className="chatTyping">
              <span className="typingDot" />
              <span className="typingDot" />
              <span className="typingDot" />
            </span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="composer composerFixed">
        {enableUpload && (attached?.displayName || uploading) && (
          <div className="fileChipRow">
            {uploading ? (
              <div className="fileChip">📎 Enviando arquivo…</div>
            ) : (
              <div className="fileChip">
                📎 <span>{attached.displayName}</span>
                <button type="button" onClick={() => setAttached(null)} disabled={loading} aria-label="Remover anexo">
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        <div className="composerInner">
          {enableUpload && (
            <>
              <button
                type="button"
                className="iconBtn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || loading}
                title="Anexar arquivo"
              >
                📎
              </button>

              <input
                ref={fileRef}
                type="file"
                style={{ display: "none" }}
                disabled={uploading || loading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) uploadAndAttach(f);
                }}
              />
            </>
          )}

          <textarea
            ref={taRef}
            className="composerInput"
            placeholder="Digite sua pergunta… (Enter envia • Shift+Enter quebra linha)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
            rows={1}
          />

          <div className="composerActions">
            <button className="btn btnPrimary" onClick={send} disabled={loading || !input.trim()}>
              {loading ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
