import "./globals.css";
import PWARegister from "../components/PWARegister";
import LayoutChrome from "../components/LayoutChrome";
import ViewportHeightFix from "../components/ViewportHeightFix";

export const metadata = {
  title: "Cidadão Inteligente",
  description: "Seu assistente para documentos e serviços",
  manifest: "/manifest.webmanifest",
};

// ✅ Next 15: themeColor vai em viewport
export const viewport = {
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

      {/* 🔧 Importante: height/minHeight usando variável do app (PWA) */}
      <body style={{ margin: 0, minHeight: "var(--app-h, 100dvh)" }}>
        <ViewportHeightFix />
        <LayoutChrome>{children}</LayoutChrome>
        <PWARegister />
      </body>
    </html>
  );
}
