"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Never register in development — the SW caches /_next/ bundles cache-first
    // and serves stale chunks across rebuilds, which makes HMR look broken and
    // produces frankenstein renders mixing old + new code.
    if (process.env.NODE_ENV !== "production") {
      // If a previous dev session left an SW registered, unregister it so the
      // cached bundles stop hijacking the page.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive; registration failures should not block the app.
    });
  }, []);

  return null;
}
