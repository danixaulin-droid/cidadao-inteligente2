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
        {/* ✅ Header some apenas no /chat */}
        <HideOnRoutes hidePrefixes={["/chat"]}>
          <Header />
        </HideOnRoutes>

        {/* ✅ Main ajusta altura automaticamente:
            - normal: desconta header
            - chat: ocupa 100dvh sem buraco */}
        <HideOnRoutes
          hidePrefixes={[]}
          render={(isHidden) => (
            <main
              style={{
                minHeight: isHidden ? "100dvh" : "calc(100dvh - 72px)",
                height: isHidden ? "100dvh" : "auto",
                overflow: isHidden ? "hidden" : "visible",
              }}
            >
              {children}
            </main>
          )}
        />

        <PWARegister />

        {/* ✅ Footer some apenas no /chat */}
        <HideOnRoutes hidePrefixes={["/chat"]}>
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
