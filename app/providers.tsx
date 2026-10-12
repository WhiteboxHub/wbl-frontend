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
    if (!(posthog as any).__loaded) return;

    posthog.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}`,
    });
  }, [pathname]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    if (posthogKey && !(posthog as any).__loaded) {
      try {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          person_profiles: "identified_only",
          capture_pageview: false, // Manual pageview capture handled via PostHogPageView
          disable_session_recording: true,
          enable_recording_console_log: false,
          disable_surveys: true,
          autocapture: false,
        });
      } catch (_) {}
    }

    // Init global telemetry once safely
    if (!(window as any).__aiprep_telemetry_init) {
      try {
        AIPrepTelemetry.initGlobalErrorListeners();
        AIPrepTelemetry.initUxFrictionTracker();
        AIPrepTelemetry.initCoreWebVitalsTracker();
        (window as any).__aiprep_telemetry_init = true;
      } catch (_) {}
    }

    setMounted(true);
  }, []);

  const hasPostHog = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

  const content = (
    <>
      {hasPostHog && (
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
      )}
      {children}
    </>
  );

  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="light">
      {mounted && hasPostHog ? (
        <PostHogProvider client={posthog}>{content}</PostHogProvider>
      ) : (
        content
      )}
    </ThemeProvider>
  );
}

