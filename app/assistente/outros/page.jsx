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

export default function AssistenteOutrosPage() {
  return (
    <main className="container">
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ ...hero }}>
          <div style={{ ...heroGlow }} />
          <div style={{ position: "relative", display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: 0.2 }}>
                Assistente • Outros
              </div>
              <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
                Qualquer dúvida que não se encaixa nas categorias acima.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                className="btn btnPrimary"
                href="/assistente/chat?topic=outros"
                style={{ borderRadius: 14, padding: "12px 14px", fontWeight: 900 }}
              >
                🤖 Falar com a IA sobre Outros
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
          <div style={{ fontWeight: 900 }}>1) Documentos em geral</div>
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>Certidões, comprovantes, segunda via, taxas etc.</div>
        </div>

        <div style={{ ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 900 }}>2) Sites e apps do governo</div>
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>Erros, mensagens e como resolver.</div>
        </div>

        <div style={{ ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 900 }}>3) Orientação por cidade/UF</div>
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>Eu adapto o passo a passo ao seu estado.</div>
        </div>
        </div>

        <div style={{ marginTop: 14, ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 950 }}>Passo a passo</div>
          <ol style={{ lineHeight: 1.8, marginTop: 10 }}>
            <li>Explique em uma frase o que você quer resolver.</li>
            <li>Diga UF e cidade.</li>
            <li>Se tiver print/arquivo, envie no chat.</li>
            <li>Eu te digo os próximos passos e o que falta.</li>
          </ol>
        </div>

        <div style={{ marginTop: 14, ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 950 }}>O que enviar no chat (se tiver)</div>
          <ul className="muted" style={{ marginTop: 8, lineHeight: 1.8 }}>
              <li>Print/foto do problema</li>
              <li>PDFs/arquivos relacionados</li>
              <li>Dados básicos (UF/cidade)</li>
          </ul>
          <div className="muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
            Você pode enviar PDF ou foto direto no chat (sem precisar ir para outro lugar).
          </div>
        </div>
      </div>
    </main>
  );
}
