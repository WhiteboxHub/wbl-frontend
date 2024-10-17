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

// original 


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
//         <AuthProvider>
//           {" "}
//           {/* Wrap the entire application with AuthProvider */}
//           {" "}
//           {/* Wrap the entire application with AuthProvider */}
//           <Providers>
//             <Header />
//             <Header />
//             {children}
//             <Footer />
//             <ScrollToTop />
//             <Footer />
//             <ScrollToTop />
//           </Providers>
         
         
//         </AuthProvider>
//       </body>
//     </html>
//   );
// }
// // app/layout.tsx


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
            {children}
            {!isViewSection && <Footer />} {/* Conditionally render Footer */}
            {!isViewSection && <ScrollToTop />} {/* Conditionally render ScrollToTop */}
          </Providers>
        </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
