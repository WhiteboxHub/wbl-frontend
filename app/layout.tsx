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
import { useEffect, useState } from "react";
import { PulseLoader } from "react-spinners"; // using nice loader

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isViewSection = pathname.startsWith("/view");

  const [isHydrated, setIsHydrated] = useState(false);

  // useEffect(() => {
  //   setIsHydrated(true);
  // }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 1000); // 1 seconds delay

    return () => clearTimeout(timer);
  }, []);


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
        {/* Preload CSS */}
        <link rel="preload" href="/styles/index.css" as="style" />
      </head>
      <body className="dark:bg-black relative">

        {/* --- Global Loader --- */}
        {!isHydrated && (
          <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-white to-gray-200 dark:from-black dark:to-gray-900 transition-opacity duration-1000 ${isHydrated ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <PulseLoader color="#7f52f9" size={40} speedMultiplier={0.7} /> {/* Beautiful dots bouncing */}
            {/* <p className="mt-4 text-gray-800 dark:text-gray-300  animate-pulse text-2xl font-semibold">Loading  whitebox-learning...</p> */}
            <p className="mt-4 text-gray-800 dark:text-gray-300 animate-fadeInOutColor text-2xl font-semibold">
              Loading whitebox-learning...
            </p>

          </div>
        )}

        {/* --- Main App Content --- */}
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
