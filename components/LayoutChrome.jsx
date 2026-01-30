"use client";

import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/components/Footer";

export default function LayoutChrome({ children }) {
  const pathname = usePathname() || "";

  const isChat =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/assistente/chat") ||
    pathname.startsWith("/assistente");

  return (
    <>
      {!isChat && <Header />}

      <main
        style={{
          minHeight: "100dvh",
          height: isChat ? "100dvh" : "auto",

          /* 🔑 AQUI ESTÁ A CORREÇÃO */
          overflowY: isChat ? "hidden" : "auto",
          overflowX: "hidden",

          WebkitOverflowScrolling: "touch", // iOS / PWA
        }}
      >
        {children}
      </main>

      {!isChat && <Footer />}
    </>
  );
}
