"use client";

import { useEffect } from "react";

/** Registers the PWA service worker (silent failure is fine for dev). */
export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
