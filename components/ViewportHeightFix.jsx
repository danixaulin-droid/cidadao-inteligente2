"use client";

import { useEffect } from "react";

export default function ViewportHeightFix() {
  useEffect(() => {
    const setAppHeight = () => {
      // innerHeight é o que “de verdade” cabe no PWA
      const h = window.innerHeight || 0;
      document.documentElement.style.setProperty("--app-h", `${h}px`);
    };

    setAppHeight();

    // resize/orientation e também quando volta do background
    window.addEventListener("resize", setAppHeight);
    window.addEventListener("orientationchange", setAppHeight);
    document.addEventListener("visibilitychange", setAppHeight);

    return () => {
      window.removeEventListener("resize", setAppHeight);
      window.removeEventListener("orientationchange", setAppHeight);
      document.removeEventListener("visibilitychange", setAppHeight);
    };
  }, []);

  return null;
}
