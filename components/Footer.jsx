"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const hide = pathname?.startsWith("/assistente/chat");

  if (hide) return null;

  return (
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
  );
}
