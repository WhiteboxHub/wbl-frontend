// frntend\app\layout.tsx
"use client";
import "node_modules/react-modal-video/css/modal-video.css";
import "../styles/index.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Providers } from "./providers";
import { AuthProvider } from "@/utils/AuthContext";
import { useAuth } from "@/utils/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get the current pathname

  // Check if the current route is part of the "/view" folder
  const isViewSection = pathname.startsWith('/view');

  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <title>Whitebox-Learning</title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta
          name="description"
          content="A comprehensive learning ecosystem tailored for developers, machine learning enthusiasts, and data engineers."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://whitebox-learning.com/" />
      </head>
      <body className="dark:bg-black">
      <SessionProvider>
        <AuthProvider>
          <Providers>
            {!isViewSection && <Header />} {/* Conditionally render Header */}
            <Sidebar />
            <main className="w-full">
              {children}
            </main>
            {!isViewSection && <Footer />} {/* Conditionally render Footer */}
            {!isViewSection && <ScrollToTop />} {/* Conditionally render ScrollToTop */}
          </Providers>
        </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

// import "../styles/index.css"; // Tailwind + external styles (e.g. modal-video)
// import { SessionProvider } from "next-auth/react";
// import { Providers } from "./providers";
// import { AuthProvider } from "@/utils/AuthContext";
// import LayoutShell from "@/components/LayoutShell";
// import { Inter } from "next/font/google";

// // Load font using Next.js Font Optimization
// const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "Whitebox-Learning",
//   description:
//     "A comprehensive learning ecosystem tailored for developers, machine learning enthusiasts, and data engineers.",
//   icons: {
//     icon: "/favicon.ico",
//   },
//   viewport: "width=device-width, initial-scale=1",
//   alternates: {
//     canonical: "https://whitebox-learning.com/",
//   },
// };

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <head />
//       <body className={`${inter.className} dark:bg-black`}>
//         <SessionProvider>
//           <AuthProvider>
//             <Providers>
//               <LayoutShell>{children}</LayoutShell>
//             </Providers>
//           </AuthProvider>
//         </SessionProvider>
//       </body>
//     </html>
//   );
// }