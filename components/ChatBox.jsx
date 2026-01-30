"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const BUCKET_DEFAULT = "uploads";

/* ===== helpers ===== */
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
  if (/\.(png|jpg|jpeg|webp|heic)$/.test(n)) return "image";
  return "unknown";
}

function inferTopicFromContext(context = "") {
  const c = (context || "").toLowerCase();
  if (c.includes("rg")) return "rg";
  if (c.includes("cpf")) return "cpf";
  if (c.includes("cnh")) return "cnh";
  if (c.includes("benef")) return "beneficios";
  return "geral";
}

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function storageKey(userId, topic) {
  return `ci:chat_session:${userId}:${topic}`;
}

/* ===== component ===== */
export default function ChatBox({
  context = "",
  enableUpload = true,
  bucket = BUCKET_DEFAULT,
  sessionFromUrl = "",
}) {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attached, setAttached] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [errText, setErrText] = useState("");

  const topic = useMemo(() => inferTopicFromContext(context), [context]);

  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");

  const endRef = useRef(null);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const contextRef = useRef(context);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  function scrollBottom(force = false) {
    endRef.current?.scrollIntoView({ behavior: force ? "auto" : "smooth" });
  }

  useEffect(() => {
    scrollBottom();
  }, [messages, loading, uploading, historyLoading]);

  /* textarea auto height */
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "0px";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 140) + "px";
  }, [input]);

  /* auth + session */
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      const user = data?.user;
      if (!user) return;

      setUserId(user.id);
      const key = storageKey(user.id, topic);

      if (sessionFromUrl) {
        localStorage.setItem(key, sessionFromUrl);
        setSessionId(sessionFromUrl);
        return;
      }

      const saved = localStorage.getItem(key);
      if (saved) setSessionId(saved);
      else {
        const fresh = uuid();
        localStorage.setItem(key, fresh);
        setSessionId(fresh);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [topic, sessionFromUrl]);

  /* load history */
  useEffect(() => {
    if (!userId || !sessionId) return;

    (async () => {
      setHistoryLoading(true);
      setErrText("");

      try {
        const { data, error } = await supabase
          .from("chat_history")
          .select("user_message, assistant_message")
          .eq("user_id", userId)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        const loaded = [];
        for (const r of data || []) {
          if (r.user_message) loaded.push({ role: "user", content: r.user_message });
          if (r.assistant_message) loaded.push({ role: "assistant", content: r.assistant_message });
        }
        setMessages(loaded);
      } catch (e) {
        setErrText("Erro ao carregar histórico.");
      } finally {
        setHistoryLoading(false);
        requestAnimationFrame(() => scrollBottom(true));
      }
    })();
  }, [userId, sessionId]);

  async function send() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const payload = {
        message: userText,
        context: contextRef.current,
        sessionId,
        ...(attached && {
          fileUrl: attached.fileUrl,
          fileName: attached.displayName,
          fileType: attached.fileType,
        }),
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data?.answer || "Erro ao responder." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Erro de conexão." }]);
    } finally {
      setLoading(false);
      setAttached(null);
      requestAnimationFrame(() => taRef.current?.focus());
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <section className="chatRoot">
      <div className="chatTopBar">
        <button onClick={() => router.push("/dashboard")}>⬅️</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => location.reload()}>🔄</button>
      </div>

      <div className="chatScroll">
        {errText && <div className="muted">{errText}</div>}
        {messages.map((m, i) => (
          <div key={i} className={`chatBubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="chatBubble assistant">Digitando…</div>}
        <div ref={endRef} />
      </div>

      <div className="chatComposer">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Digite sua pergunta…"
        />
        <button onClick={send} disabled={loading}>
          Enviar
        </button>
      </div>
    </section>
  );
}
