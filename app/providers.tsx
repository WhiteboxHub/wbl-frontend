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

    const rawKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const rawHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
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

    if (!hasPostHogLib) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Providers] PostHog library is not available; analytics disabled.");
      }
      if (isSubscribed) setIsPostHogInitialized(false);
    } else if (!rawKey) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Providers] NEXT_PUBLIC_POSTHOG_KEY environment variable is missing; analytics disabled.");
      }
      if (isSubscribed) setIsPostHogInitialized(false);
    } else if (!isValidKey) {
      if (process.env.NODE_ENV !== "production") {
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

    // Init global telemetry once safely
    if (typeof window !== "undefined" && !(window as any).__aiprep_telemetry_init) {
      try {
        AIPrepTelemetry.initGlobalErrorListeners();
        AIPrepTelemetry.initUxFrictionTracker();
        AIPrepTelemetry.initCoreWebVitalsTracker();
        (window as any).__aiprep_telemetry_init = true;
      } catch (err) {
        console.warn("[Providers] Telemetry listeners initialization failed:", err);
      }
    }

    if (isSubscribed) {
      setMounted(true);
    }

    return () => {
      isSubscribed = false;
    };
  }, [
    process.env.NEXT_PUBLIC_POSTHOG_KEY,
    process.env.NEXT_PUBLIC_POSTHOG_HOST,
    setIsPostHogInitialized,
  ]);

  const content = (
    <>
      {isPostHogInitialized && (
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
      )}
      {children}
    </>
  );

  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="light">
      {mounted && isPostHogInitialized ? (
        <PostHogProvider client={posthog}>{content}</PostHogProvider>
      ) : (
        content
      )}
    </ThemeProvider>
  );
}

