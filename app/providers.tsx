"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { AIPrepTelemetry } from "@/lib/telemetry";


function PostHogPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;
    if (typeof posthog === "undefined" || !(posthog as any)?.__loaded) return;

    try {
      posthog.capture("$pageview", {
        $current_url: `${window.location.origin}${pathname}`,
      });
    } catch (err) {
      console.warn("[PostHogPageView] Failed to capture pageview:", err);
    }
  }, [pathname]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isPostHogInitialized, setIsPostHogInitialized] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    async function init() {
      // Safely derive process from global scope or window fallback for non-Node environments
      const safeProcess =
        typeof globalThis !== "undefined" && (globalThis as any).process
          ? (globalThis as any).process
          : typeof window !== "undefined" && (window as any).process
          ? (window as any).process
          : { env: {} };

      let rawKey = safeProcess?.env?.NEXT_PUBLIC_POSTHOG_KEY;
      let rawHost = safeProcess?.env?.NEXT_PUBLIC_POSTHOG_HOST;

      // If build-time key is not present, fetch runtime config from server (Cloud Run)
      if (!rawKey && typeof window !== "undefined") {
        try {
          const res = await fetch("/api/config");
          if (res.ok) {
            const cfg = await res.json();
            if (cfg?.posthogKey) rawKey = cfg.posthogKey;
            if (cfg?.posthogHost) rawHost = cfg.posthogHost;
          }
        } catch (_) {}
      }

      const posthogHost =
        typeof rawHost === "string" && rawHost.trim().length > 0
          ? rawHost.trim()
          : "https://us.i.posthog.com";

      // 1. Validate dependencies
      const hasPostHogLib =
        typeof posthog !== "undefined" && typeof posthog.init === "function";

      // 2. Validate PostHog configuration environment variables
      const isValidKey =
        typeof rawKey === "string" &&
        rawKey.trim().length > 0 &&
        /^phc_[A-Za-z0-9_-]+$/.test(rawKey.trim());

      const isNonProd =
        safeProcess?.env?.NODE_ENV !== "production";

      if (!hasPostHogLib) {
        if (isNonProd) {
          console.warn("[Providers] PostHog library is not available; analytics disabled.");
        }
        if (isSubscribed) setIsPostHogInitialized(false);
      } else if (!rawKey) {
        if (isNonProd) {
          console.warn("[Providers] NEXT_PUBLIC_POSTHOG_KEY environment variable is missing; analytics disabled.");
        }
        if (isSubscribed) setIsPostHogInitialized(false);
      } else if (!isValidKey) {
        if (isNonProd) {
          console.warn("[Providers] NEXT_PUBLIC_POSTHOG_KEY is malformed; PostHog analytics disabled.");
        }
        if (isSubscribed) setIsPostHogInitialized(false);
      } else {
        try {
          if ((posthog as any)?.__loaded) {
            if (isSubscribed) setIsPostHogInitialized(true);
          } else {
            posthog.init(rawKey.trim(), {
              api_host: posthogHost,
              person_profiles: "identified_only",
              capture_pageview: false, // Manual pageview capture handled via PostHogPageView
              disable_session_recording: true,
              enable_recording_console_log: false,
              disable_surveys: true,
              autocapture: false,
              advanced_disable_feature_flags_on_first_load: true,
              loaded: () => {
                if (isSubscribed) {
                  setIsPostHogInitialized(true);
                }
              },
            });
          }
        } catch (err) {
          console.error("[Providers] PostHog initialization error:", err);
          if (isSubscribed) setIsPostHogInitialized(false);
        }
      }

      // Route-scoped telemetry: only attach listeners on AI Prep routes
      if (typeof window !== "undefined" && !(window as any).__aiprep_telemetry_init) {
        const currentPath = window.location.pathname;
        const isAiPrepRoute = currentPath.includes('/aiprep') || currentPath.includes('/user_dashboard/ai-prep');
        if (isAiPrepRoute) {
          try {
            AIPrepTelemetry.initGlobalErrorListeners();
            AIPrepTelemetry.initUxFrictionTracker();
            AIPrepTelemetry.initCoreWebVitalsTracker();
            (window as any).__aiprep_telemetry_init = true;
          } catch (err) {
            console.warn("[Providers] Telemetry listeners initialization failed:", err);
          }
        }
      }
      if (isSubscribed) {
        setMounted(true);
      }
    }

    init();

    return () => {
      isSubscribed = false;
    };
  }, [
    setIsPostHogInitialized,
    setMounted,
  ]);

  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="light">
      <PostHogProvider client={posthog}>
        {isPostHogInitialized && (
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
        )}
        {children}
      </PostHogProvider>
    </ThemeProvider>
  );
}

