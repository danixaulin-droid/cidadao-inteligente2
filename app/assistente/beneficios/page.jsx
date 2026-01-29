export const dynamic = "force-dynamic";

const glass = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const hero = {
  ...glass,
  borderRadius: 20,
  padding: 16,
  position: "relative",
  overflow: "hidden",
};

const heroGlow = {
  content: '""',
  position: "absolute",
  inset: -2,
  background:
    "radial-gradient(680px 240px at 12% 12%, rgba(16,163,127,0.22), transparent 60%), radial-gradient(560px 260px at 88% 18%, rgba(34,211,238,0.16), transparent 55%)",
  filter: "blur(12px)",
  pointerEvents: "none",
  opacity: 0.95,
};

export default function AssistenteBenefciosPage() {
  return (
    <main className="container">
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ ...hero }}>
          <div style={{ ...heroGlow }} />
          <div style={{ position: "relative", display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: 0.2 }}>
                Assistente • Benefícios
              </div>
              <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
                Vou te orientar passo a passo e, se você enviar prints/PDFs, eu analiso junto.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                className="btn btnPrimary"
                href="/assistente/chat?topic=beneficios"
                style={{ borderRadius: 14, padding: "12px 14px", fontWeight: 900 }}
              >
                🤖 Falar com a IA sobre Benefícios
              </a>
              <a className="btn" href="/assistente" style={{ borderRadius: 14 }}>
                Voltar
              </a>
              <a className="btn" href="/dashboard" style={{ borderRadius: 14 }}>
                Ver histórico
              </a>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>

        <div style={{ ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 900 }}>1) INSS (aposentadoria, auxílio, pensão)</div>
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>Consultar pendências, enviar documentos e entender próximos passos.</div>
        </div>

        <div style={{ ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 900 }}>2) Bolsa Família / CadÚnico</div>
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>Atualização cadastral, orientação e dúvidas.</div>
        </div>

        <div style={{ ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 900 }}>3) Outros benefícios</div>
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>Benefícios municipais/estaduais ou qualquer outro.</div>
        </div>
        </div>

        <div style={{ marginTop: 14, ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 950 }}>Passo a passo</div>
          <ol style={{ lineHeight: 1.8, marginTop: 10 }}>
            <li>Diga qual benefício: INSS, Bolsa Família/CadÚnico ou Outro.</li>
            <li>Informe sua UF e cidade (as regras mudam por local).</li>
            <li>Separe RG, CPF e comprovante de endereço.</li>
            <li>Se tiver NIS / número do benefício, informe ou envie foto/print.</li>
            <li>Se aparecer erro/pendência, envie print para eu interpretar.</li>
          </ol>
        </div>

        <div style={{ marginTop: 14, ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 950 }}>O que enviar no chat (se tiver)</div>
          <ul className="muted" style={{ marginTop: 8, lineHeight: 1.8 }}>
              <li>RG e CPF</li>
              <li>Comprovante de endereço</li>
              <li>NIS / cartão / número do benefício</li>
              <li>Print/foto de pendências, mensagens ou erros</li>
              <li>Documentos do caso (laudos/atestados), se houver</li>
          </ul>
          <div className="muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
            Você pode enviar PDF ou foto direto no chat (sem precisar ir para outro lugar).
          </div>
        </div>
      </div>
    </main>
  );
}
