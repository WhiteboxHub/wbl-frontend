// components/ClientLayout.tsx
'use client';

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isViewSection = pathname.startsWith("/view");

  return (
    <>
      {!isViewSection && <Header />}
      {children}
      {!isViewSection && <Footer />}
      {!isViewSection && <ScrollToTop />}
    </>
  );
}
