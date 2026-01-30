"use client";

import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/components/Footer";

export default function LayoutChrome({ children }) {
  const pathname = usePathname() || "";

  const isChat =
    pathname.startsWith("/chat") || pathname.startsWith("/assistente/chat");

  return (
    <>
      {!isChat && <Header />}

      <main
        style={{
          minHeight: isChat ? "100dvh" : "calc(100dvh - 72px)",
          height: isChat ? "100dvh" : "auto",
          overflow: isChat ? "hidden" : "visible",
        }}
      >
        {children}
      </main>

      {!isChat && <Footer />}
    </>
  );
}
