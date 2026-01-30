"use client";

import { usePathname } from "next/navigation";

export default function HideOnRoutes({
  hidePrefixes = [],
  children,
  render,
}) {
  const pathname = usePathname() || "/";

  const isHidden = hidePrefixes.some((p) => pathname.startsWith(p));

  if (typeof render === "function") {
    return render(isHidden);
  }

  if (isHidden) return null;
  return children;
}
