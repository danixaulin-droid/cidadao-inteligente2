import { createSupabaseServerClient } from "../lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "vandilmar19@gmail.com";

const TOPICS = [
  { key: "rg", label: "RG", emoji: "🪪", desc: "1ª via, 2ª via, documentos necessários" },
  { key: "cpf", label: "CPF", emoji: "🧾", desc: "regularizar, consultar, atualizar dados" },
  { key: "cnh", label: "CNH", emoji: "🚗", desc: "2ª via, renovação, pontuação, prazos" },
  { key: "beneficios", label: "Benefícios", emoji: "🏛️", desc: "INSS, Auxílios, BPC, cadastros" },
  { key: "boletos", label: "Boletos", emoji: "💳", desc: "entender cobrança, validar, pagar" },
  { key: "outros", label: "Outros", emoji: "✨", desc: "qualquer serviço/documento" },
];

function qs(obj = {}) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();
  const userEmail = userData?.user?.email ?? "";
  const logged = !!userEmail;
  const isAdmin = logged && userEmail === ADMIN_EMAIL;

  // textos dinâmicos (opcional)
  const { data } = await supabase
    .from("app_settings")
    .select("key,value")
    .in("key", ["home_title", "home_subtitle"]);

  const map = {};
  for (const row of data || []) map[row.key] = row.value;

  const title = map.home_title || "Cidadão Inteligente";
  const subtitle =
    map.home_subtitle ||
    "Um assistente de IA que te guia em RG, CPF, CNH, benefícios e documentos — com passos claros e rápidos.";

  const primaryHref = logged ? "/assistente" : "/login";
  const primaryLabel = logged ? "Abrir Assistente" : "Entrar";

  return (
    <main className="container" style={{ maxWidth: 1040 }}>
      {/* HERO */}
      <section
        className="card"
        style={{
          padding: 18,
          borderRadius: 24,
          overflow: "hidden",
          background:
            "radial-gradient(920px 340px at 18% 0%, rgba(16,163,127,0.18), transparent 60%)," +
            "radial-gradient(720px 320px at 86% 8%, rgba(59,130,246,0.14), transparent 62%)," +
            "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ display: "grid", gap: 14 }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.18)",
              }}
            >
              ⚡ Respostas diretas
            </span>
            <span
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.18)",
              }}
            >
              📎 Anexo de PDF/Imagem
            </span>
            <span
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.18)",
              }}
            >
              🧠 Histórico por sessão
            </span>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 38, letterSpacing: -0.8, lineHeight: 1.05 }}>
              {title}
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: 16, lineHeight: 1.65, maxWidth: 72 + "ch" }}>
              {subtitle}
            </p>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <a
              className="btn btnPrimary"
              href={primaryHref}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 900,
              }}
            >
              ✨ {primaryLabel}
            </a>

            {logged && (
              <a className="btn" href="/dashboard" style={{ padding: "14px 16px", borderRadius: 14 }}>
                🧠 Dashboard
              </a>
            )}

            <a className="btn" href="/planos" style={{ padding: "14px 16px", borderRadius: 14 }}>
              💎 Planos
            </a>

            {isAdmin && (
              <a className="btn" href="/admin" style={{ padding: "14px 16px", borderRadius: 14 }}>
                ⚙️ Admin
              </a>
            )}
          </div>

          {/* QUICK TOPICS */}
          <div style={{ marginTop: 6 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Comece por um tema 👇</div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {TOPICS.map((t) => {
                const href = logged
                  ? `/assistente/chat${qs({ topic: t.key })}`
                  : "/login";

                return (
                  <a
                    key={t.key}
                    className="card"
                    href={href}
                    style={{
                      boxShadow: "none",
                      borderRadius: 18,
                      padding: 14,
                      background: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      display: "grid",
                      gap: 6,
                      transition: "transform 0.08s ease, background 0.15s ease, border-color 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 950 }}>
                        {t.emoji} {t.label}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          padding: "4px 8px",
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                        }}
                      >
                        Abrir →
                      </span>
                    </div>
                    <div className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
                      {t.desc}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div
            className="card"
            style={{
              marginTop: 10,
              background: "rgba(0,0,0,0.20)",
              boxShadow: "none",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 950 }}>Como funciona (bem simples) ⚡</div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                }}
              >
                <div style={{ padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ fontWeight: 900 }}>1) Escolha o tema</div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                    RG, CPF, CNH, benefícios… eu já começo te guiando.
                  </div>
                </div>

                <div style={{ padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ fontWeight: 900 }}>2) Faça a pergunta</div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                    Eu respondo com passo a passo e erros comuns pra evitar.
                  </div>
                </div>

                <div style={{ padding: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ fontWeight: 900 }}>3) (Opcional) Anexe arquivo</div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                    PDF ou imagem: eu analiso e te digo o que falta/onde está o problema.
                  </div>
                </div>
              </div>

              {/* EXAMPLES */}
              <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
                <div style={{ fontWeight: 900 }}>Exemplos rápidos (copiar e colar) ✍️</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    "✅ Preciso tirar 2ª via do RG. Quais documentos e como agendar?",
                    "✅ Meu CPF está irregular. O que fazer e onde resolver?",
                    "✅ Quero renovar a CNH. Quais passos e taxas normalmente?",
                    "✅ Anexei um boleto. Ele parece verdadeiro? O que devo conferir?",
                  ].map((ex, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.03)",
                        fontSize: 13,
                        lineHeight: 1.45,
                      }}
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              </div>

              <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
                Privacidade: não envie senhas, códigos de verificação, dados bancários completos ou informações sensíveis desnecessárias.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESPAÇO FINAL */}
      <div style={{ height: 18 }} />
    </main>
  );
}
