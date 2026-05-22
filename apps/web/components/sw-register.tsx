"use client";

import { useEffect } from "react";

// Registers the service worker in production only, after load, behind a
// feature guard. Kept out of dev so it never interferes with HMR.
//
// In dev we do the opposite: actively unregister any SW left over from a prior
// prod visit and wipe its caches. The SW caches /_next/static chunks
// cache-first, and dev chunk paths are stable — so a stale SW would serve old
// bundles forever and HMR/reloads wouldn't help.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration failures are non-fatal */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
