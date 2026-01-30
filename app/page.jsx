import { createSupabaseServerClient } from "../lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "vandilmar19@gmail.com";

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
    "Seu assistente de IA para documentos e serviços — pergunte qualquer coisa e receba o passo a passo.";

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
            <p
              className="muted"
              style={{
                margin: 0,
                fontSize: 16,
                lineHeight: 1.65,
                maxWidth: "72ch",
              }}
            >
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

          {/* AI-FIRST (SEM CATEGORIAS) */}
          <div
            className="card"
            style={{
              marginTop: 8,
              background: "rgba(0,0,0,0.20)",
              boxShadow: "none",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 950, fontSize: 16 }}>Pergunte qualquer coisa 👇</div>
                <div className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>
                  Sem categorias. O chat geral resolve tudo: RG, CPF, CNH, benefícios, boletos, dúvidas e documentos.
                </div>
              </div>

              {/* Ações rápidas (cara de IA) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                }}
              >
                <a
                  className="card"
                  href={primaryHref}
                  style={{
                    boxShadow: "none",
                    borderRadius: 18,
                    padding: 14,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ fontWeight: 950 }}>💬 Chat geral</div>
                  <div className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
                    Faça a pergunta e receba passo a passo.
                  </div>
                </a>

                <a
                  className="card"
                  href={primaryHref}
                  style={{
                    boxShadow: "none",
                    borderRadius: 18,
                    padding: 14,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ fontWeight: 950 }}>📎 Analisar PDF/Imagem</div>
                  <div className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
                    Anexe um arquivo e eu digo o que falta/onde está o erro.
                  </div>
                </a>

                <a
                  className="card"
                  href={logged ? "/dashboard" : "/login"}
                  style={{
                    boxShadow: "none",
                    borderRadius: 18,
                    padding: 14,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ fontWeight: 950 }}>🧠 Suas sessões</div>
                  <div className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
                    Veja histórico e retome conversas.
                  </div>
                </a>
              </div>

              {/* Exemplos (sem “temas”) */}
              <div style={{ display: "grid", gap: 8, marginTop: 2 }}>
                <div style={{ fontWeight: 900 }}>Exemplos rápidos (copiar e colar) ✍️</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    "✅ Preciso tirar 2ª via de um documento. Quais passos e o que levar?",
                    "✅ Meu CPF está irregular. Como resolver e onde consultar?",
                    "✅ Vou renovar a CNH. Quais etapas e taxas normalmente?",
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

          {/* HOW IT WORKS (SEM “ESCOLHA TEMA”) */}
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
                <div
                  style={{
                    padding: 10,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>1) Abra o chat</div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                    Você entra no assistente e já pode perguntar.
                  </div>
                </div>

                <div
                  style={{
                    padding: 10,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>2) Faça a pergunta</div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                    Eu respondo com passo a passo e o que evitar.
                  </div>
                </div>

                <div
                  style={{
                    padding: 10,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>3) (Opcional) Anexe arquivo</div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                    PDF ou imagem: eu analiso e te digo o que fazer.
                  </div>
                </div>
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
