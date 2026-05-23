"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CapacitorBridge() {
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setup() {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // On home page — minimize app instead of exiting
            App.minimizeApp?.().catch(() => App.exitApp());
          }
        });
        cleanup = () => handle.remove();
      } catch {
        // Not running in Capacitor (browser) — no-op
      }
    }

    setup();
    return () => cleanup?.();
  }, [router]);

  return null;
}
