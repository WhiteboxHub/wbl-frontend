// // frntend\app\layout.tsx
// "use client";
// import "node_modules/react-modal-video/css/modal-video.css";
// import "../styles/index.css";
// import Footer from "@/components/Footer";
// import Header from "@/components/Header";
// import ScrollToTop from "@/components/ScrollToTop";
// import { SessionProvider } from "next-auth/react";
// import { usePathname } from "next/navigation";
// import { Providers } from "./providers";
// import { AuthProvider } from "@/utils/AuthContext";

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname(); // Get the current pathname

//   // Check if the current route is part of the "/view" folder
//   const isViewSection = pathname.startsWith('/view');

//   return (
//     <html suppressHydrationWarning lang="en">
//       <head>
//         <title>Whitebox-Learning</title>
//         <meta content="width=device-width, initial-scale=1" name="viewport" />
//         <meta
//           name="description"
//           content="A comprehensive learning ecosystem tailored for developers, machine learning enthusiasts, and data engineers."
//         />
//         <link rel="icon" href="/favicon.ico" />
//         <link rel="canonical" href="https://whitebox-learning.com/" />
//       </head>
//       <body className="dark:bg-black">
//       <SessionProvider>
//         <AuthProvider>
//           <Providers>
//             {!isViewSection && <Header />} {/* Conditionally render Header */}
//             {children}
//             {!isViewSection && <Footer />} {/* Conditionally render Footer */}
//             {!isViewSection && <ScrollToTop />} {/* Conditionally render ScrollToTop */}
//           </Providers>
//         </AuthProvider>
//         </SessionProvider>
//       </body>
//     </html>
//   );
// }




// frontend/app/layout.tsx
"use client";

import "node_modules/react-modal-video/css/modal-video.css";
import "../styles/index.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Providers } from "./providers";
import { AuthProvider } from "@/utils/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isViewSection = pathname.startsWith("/view");

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

        {/* Font performance optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Optional: Load Google Font if used */}
        {/* <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" /> */}
      </head>
      <body className="dark:bg-black font-sans">
        <SessionProvider>
          <AuthProvider>
            <Providers>
              {!isViewSection && <Header />}
              {children}
              {!isViewSection && <Footer />}
              {!isViewSection && <ScrollToTop />}
            </Providers>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
