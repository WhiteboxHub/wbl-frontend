'use client';

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect, useMemo, useCallback } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isViewSection = pathname.startsWith("/view");
  const isCoderpad = pathname.startsWith("/coderpad");

  const [holdLoad, setHoldLoad] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);


  
  useEffect(() => {
    const timer = setTimeout(() => setHoldLoad(true), 600);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setHasMounted(true);

    const isDev = process.env.NODE_ENV === "development";
    if (isDev && typeof window !== "undefined" && "PerformanceObserver" in window) {
      let observer: PerformanceObserver | null = null;
      try {
        observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries && entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            if (lastEntry && typeof lastEntry.startTime === "number") {
              console.log(
                "Largest Contentful Paint:",
                Math.round(lastEntry.startTime),
                "ms"
              );
            }
          }
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {}

      return () => {
        if (observer) {
          try {
            observer.disconnect();
          } catch {}
        }
      };
    }
  }, []);

  if (!hasMounted) return null;

  return holdLoad ? (
    <>
      {!isViewSection && !isCoderpad && <Header />}
      {!isViewSection && !isCoderpad && (
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      )}
      {/* <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} /> */}
      <main className="w-full">{children}</main>
      {!isViewSection && !isCoderpad && <Footer />}
      {!isViewSection && !isCoderpad && <ScrollToTop />}
    </>
  ) : null;
}
