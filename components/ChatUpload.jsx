"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const BUCKET = "uploads";

function isImageFile(name = "") {
  const n = name.toLowerCase();
  return (
    n.endsWith(".png") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".webp") ||
    n.endsWith(".heic")
  );
}

export default function ChatUpload({ onUseInChat }) {
  const [userId, setUserId] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || "");
      setLoadingUser(false);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    refreshFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function refreshFiles() {
    setMsg("");
    const { data, error } = await supabase.storage.from(BUCKET).list(`${userId}`, {
      limit: 50,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    setFiles(data || []);
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMsg("");

    const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

    setUploading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Arquivo enviado ✅");
    e.target.value = "";
    await refreshFiles();
  }

  async function useInChat(fileName) {
    if (!onUseInChat) return;

    const path = `${userId}/${fileName}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);

    if (error) {
      setMsg(error.message);
      return;
    }

    onUseInChat({
      fileName,
      fileUrl: data.signedUrl,
      kind: isImageFile(fileName) ? "image" : "file",
    });

    setMsg(`Ok ✅ Vou usar "${fileName}" no chat.`);
  }

  if (loadingUser) {
    return (
      <div className="card" style={{ background: "white", marginTop: 16 }}>
        <div style={{ fontWeight: 700 }}>Enviar documento aqui</div>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>Carregando...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="card" style={{ background: "white", marginTop: 16 }}>
        <div style={{ fontWeight: 700 }}>Enviar documento aqui</div>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Você precisa estar logado para enviar arquivos.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ background: "white", marginTop: 16 }}>
      <div style={{ fontWeight: 700 }}>Enviar documento aqui</div>
      <p className="muted" style={{ marginTop: 6 }}>
        Envie foto (RG/CNH) ou PDF. Depois clique em <b>Usar no Chat</b>.
      </p>

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        <input className="input" type="file" onChange={onPickFile} disabled={uploading} />
        <button className="btn" onClick={refreshFiles} disabled={uploading}>
          {uploading ? "Enviando..." : "Recarregar lista"}
        </button>
        {msg && <p className="muted" style={{ margin: 0 }}>{msg}</p>}
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {files.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Nenhum arquivo enviado ainda.</p>
        ) : (
          files.map((f) => (
            <div
              key={f.name}
              className="card"
              style={{ padding: 12, borderRadius: 12, background: "white" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{f.name}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    {(f.metadata?.size ?? 0).toLocaleString("pt-BR")} bytes
                  </div>
                </div>

                <div className="nav" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button className="btn btnPrimary" onClick={() => useInChat(f.name)}>
                    Usar no Chat
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
