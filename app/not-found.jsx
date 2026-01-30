export const viewport = {
  themeColor: "#0b0f14",
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1>Página não encontrada</h1>

        <p className="muted" style={{ marginTop: 8 }}>
          O endereço que você tentou acessar não existe.
        </p>

        <a
          className="btn btnPrimary"
          href="/"
          style={{ marginTop: 16, display: "inline-block" }}
        >
          Voltar para Home
        </a>
      </div>
    </main>
  );
}
