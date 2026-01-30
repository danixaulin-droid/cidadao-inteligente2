import "./globals.css";
import PWARegister from "../components/PWARegister";
import Header from "./components/Header";
import HideOnRoutes from "../components/HideOnRoutes";

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
        <meta name="theme-color" content="#0b0f14" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>

      <body style={{ margin: 0, minHeight: "100dvh" }}>
        {/* ✅ Header some só no /assistente/chat */}
        <HideOnRoutes hidePrefixes={["/assistente/chat"]}>
          <Header />
        </HideOnRoutes>

        {/* ✅ Conteúdo:
            - normal: desconta header (72px)
            - chat: ocupa tela inteira e trava overflow */}
        <HideOnRoutes
          hidePrefixes={[]}
          render={(isChat) => (
            <main
              style={{
                minHeight: isChat ? "100dvh" : "calc(100dvh - 72px)",
                height: isChat ? "100dvh" : "auto",
                overflow: isChat ? "hidden" : "visible",
              }}
            >
              {children}
            </main>
          )}
        />

        <PWARegister />

        {/* ✅ Footer some só no /assistente/chat */}
        <HideOnRoutes hidePrefixes={["/assistente/chat"]}>
          <footer
            style={{
              padding: 16,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              marginTop: 24,
            }}
          >
            <div className="container">
              <small>© {new Date().getFullYear()} Cidadão Inteligente</small>
            </div>
          </footer>
        </HideOnRoutes>
      </body>
    </html>
  );
}
