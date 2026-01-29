export default function NotFound() {
  return (
    <main className="container">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1>Página não encontrada</h1>
        <p className="muted">
          O endereço que você tentou acessar não existe.
        </p>

        <a className="btn" href="/">
          Voltar para Home
        </a>
      </div>
    </main>
  );
}
