import { createSupabaseServerClient } from "../lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "vandilmar19@gmail.com";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();
  const userEmail = userData?.user?.email ?? "";
  const logged = !!userEmail;
  const isAdmin = logged && userEmail === ADMIN_EMAIL;

  const { data } = await supabase
    .from("app_settings")
    .select("key,value")
    .in("key", ["home_title", "home_subtitle"]);

  const map = {};
  for (const row of data || []) map[row.key] = row.value;

  const title = map.home_title || "Cidadão Inteligente";
  const subtitle =
    map.home_subtitle ||
    "Tire dúvidas e entenda documentos (RG, CPF, CNH, benefícios) com ajuda da IA.";

  const primaryHref = logged ? "/assistente" : "/login";
  const primaryLabel = logged ? "Abrir Assistente" : "Entrar";

  return (
    <main className="container">
      <div
        className="card"
        style={{
          maxWidth: 920,
          margin: "0 auto",
          padding: 18,
          borderRadius: 22,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 36, letterSpacing: -0.7 }}>{title}</h1>
            <p className="muted" style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
              {subtitle}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              className="btn btnPrimary"
              href={primaryHref}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              ✨ {primaryLabel}
            </a>

            {logged && (
              <a className="btn" href="/dashboard" style={{ padding: "14px 16px", borderRadius: 14 }}>
                🧠 Dashboard
              </a>
            )}

            {isAdmin && (
              <a className="btn" href="/admin" style={{ padding: "14px 16px", borderRadius: 14 }}>
                ⚙️ Admin
              </a>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginTop: 6,
            }}
          >
            <div className="card" style={{ background: "rgba(0,0,0,0.22)", boxShadow: "none" }}>
              <div style={{ fontWeight: 900 }}>📄 Documentos</div>
              <div className="muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
                RG, CPF, CNH, benefícios e outros serviços — passo a passo e sem enrolação.
              </div>
            </div>
            <div className="card" style={{ background: "rgba(0,0,0,0.22)", boxShadow: "none" }}>
              <div style={{ fontWeight: 900 }}>📎 PDF e imagem</div>
              <div className="muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
                Anexe arquivos no chat e eu analiso junto com sua dúvida.
              </div>
            </div>
            <div className="card" style={{ background: "rgba(0,0,0,0.22)", boxShadow: "none" }}>
              <div style={{ fontWeight: 900 }}>🧠 Memória</div>
              <div className="muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
                Suas conversas ficam salvas por sessão, pra você continuar de onde parou.
              </div>
            </div>
          </div>

          <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
            Privacidade: não envie senhas, códigos de verificação ou dados sensíveis desnecessários.
          </div>
        </div>
      </div>
    </main>
  );
}
