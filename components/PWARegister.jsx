'use client';

import { useEffect, useState } from 'react';

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    /* ===============================
       1) REGISTRA SERVICE WORKER
       =============================== */
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    /* ===============================
       2) DETECTA SE JÁ ESTÁ INSTALADO
       =============================== */
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    /* ===============================
       3) CAPTURA EVENTO DE INSTALAÇÃO
       =============================== */
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
  }

  /* ===============================
     NÃO MOSTRA SE NÃO PODE / JÁ INSTALOU
     =============================== */
  if (!canInstall || installed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 100,
        maxWidth: 720,
        margin: '0 auto',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(8,10,22,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: 14,
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 15 }}>
          📲 Instalar aplicativo
        </div>
        <div
          style={{
            opacity: 0.75,
            fontSize: 12,
            marginTop: 4,
            lineHeight: 1.35,
          }}
        >
          Instale o <b>Cidadão Inteligente</b> no seu celular e use como um app
          de verdade, em tela cheia.
        </div>
      </div>

      <button
        onClick={installApp}
        className="btn btnPrimary"
        style={{
          borderRadius: 14,
          whiteSpace: 'nowrap',
          fontWeight: 900,
        }}
      >
        Baixar app
      </button>
    </div>
  );
}
