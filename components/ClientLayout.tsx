"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/app/providers";
import { AuthProvider } from "@/utils/AuthContext";
import dynamic from "next/dynamic";
import { useState, Suspense } from "react";

const Header = dynamic(() => import("@/components/Header"), {
  ssr: true,
});

const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: true,
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
