"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/app/providers";
import { AuthProvider } from "@/utils/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/Sidebar";
import ReferralNotificationButton from "@/components/ReferralNotificationButton";
import { useState, useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAvatarSection = pathname.startsWith("/avatar");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash by showing nothing until mounted
  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider>
      <AuthProvider>
        <Providers>
          {isAvatarSection ? (
            <>{children}</>
          ) : (
            <>
              <Header />
              <Sidebar
                isOpen={isOpen}
                toggleSidebar={() => setIsOpen(!isOpen)}
              />
              <main className="w-full">{children}</main>
              <Footer />
              <ScrollToTop />
              <ReferralNotificationButton />
            </>
          )}
        </Providers>
      </AuthProvider>
    </SessionProvider>
  );
}
