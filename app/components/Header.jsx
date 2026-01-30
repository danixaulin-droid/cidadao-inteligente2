"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

const ADMIN_EMAIL = "vandilmar19@gmail.com";

// WhatsApp (somente no menu ☰)
const WHATSAPP_NUMBER = "5517996559435";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Olá! Vim pelo Cidadão Inteligente e preciso de ajuda."
)}`;

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ ESCONDER HEADER APENAS NO CHAT
  // cobre /assistente/chat e qualquer subrota tipo /assistente/chat?topic=...
  if (pathname?.startsWith("/assistente/chat")) {
    return null;
  }

  const [userEmail, setUserEmail] = useState("");
  const [open, setOpen] = useState(false);

  const panelRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserEmail(data?.user?.email ?? "");
    }

    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? "");
      setOpen(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Fecha menu ao mudar de rota
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC para fechar
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Clique fora para fechar
  useEffect(() => {
    function onDown(e) {
      if (!open) return;
      const el = panelRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Trava scroll do body quando o menu abre (mobile feel)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const logged = !!userEmail;
  const isAdmin = logged && userEmail === ADMIN_EMAIL;

  async function logout() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(8, 10, 22, 0.75)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 10,
          paddingBottom: 10,
          gap: 10,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            CI
          </span>

          <div style={{ lineHeight: 1.1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Cidadão Inteligente
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Assistente de documentos
            </div>
          </div>
        </Link>

        {/* Botão menu ☰ */}
        <button
          className="btn"
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
          style={{
            padding: "10px 12px",
            borderRadius: 14,
            fontWeight: 900,
            minWidth: 44,
          }}
        >
          ☰
        </button>
      </div>

      {/* Overlay + Menu (drawer-like) */}
      {open && (
        <>
          {/* overlay */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 40,
            }}
          />

          {/* painel */}
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: 62,
              right: 12,
              left: 12,
              zIndex: 60,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(8, 10, 22, 0.95)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 12 }}>
              <div style={{ display: "grid", gap: 10 }}>
                <Link className="btn" href="/assistente" onClick={() => setOpen(false)}>
                  Assistente
                </Link>

                <Link className="btn" href="/planos" onClick={() => setOpen(false)}>
                  Planos
                </Link>

                <a
                  className="btn"
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                >
                  WhatsApp
                </a>

                {logged && (
                  <>
                    <Link className="btn" href="/dashboard" onClick={() => setOpen(false)}>
                      Dashboard
                    </Link>

                    <Link className="btn" href="/meus-dados" onClick={() => setOpen(false)}>
                      Meus dados
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <Link className="btn" href="/admin" onClick={() => setOpen(false)}>
                    Admin
                  </Link>
                )}

                {logged ? (
                  <button className="btn btnPrimary" onClick={logout}>
                    Sair
                  </button>
                ) : (
                  <Link className="btn btnPrimary" href="/login" onClick={() => setOpen(false)}>
                    Entrar
                  </Link>
                )}
              </div>

              {logged && (
                <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                  Logado como: <b style={{ color: "var(--text)" }}>{userEmail}</b>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
