import "../styles/index.css";
import { Inter } from "next/font/google";
import Script from "next/script";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ClientLayout from "@/components/ClientLayout";
import { getCriticalCSS } from "@/lib/critical-css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  adjustFontFallback: true,
  variable: "--font-inter",
});

export const metadata = {
  title: "Whitebox-Learning - AIML Training and Placements in Bay area",
  description:
    "A comprehensive learning ecosystem tailored for developers, machine learning enthusiasts, and data engineers.",
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: "https://whitebox-learning.com/",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en" className={inter.variable}>
      <head>
        <style
          dangerouslySetInnerHTML={{ __html: getCriticalCSS() }}
          data-href="critical-css"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                
                  const theme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = theme === 'dark' || (!theme && systemPrefersDark);
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  
                  if (!theme) {
                    localStorage.setItem('theme', isDark ? 'dark' : 'light');
                  }
                } catch (e) {
                  console.error('Theme initialization error:', e);
                }
              })();
            `,
          }}
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" />

        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Poppins:wght@400;500;600;700&display=swap"
        />

        <link
          rel="stylesheet"
          href="https://unpkg.com/ag-grid-community@latest/styles/ag-grid.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/ag-grid-community@latest/styles/ag-theme-alpine.css"
        />

        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
      </head>

      <body className={`${inter.className} dark:bg-black`}>
        <GoogleAnalytics />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}