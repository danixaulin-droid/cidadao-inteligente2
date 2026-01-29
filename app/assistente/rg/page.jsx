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

export default function AssistenteRgPage() {
  return (
    <main className="container">
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ ...hero }}>
          <div style={{ ...heroGlow }} />
          <div style={{ position: "relative", display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: 0.2 }}>
                Assistente • RG
              </div>
              <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
                Ajudo com 1ª via, 2ª via, agendamento e documentos necessários.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                className="btn btnPrimary"
                href="/assistente/chat?topic=rg"
                style={{ borderRadius: 14, padding: "12px 14px", fontWeight: 900 }}
              >
                🤖 Falar com a IA sobre RG
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
          <div style={{ fontWeight: 900 }}>1) Primeira via</div>
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>O que levar e como solicitar na sua cidade/estado.</div>
        </div>

        <div style={{ ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 900 }}>2) Segunda via</div>
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>Motivos, taxas/isenção e prazo.</div>
        </div>

        <div style={{ ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 900 }}>3) Agendamento</div>
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>Como marcar e quais comprovantes ajudam.</div>
        </div>
        </div>

        <div style={{ marginTop: 14, ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 950 }}>Passo a passo</div>
          <ol style={{ lineHeight: 1.8, marginTop: 10 }}>
            <li>Diga sua UF e cidade.</li>
            <li>Diga se é 1ª via ou 2ª via.</li>
            <li>Se for 2ª via, diga o motivo (perda/roubo/atualização).</li>
            <li>Separe certidão (nascimento/casamento), CPF e comprovante de endereço.</li>
            <li>Se tiver print do site/app, envie no chat.</li>
          </ol>
        </div>

        <div style={{ marginTop: 14, ...glass, borderRadius: 18, padding: 14 }}>
          <div style={{ fontWeight: 950 }}>O que enviar no chat (se tiver)</div>
          <ul className="muted" style={{ marginTop: 8, lineHeight: 1.8 }}>
              <li>Certidão de nascimento/casamento</li>
              <li>CPF (se tiver)</li>
              <li>Comprovante de endereço</li>
              <li>Boletim de ocorrência (se for roubo/furto)</li>
              <li>Prints de erro/pedidos</li>
          </ul>
          <div className="muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
            Você pode enviar PDF ou foto direto no chat (sem precisar ir para outro lugar).
          </div>
        </div>
      </div>
    </main>
  );
}
