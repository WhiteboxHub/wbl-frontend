"use client";

import React, { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeProvider } from "next-themes";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { AIPrepTelemetry } from "@/lib/telemetry";

if (typeof window !== "undefined") {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (posthogKey && !posthog.__loaded) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: "identified_only",
      capture_pageview: false, // Manual pageview capture handled via PostHogPageView
      disable_session_recording: true,
      enable_recording_console_log: false,
      autocapture: false,
    });
  }

  // Init global telemetry once
  if (!(window as any).__aiprep_telemetry_init) {
    (window as any).__aiprep_telemetry_init = true;
    AIPrepTelemetry.initGlobalErrorListeners();
    AIPrepTelemetry.initUxFrictionTracker();
    AIPrepTelemetry.initCoreWebVitalsTracker();
  }
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <ThemeProvider attribute="class" enableSystem={false} defaultTheme="light">
        {children}
      </ThemeProvider>
    </PostHogProvider>
  );
}

