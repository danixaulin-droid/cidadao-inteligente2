import "./globals.css";
import PWARegister from "../components/PWARegister";

export const metadata = {
  title: "Cidadão Inteligente",
  description: "Seu assistente para documentos e serviços",
  manifest: "/manifest.webmanifest",
  themeColor: "#0b0f14",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* PWA / Install */}
        <meta name="theme-color" content="#0b0f14" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>

      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ❌ HEADER REMOVIDO */}

        {/* ✅ Conteúdo ocupa a tela toda */}
        <main style={{ flex: 1, minHeight: 0 }}>
          {children}
        </main>

        <PWARegister />

        {/* ❌ Footer removido para experiência tipo ChatGPT */}
      </body>
    </html>
  );
}
