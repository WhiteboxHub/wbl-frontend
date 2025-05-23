// components/ClientProviders.tsx
'use client';

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/utils/AuthContext";
import { Providers } from "@/app/providers";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <Providers>{children}</Providers>
      </AuthProvider>
    </SessionProvider>
  );
}