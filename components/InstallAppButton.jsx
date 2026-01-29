"use client";
import { useEffect, useState } from "react";

export default function InstallAppButton() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt) return null;

  return (
    <button
      className="btn btnPrimary"
      onClick={async () => {
        prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
      }}
    >
      📲 Baixar aplicativo
    </button>
  );
}
