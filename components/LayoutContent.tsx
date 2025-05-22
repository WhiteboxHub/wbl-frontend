// components/LayoutContent.tsx
"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
// import Sidebar from "@/components/Sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/app/providers";
import { AuthProvider } from "@/utils/AuthContext";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isViewSection = pathname.startsWith("/view");

  return (
    <SessionProvider>
      <AuthProvider>
        <Providers>
          {!isViewSection && <Header />}
          {/* <Sidebar /> */}
          <main className="w-full">{children}</main>
          {!isViewSection && <Footer />}
          {!isViewSection && <ScrollToTop />}
        </Providers>
      </AuthProvider>
    </SessionProvider>
  );
}
