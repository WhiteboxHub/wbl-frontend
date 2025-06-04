
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

// import { useAuth } from "@/utils/AuthContext";


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

//             <Sidebar />
//             <main className="w-full">
//               {children}
//             </main>

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





// // app/layout.tsx
// import "../styles/index.css";
// import "react-modal-video/css/modal-video.css";
// import ClientProviders from "@/components/ClientProviders";
// import ClientLayout from "@/components/ClientLayout";

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
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
//         <ClientProviders>
//           <ClientLayout>{children}</ClientLayout>
//         </ClientProviders>
//       </body>
//     </html>
//   );
// }



/////6-4-2025



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
import { AuthProvider, useAuth } from "@/utils/AuthContext";
import { useState, useEffect } from "react";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isViewSection = pathname.startsWith('/view');
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isAuthenticated) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isAuthenticated]);

  return (
    <>
      {!isViewSection && <Header toggleSidebar={toggleSidebar} isOpen={isOpen} />}
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <main className="w-full">
        {children}
      </main>
      {!isViewSection && <Footer />}
      {!isViewSection && <ScrollToTop />}
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
              <LayoutContent>{children}</LayoutContent>
            </Providers>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );

}


