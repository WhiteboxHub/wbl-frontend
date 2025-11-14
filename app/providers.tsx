"use client";

import { ThemeProvider } from "next-themes";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      defaultTheme="light"
      storageKey="theme"
      disableTransitionOnChange={true}
      enableColorScheme={true}
      themes={["light", "dark"]}
    >
      {children}
    </ThemeProvider>
  );
}
