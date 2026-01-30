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

  const title = map.home_title || "Cidadão Inteligente Brasil";
  const subtitle =
    map.home_subtitle ||
    "Explique com suas palavras o que você precisa. Eu cuido do resto.";

  const primaryHref = logged ? "/assistente" : "/login";
  const primaryLabel = logged ? "Abrir Assistente" : "Entrar";

  return (
    <main className="container" style={{ maxWidth: 960 }}>
      <section
        className="card"
        style={{
          padding: 22,
          borderRadius: 26,
          overflow: "hidden",
          background:
            "radial-gradient(900px 360px at 20% 0%, rgba(16,163,127,0.22), transparent 60%)," +
            "radial-gradient(720px 340px at 85% 10%, rgba(59,130,246,0.18), transparent 62%)," +
            "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              "⚡ Respostas diretas",
              "📎 PDF e Imagens",
              "🧠 Histórico automático",
            ].map((b) => (
              <span
                key={b}
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.18)",
                }}
              >
                {b}
              </span>
            ))}
          </div>

          {/* Title */}
          <div style={{ display: "grid", gap: 10 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 40,
                letterSpacing: -1,
                lineHeight: 1.05,
              }}
            >
              {title}
            </h1>

            <p
              className="muted"
              style={{
                margin: 0,
                fontSize: 17,
                lineHeight: 1.65,
                maxWidth: "68ch",
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              className="btn btnPrimary"
              href={primaryHref}
              style={{
                padding: "16px 20px",
                borderRadius: 16,
                fontSize: 16,
                fontWeight: 900,
              }}
            >
              ✨ {primaryLabel}
            </a>

            {logged && (
              <a
                className="btn"
                href="/dashboard"
                style={{ padding: "16px 18px", borderRadius: 16 }}
              >
                🧠 Dashboard
              </a>
            )}

            <a
              className="btn"
              href="/planos"
              style={{ padding: "16px 18px", borderRadius: 16 }}
            >
              💎 Planos
            </a>

            {isAdmin && (
              <a
                className="btn"
                href="/admin"
                style={{ padding: "16px 18px", borderRadius: 16 }}
              >
                ⚙️ Admin
              </a>
            )}
          </div>

          {/* IA MESSAGE */}
          <div
            style={{
              marginTop: 6,
              padding: 16,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            💬 <strong>Pergunte qualquer coisa.</strong>
            <br />
            RG, CPF, CNH, benefícios, boletos, dúvidas, documentos, PDFs ou
            imagens.
          </div>

          {/* Examples */}
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>Exemplos rápidos ✍️</div>

            {[
              "Preciso tirar a 2ª via do RG. Como faço?",
              "Meu CPF está irregular. O que devo fazer?",
              "Quero renovar a CNH. Quais são os passos?",
              "Anexei um PDF. Está tudo certo com esse documento?",
            ].map((ex, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: 13,
                }}
              >
                {ex}
              </div>
            ))}
          </div>

          <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
            Privacidade: não envie senhas, códigos, dados bancários completos ou
            informações sensíveis desnecessárias.
          </div>
        </div>
      </section>

      <div style={{ height: 20 }} />
    </main>
  );
}
