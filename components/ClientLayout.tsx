"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/app/providers";
import { AuthProvider } from "@/utils/AuthContext";
import dynamic from "next/dynamic";
import { useState, Suspense, useEffect } from "react";

const Header = dynamic(() => import("@/components/Header"), {
  ssr: true,
  loading: () => (
    <header
      className="header absolute left-0 top-0 z-40 flex w-full items-center bg-transparent"
      style={{ minHeight: "80px" }}
    >
      <div className="container mt-5">
        <div className="relative -mx-4 flex items-center justify-between">
          <div className="max-w-full px-4 xl:mr-12">
            <div className="h-[50px] w-[50px] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </header>
  ),
});

const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
  loading: () => null,
});

const ScrollToTop = dynamic(() => import("@/components/ScrollToTop"), {
  ssr: false,
  loading: () => null,
});

const Sidebar = dynamic(() => import("@/components/Sidebar"), {
  ssr: false,
  loading: () => null,
});

const ReferralNotificationButton = dynamic(
  () => import("@/components/ReferralNotificationButton"),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAvatarSection = pathname?.startsWith("/avatar");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.classList.add("hydrated");

      if (process.env.NODE_ENV === "development") {
        console.log("React hydration complete");

        if (window.performance) {
          const loadTime = performance.now();
          console.log("Time to hydration:", Math.round(loadTime), "ms");

          const paintMetrics = performance.getEntriesByType("paint");
          const fcp = paintMetrics.find(
            (entry) => entry.name === "first-contentful-paint"
          );
          if (fcp) {
            console.log(
              "First Contentful Paint:",
              Math.round(fcp.startTime),
              "ms"
            );
          }

          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log(
              "Largest Contentful Paint:",
              Math.round(lastEntry.startTime),
              "ms"
            );
          });
          observer.observe({ entryTypes: ["largest-contentful-paint"] });
        }
      }
    }
  }, []);

  return (
    <SessionProvider>
      <AuthProvider>
        <Providers>
          {isAvatarSection ? (
            <>{children}</>
          ) : (
            <>
              <Header />
              <Suspense fallback={null}>
                <Sidebar
                  isOpen={isOpen}
                  toggleSidebar={() => setIsOpen(!isOpen)}
                />
              </Suspense>
              <main className="w-full">{children}</main>
              <Footer />
              <Suspense fallback={null}>
                <ScrollToTop />
                <ReferralNotificationButton />
              </Suspense>
            </>
          )}
        </Providers>
      </AuthProvider>
    </SessionProvider>
  );
}
