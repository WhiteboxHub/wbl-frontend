"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider 
      attribute="class" 
      enableSystem={false} 
      defaultTheme="light"
      storageKey="theme"
      disableTransitionOnChange
    >
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </ThemeProvider>
  );
}
