import "./globals.css";
import PWARegister from "../components/PWARegister";
import Header from "./components/Header";
import HideOnRoutes from "../components/HideOnRoutes";
import Footer from "../components/Footer";

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
        {/* Header não aparece no chat */}
        <HideOnRoutes hidePrefixes={["/chat", "/assistente/chat"]}>
          <Header />
        </HideOnRoutes>

        {/* Main controla altura corretamente */}
        <HideOnRoutes
          hidePrefixes={["/chat", "/assistente/chat"]}
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

        {/* Footer único do app */}
        <Footer />
      </body>
    </html>
  );
}
