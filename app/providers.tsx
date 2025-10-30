"use client";

import { ThemeProvider } from "next-themes";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={true}
      defaultTheme="system"
      storageKey="theme"
      disableTransitionOnChange={true}
      enableColorScheme={true}
      themes={["light", "dark"]}
      forcedTheme={undefined}
    >
      {children}
    </ThemeProvider>
  );
}
