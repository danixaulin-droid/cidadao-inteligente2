"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "vandilmar19@gmail.com";

// WhatsApp (somente no menu ☰)
const WHATSAPP_NUMBER = "5517996559435";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Olá! Vim pelo Cidadão Inteligente e preciso de ajuda."
)}`;

export default function Header() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [open, setOpen] = useState(false);

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
        <a
          href="/"
          onClick={() => setOpen(false)}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
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
            }}
          >
            CI
          </span>

          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800 }}>Cidadão Inteligente</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Assistente de documentos
            </div>
          </div>
        </a>

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

      {/* Menu dropdown */}
      {open && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(8, 10, 22, 0.92)",
          }}
        >
          <div className="container" style={{ padding: "12px 16px" }}>
            <div style={{ display: "grid", gap: 10 }}>
              <a className="btn" href="/assistente" onClick={() => setOpen(false)}>
                Assistente
              </a>

              <a className="btn" href="/planos" onClick={() => setOpen(false)}>
                Planos
              </a>

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
                  <a className="btn" href="/dashboard" onClick={() => setOpen(false)}>
                    Dashboard
                  </a>
                  <a className="btn" href="/meus-dados" onClick={() => setOpen(false)}>
                    Meus dados
                  </a>
                </>
              )}

              {isAdmin && (
                <a className="btn" href="/admin" onClick={() => setOpen(false)}>
                  Admin
                </a>
              )}

              {logged ? (
                <button className="btn btnPrimary" onClick={logout}>
                  Sair
                </button>
              ) : (
                <a
                  className="btn btnPrimary"
                  href="/login"
                  onClick={() => setOpen(false)}
                >
                  Entrar
                </a>
              )}
            </div>

            {logged && (
              <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                Logado como: <b>{userEmail}</b>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
