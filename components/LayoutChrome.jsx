"use client";

import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/components/Footer";

export default function LayoutChrome({ children }) {
  const pathname = usePathname() || "";

  // Detecta qualquer rota de chat
  const isChat =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/assistente/chat") ||
    pathname.startsWith("/assistente");

  return (
    <>
      {/* Header só fora do chat */}
      {!isChat && <Header />}

      <main
        style={{
          // Home e páginas normais crescem
          minHeight: isChat ? "100dvh" : "auto",

          // Chat ocupa a viewport inteira
          height: isChat ? "100dvh" : "auto",

          // 🔑 REGRA DE OURO
          overflowY: isChat ? "hidden" : "auto",
          overflowX: "hidden",

          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </main>

      {/* Footer só fora do chat */}
      {!isChat && <Footer />}
    </>
  );
}
